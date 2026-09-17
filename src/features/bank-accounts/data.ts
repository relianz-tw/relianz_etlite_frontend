import { createCashMovement, fetchBankTransactionDetail, fetchBankTransactions } from '@/api/bankAccounts';
import type { BankSettleEventDetailDto, BankSettleEventDto, BankTransactionsSummaryDto } from '@/api/types';
import type { BankTxnRow, LinkedLedgerTxn, NewBankTransactionInput } from './types';

/** 交易對象顯示文字：優先取廠商名稱，取不到（空字串）則回退備註，兩者皆空再用
 *  主原單（primaryOriginLedgerUuid）明細附帶的科目名稱頂替；
 *  關聯多筆帳簿交易時改由畫面端依 originLedgerUuids.length 顯示「N 筆」徽章（見 TransactionTable/Cards），
 *  這裡不再附加「等」字，避免語意模糊 */
function resolveCounterpartyLabel(item: BankSettleEventDto): string {
  const primarySubjectName = item.details.find(d => d.ledgerUuid === item.primaryOriginLedgerUuid)?.subjectName;
  return item.counterpartyName || item.memo || primarySubjectName || '—';
}

/** entry.entryType：0進項／1進折／2銷項／3銷折；2、3 為銷項，其餘為進項 */
function entryTypeToSide(entryType: number): 'sales' | 'purchase' {
  return entryType === 2 || entryType === 3 ? 'sales' : 'purchase';
}

function mapDetailToLinked(detail: BankSettleEventDetailDto): LinkedLedgerTxn {
  return {
    ledgerUuid: detail.ledgerUuid,
    orderCode: detail.orderCode,
    side: entryTypeToSide(detail.entryType),
    counterpartyName: detail.counterpartyName || '—',
    originAmount: detail.originAmount,
    transactionDate: detail.transactionDate,
    subjectName: detail.subjectName,
    amount: detail.amount,
    voucherNumber: detail.voucherNumber,
    balanceBefore: detail.balanceBefore,
    balanceAfter: detail.balanceAfter,
  };
}

function mapSettleEventToRow(item: BankSettleEventDto): BankTxnRow {
  const isDeposit = item.cashDirection === 0;
  // 交易金額改採 details 各筆 amount 加總（而非 cashAmount），取絕對值比照既有 expense/deposit 恆為正數的慣例
  const detailsAmount = Math.abs(item.details.reduce((sum, d) => sum + d.amount, 0));
  return {
    settleEventUuid: item.settleEventUuid,
    paymentDate: item.paymentDate,
    reconMethod: item.reconMethod,
    side: item.side,
    counterpartyLabel: resolveCounterpartyLabel(item),
    settleAmount: item.settleAmount,
    cashAmount: item.cashAmount,
    cashDirection: item.cashDirection,
    expense: isDeposit ? null : detailsAmount,
    deposit: isDeposit ? detailsAmount : null,
    isReverse: item.isReverse,
    hasInvoice: item.hasInvoice,
    mainSettlementLedgerUuid: item.mainSettlementLedgerUuid,
    originLedgerUuids: item.originLedgerUuids,
    primaryOriginLedgerUuid: item.primaryOriginLedgerUuid,
    createdAt: item.createdAt,
    details: item.details.map(mapDetailToLinked),
  };
}

/** 依帳戶、查詢期間與畫面分頁取回沖帳事件（後端真實分頁），
 *  並回傳整個查詢期間的存入／支出合計（summary，不受本頁 limit/page 影響） */
export async function loadBankTransactions(
  bankAccountUuid: string,
  dateFrom: string,
  dateTo: string,
  page: number,
  limit: number,
): Promise<{ rows: BankTxnRow[]; total: number; summary: BankTransactionsSummaryDto }> {
  const result = await fetchBankTransactions({ bankAccountUuid, dateFrom, dateTo, limit, page });
  return { rows: result.items.map(mapSettleEventToRow), total: result.total, summary: result.summary };
}

/** 依沖帳事件 uuid 取回單筆交易明細（交易明細頁用），不需靠期間查詢重查列表 */
export async function loadBankTransactionDetail(
  bankAccountUuid: string,
  settleEventUuid: string,
): Promise<{ row: BankTxnRow; invoicePicUrl: string | null; counterpartyName: string }> {
  const result = await fetchBankTransactionDetail({ bankAccountUuid, settleEventUuid });
  return { row: mapSettleEventToRow(result), invoicePicUrl: result.invoicePicUrl, counterpartyName: result.counterpartyName };
}

/** 建立一筆銀行提／匯款交易 */
export function createBankCashMovement(bankAccountUuid: string, input: NewBankTransactionInput): Promise<void> {
  return createCashMovement({ bankAccountUuid, ...input }).then(() => undefined);
}
