import { createCashMovement, fetchBankTransactions } from '@/api/bankAccounts';
import { fetchEntryDetail } from '@/api/ledger';
import type { BankSettleEventDto, EntryDetailResult } from '@/api/types';
import type { BankTxnRow, LinkedLedgerTxn, NewBankTransactionInput } from './types';

/** 每次向後端要的分頁筆數；先取第一頁探出 total，若還有剩才補抓，避免小帳戶多打一次 API */
const FETCH_PAGE_SIZE = 100;

function mapSettleEventToRow(item: BankSettleEventDto): BankTxnRow {
  const isDeposit = item.cashDirection === 0;
  return {
    settleEventUuid: item.settleEventUuid,
    paymentDate: item.paymentDate,
    reconMethod: item.reconMethod,
    side: item.side,
    // 交易對象優先顯示廠商名稱，取不到（空字串）則回退備註
    counterpartyLabel: item.counterpartyName || item.memo || '—',
    settleAmount: item.settleAmount,
    cashAmount: item.cashAmount,
    cashDirection: item.cashDirection,
    expense: isDeposit ? null : item.cashAmount,
    deposit: isDeposit ? item.cashAmount : null,
    isReverse: item.isReverse,
    hasInvoice: item.hasInvoice,
    mainSettlementLedgerUuid: item.mainSettlementLedgerUuid,
    originLedgerUuids: item.originLedgerUuids,
    primaryOriginLedgerUuid: item.primaryOriginLedgerUuid,
    createdAt: item.createdAt,
  };
}

/** 交易對象顯示文字：優先用 row.counterpartyLabel（廠商名稱／備援備註）；
 *  若兩者皆空（回退成 '—'）且關聯帳簿交易已展開載入，改用第一筆的科目名稱頂替；
 *  關聯多筆帳簿交易時（origin­LedgerUuids 超過一筆）在文字後補「等」，提示還有其他關聯交易 */
export function formatCounterpartyLabel(row: BankTxnRow, linkedItems: LinkedLedgerTxn[]): string {
  const base = row.counterpartyLabel === '—' ? linkedItems[0]?.subjectName || row.counterpartyLabel : row.counterpartyLabel;
  return row.originLedgerUuids.length > 1 && base !== '—' ? `${base}等` : base;
}

/** 依帳戶與查詢期間取回全期沖帳事件（不受畫面分頁影響），依付款日期新到舊排序 */
export async function loadBankTransactions(bankAccountUuid: string, dateFrom: string, dateTo: string): Promise<BankTxnRow[]> {
  const first = await fetchBankTransactions({ bankAccountUuid, dateFrom, dateTo, limit: FETCH_PAGE_SIZE, page: 1 });
  let items = first.items;
  if (first.total > items.length) {
    const rest = await fetchBankTransactions({ bankAccountUuid, dateFrom, dateTo, limit: first.total, page: 1 });
    items = rest.items;
  }
  return items
    .map(mapSettleEventToRow)
    .sort((a, b) => (a.paymentDate === b.paymentDate ? b.createdAt.localeCompare(a.createdAt) : b.paymentDate.localeCompare(a.paymentDate)));
}

/** 建立一筆銀行提／匯款交易 */
export function createBankCashMovement(bankAccountUuid: string, input: NewBankTransactionInput): Promise<void> {
  return createCashMovement({ bankAccountUuid, ...input }).then(() => undefined);
}

/** entry.entryType：0進項／1進折／2銷項／3銷折；2、3 為銷項，其餘為進項 */
function entryTypeToSide(entryType: number): 'sales' | 'purchase' {
  return entryType === 2 || entryType === 3 ? 'sales' : 'purchase';
}

function mapEntryDetailToLinked(ledgerUuid: string, detail: EntryDetailResult, settleEventUuid: string): LinkedLedgerTxn {
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
    subjectName: entry.subjectName,
    eventSettleAmount,
    invoiceNo: invoice ? `${invoice.invoiceTrack}${invoice.invoiceNumber}` : '',
  };
}

/** 依帳簿交易 uuid 列表逐筆取得原單明細，供展開列／交易明細頁的「關聯帳簿交易」清單使用；
 *  銷項／進項直接取自各筆明細自身的 entry.entryType，不假設整批同一方向；
 *  settleEventUuid 用來從每筆原單的 settleEvents 挑出「這次」沖帳事件的金額 */
export async function loadLinkedTransactions(ledgerUuids: string[], settleEventUuid: string): Promise<LinkedLedgerTxn[]> {
  const details = await Promise.all(ledgerUuids.map(uuid => fetchEntryDetail({ ledgerUuid: uuid })));
  return details.map((detail, i) => mapEntryDetailToLinked(ledgerUuids[i], detail, settleEventUuid));
}
