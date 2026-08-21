import { createCashMovement, fetchBankTransactions } from '@/api/bankAccounts';
import { fetchEntryDetail } from '@/api/ledger';
import { listOfficialSubjects } from '@/api/subjects';
import type { BankSettleEventDto, EntryDetailResult } from '@/api/types';
import type { BankTxnRow, LinkedLedgerTxn, NewBankTransactionInput } from './types';

/** 每次向後端要的分頁筆數；先取第一頁探出 total，若還有剩才補抓，避免小帳戶多打一次 API */
const FETCH_PAGE_SIZE = 100;

/** 取得科目 id → 名稱對照表（比照帳簿頁 mapPayableItemsToRows 的科目反查作法） */
async function loadSubjectNameMap(): Promise<Map<number, string>> {
  const subjectList = await listOfficialSubjects();
  const subjectNameById = new Map<number, string>();
  subjectList.forEach(subject => subjectNameById.set(subject.id, subject.name));
  return subjectNameById;
}

/** 交易對象顯示文字：優先取廠商名稱，取不到（空字串）則回退備註，兩者皆空再用
 *  primaryOfficialAccountingSubjectId 反查科目名稱頂替；
 *  關聯多筆帳簿交易時（originLedgerUuids 超過一筆）在文字後補「等」，提示還有其他關聯交易 */
function resolveCounterpartyLabel(item: BankSettleEventDto, subjectNameById: Map<number, string>): string {
  const base = item.counterpartyName || item.memo || subjectNameById.get(item.primaryOfficialAccountingSubjectId) || '—';
  return item.originLedgerUuids.length > 1 && base !== '—' ? `${base}等` : base;
}

function mapSettleEventToRow(item: BankSettleEventDto, subjectNameById: Map<number, string>): BankTxnRow {
  const isDeposit = item.cashDirection === 0;
  return {
    settleEventUuid: item.settleEventUuid,
    paymentDate: item.paymentDate,
    reconMethod: item.reconMethod,
    side: item.side,
    counterpartyLabel: resolveCounterpartyLabel(item, subjectNameById),
    settleAmount: item.settleAmount,
    cashAmount: item.cashAmount,
    cashDirection: item.cashDirection,
    expense: isDeposit ? null : item.cashAmount,
    deposit: isDeposit ? item.cashAmount : null,
    isReverse: item.isReverse,
    hasInvoice: item.hasInvoice,
    mainSettlementLedgerUuid: item.mainSettlementLedgerUuid,
    originLedgerUuids: item.originLedgerUuids,
    originOfficialAccountingSubjectIds: item.originOfficialAccountingSubjectIds,
    primaryOriginLedgerUuid: item.primaryOriginLedgerUuid,
    createdAt: item.createdAt,
  };
}

/** 依帳戶與查詢期間取回全期沖帳事件（不受畫面分頁影響），依付款日期新到舊排序；
 *  同時回傳科目 id → 名稱對照表，供交易對象文字的科目名稱 fallback（見 resolveCounterpartyLabel）
 *  與展開列「關聯帳簿交易」的科目名稱（見 loadLinkedTransactions）共用同一份，避免重複查詢 */
export async function loadBankTransactions(
  bankAccountUuid: string,
  dateFrom: string,
  dateTo: string,
): Promise<{ rows: BankTxnRow[]; subjectNameById: Map<number, string> }> {
  const [first, subjectNameById] = await Promise.all([
    fetchBankTransactions({ bankAccountUuid, dateFrom, dateTo, limit: FETCH_PAGE_SIZE, page: 1 }),
    loadSubjectNameMap(),
  ]);
  let items = first.items;
  if (first.total > items.length) {
    const rest = await fetchBankTransactions({ bankAccountUuid, dateFrom, dateTo, limit: first.total, page: 1 });
    items = rest.items;
  }

  const rows = items
    .map(item => mapSettleEventToRow(item, subjectNameById))
    .sort((a, b) => (a.paymentDate === b.paymentDate ? b.createdAt.localeCompare(a.createdAt) : b.paymentDate.localeCompare(a.paymentDate)));
  return { rows, subjectNameById };
}

/** 建立一筆銀行提／匯款交易 */
export function createBankCashMovement(bankAccountUuid: string, input: NewBankTransactionInput): Promise<void> {
  return createCashMovement({ bankAccountUuid, ...input }).then(() => undefined);
}

/** entry.entryType：0進項／1進折／2銷項／3銷折；2、3 為銷項，其餘為進項 */
function entryTypeToSide(entryType: number): 'sales' | 'purchase' {
  return entryType === 2 || entryType === 3 ? 'sales' : 'purchase';
}

function mapEntryDetailToLinked(ledgerUuid: string, detail: EntryDetailResult, settleEventUuid: string, subjectName: string): LinkedLedgerTxn {
  const { entry, invoice } = detail;
  // 原單可能被沖帳多次，故不能用 entry.settledAmount（累計已沖）代表這次沖帳金額，
  // 需從 settleEvents 依 settleEventUuid 比對出「這一次」的沖帳金額；
  // 即沖／銀行提匯等情境原單可能查不到對應事件，找不到時為 null
  const eventSettleAmount = detail.settleEvents.find(e => e.settleEventUuid === settleEventUuid)?.settleAmount ?? null;
  return {
    ledgerUuid,
    orderCode: entry.orderCode,
    side: entryTypeToSide(entry.entryType),
    counterpartyName: entry.counterpartyName || '—',
    totalAmount: entry.totalAmount,
    transactionDate: entry.transactionDate,
    subjectName,
    eventSettleAmount,
    invoiceNo: invoice ? `${invoice.invoiceTrack}${invoice.invoiceNumber}` : '',
  };
}

/** 依帳簿交易 uuid 列表逐筆取得原單明細，供展開列／交易明細頁的「關聯帳簿交易」清單使用；
 *  銷項／進項直接取自各筆明細自身的 entry.entryType，不假設整批同一方向；
 *  settleEventUuid 用來從每筆原單的 settleEvents 挑出「這次」沖帳事件的金額；
 *  科目名稱改用 subjectIds（BankTxnRow.originOfficialAccountingSubjectIds，與 ledgerUuids 同序）
 *  對照 loadBankTransactions 已取得的 subjectNameById，與交易對象文字的科目 fallback 同一來源，不吃 entry.subjectName */
export async function loadLinkedTransactions(
  ledgerUuids: string[],
  subjectIds: number[],
  settleEventUuid: string,
  subjectNameById: Map<number, string>,
): Promise<LinkedLedgerTxn[]> {
  const details = await Promise.all(ledgerUuids.map(uuid => fetchEntryDetail({ ledgerUuid: uuid })));
  return details.map((detail, i) => {
    const subjectName = subjectNameById.get(subjectIds[i]) ?? `科目 #${subjectIds[i]}`;
    return mapEntryDetailToLinked(ledgerUuids[i], detail, settleEventUuid, subjectName);
  });
}
