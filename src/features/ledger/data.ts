import { listOfficialSubjects } from '@/api/subjects';
import type { LedgerEntryInvoiceDto, PayableListItemDto, ReceivableListItemDto } from '@/api/types';
import { formatRocDate, parseRocDate } from '@/components/ui/DatePicker';
import { generateDailyTrend } from '@/lib/utils';
import type { PurchaseRow, SalesRow } from './types';

export const PROJECT_NAMES = ['好長好長的專案名稱', '台北旗艦店擴建', '年度品牌重塑', ''];

/** /ael/ledger/payables/filter 回傳的 YYYYMMDD 或 ISO 日期字串 → Date（沖帳中心 data.ts 亦重用此函式解析對帳中心 API 的日期） */
export function parseApiDate(value: string): Date | undefined {
  if (/^\d{8}$/.test(value)) {
    const year = parseInt(value.slice(0, 4), 10);
    const month = parseInt(value.slice(4, 6), 10) - 1;
    const day = parseInt(value.slice(6, 8), 10);
    return new Date(year, month, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** 憑證號碼＝發票字軌＋號碼（無字軌的憑證類型 invoiceTrack 為空字串，串接後自然只剩號碼）；無對應憑證時回傳 undefined */
function voucherNumberFromInvoice(invoice: LedgerEntryInvoiceDto | null): string | undefined {
  return invoice ? `${invoice.invoiceTrack}${invoice.invoiceNumber}` : undefined;
}

/** 開立日期＝憑證上的開立日（invoice.date，民國年 YYYMMDD）；無對應憑證（如手動入帳、無票收據）時退回交易日/建立時間 */
function issueDateFrom(invoice: LedgerEntryInvoiceDto | null, entryDate: string | null, createdAt: string): Date | undefined {
  if (invoice) return parseRocDate(invoice.date);
  return entryDate ? parseApiDate(entryDate) : parseApiDate(createdAt);
}

/**
 * /ael/ledger/payables/filter 一批項目 → 表格 PurchaseRow[]。
 * officialAccountingSubjectId 向 /ael/subject/official/list/latest 查詢最新科目清單反查名稱；
 * 查無對應科目時，退回以編號顯示。專案欄位 API 未提供，故留空。
 * source 標為 'invoice'：費用類別／專案下拉可就地編輯（表格既有編輯皆僅存本地狀態，未串接更新 API）。
 * uuid 帶入真實 uuid 供交易明細頁查詢使用。
 */
export async function mapPayableItemsToRows(items: PayableListItemDto[]): Promise<PurchaseRow[]> {
  const dated = items.map(item => {
    const date = issueDateFrom(item.invoice, item.entryDate, item.createdAt);
    return { item, rocDate: formatRocDate(date) };
  });

  const subjectList = await listOfficialSubjects();
  const subjectNameById = new Map<number, string>();
  subjectList.forEach(subject => subjectNameById.set(subject.id, subject.name));

  return dated.map(({ item, rocDate }) => ({
    id: item.orderCode,
    uuid: item.ledgerUuid,
    amount: item.totalAmount,
    party: item.counterpartyName,
    date: rocDate,
    category: subjectNameById.get(item.officialAccountingSubjectId) ?? `科目 #${item.officialAccountingSubjectId}`,
    project: '',
    source: 'invoice',
    counterpartyUuid: item.counterpartyUuid,
    voucherNumber: voucherNumberFromInvoice(item.invoice),
    settledAmount: item.settledAmount,
    remainingAmount: item.remainingAmount,
    settlementStatus: item.settlementStatus,
    isAllowance: item.isAllowance ?? false,
    allowanceCount: item.allowanceCount ?? 0,
  }));
}

/**
 * /ael/ledger/receivables/filter 一批項目 → 表格 SalesRow[]。
 * officialAccountingSubjectId 向 /ael/subject/official/list/latest 查詢最新科目清單反查收入科目名稱；
 * 查無對應科目時，退回以編號顯示。uuid 帶入真實應收帳款 uuid 供手動入帳沖帳與交易明細頁查詢使用。
 * 銷售管道名稱由呼叫端另外以 paymentChannelUuid 反查（見 LedgerView 的 channelNameByUuid）。
 */
export async function mapReceivableItemsToRows(items: ReceivableListItemDto[]): Promise<SalesRow[]> {
  const subjectList = await listOfficialSubjects();
  const subjectNameById = new Map<number, string>();
  subjectList.forEach(subject => subjectNameById.set(subject.id, subject.name));

  return items.map(item => {
    const date = issueDateFrom(item.invoice, item.entryDate, item.createdAt);
    return {
      id: item.orderCode,
      uuid: item.ledgerUuid,
      amount: item.totalAmount,
      counterparty: item.counterpartyName,
      date: formatRocDate(date),
      category: subjectNameById.get(item.officialAccountingSubjectId) ?? `科目 #${item.officialAccountingSubjectId}`,
      paymentChannelUuid: item.paymentChannelUuid,
      voucherNumber: voucherNumberFromInvoice(item.invoice),
      voided: false,
      settledAmount: item.settledAmount,
      remainingAmount: item.remainingAmount,
      settlementStatus: item.settlementStatus,
      isAllowance: item.isAllowance ?? false,
      allowanceCount: item.allowanceCount ?? 0,
    };
  });
}

const TREND_END_DATE = '2026/03/27'; // 對齊既有假資料中最新的交易日期，趨勢圖固定顯示兩個月（62 天）每日金額

export const SALES_DAILY = generateDailyTrend(0, 16000000, 0.9, TREND_END_DATE);
export const PURCHASE_DAILY = generateDailyTrend(3, 14000000, 0.8, TREND_END_DATE);
