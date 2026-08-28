import type { VatInvoiceItemDto } from '@/api/types';
import { formatRocDate, parseRocDate } from '@/components/ui/DatePicker';
import { generateDailyTrend } from '@/lib/utils';
import type { FilingPeriod, ReportSummary, TaxInvoiceRow } from './types';

// 營業稅為雙月申報，115 年度共 6 個申報期別
export const FILING_PERIODS: FilingPeriod[] = [
  { value: '115-01', label: '115 年 1 - 2 月份' },
  { value: '115-03', label: '115 年 3 - 4 月份' },
  { value: '115-05', label: '115 年 5 - 6 月份' },
  { value: '115-07', label: '115 年 7 - 8 月份' },
  { value: '115-09', label: '115 年 9 - 10 月份' },
  { value: '115-11', label: '115 年 11 - 12 月份' },
];

/** 期別下拉 value（`${民國年}-${期別}`）→ 查詢用的 cmsYear／cmsPhase；格式不符時退回 FILING_PERIODS 第一筆 */
export function parseFilingPeriod(value: string): { cmsYear: number; cmsPhase: number } {
  const match = /^(\d+)-(\d+)$/.exec(value);
  if (!match) {
    const [year, phase] = FILING_PERIODS[0].value.split('-');
    return { cmsYear: Number(year), cmsPhase: Number(phase) };
  }
  return { cmsYear: Number(match[1]), cmsPhase: Number(match[2]) };
}

/**
 * POST /ael/vat/{input,output}/filter 一批項目 → 表格 TaxInvoiceRow[]。
 * invoiceDate 為民國年 YYYMMDD（如 '1150322'），與 parseRocDate 接受的格式一致，直接複用；
 * counterparty 優先取交易對象名稱，查無時退回發票上的公司名稱。
 */
export function mapVatItemsToRows(items: VatInvoiceItemDto[]): TaxInvoiceRow[] {
  return items.map(item => ({
    uuid: item.invoiceUuid,
    ledgerUuid: item.ledgerUuid,
    id: item.voucherNumber,
    date: formatRocDate(parseRocDate(item.invoiceDate)),
    untaxed: item.sales,
    tax: item.businessTax,
    total: item.amount,
    counterparty: item.counterpartyName ?? item.companyName,
    isAllowance: item.isDebit === 1,
    isVoid: item.isVoid,
    declared: item.declared,
  }));
}

const TREND_END_DATE = '2026/03/27'; // 對齊帳簿假資料的最新交易日期
export const TAX_TREND = generateDailyTrend(1, 16500000, 0.85, TREND_END_DATE);
export const PURCHASE_TREND = generateDailyTrend(2, 14000000, 0.8, TREND_END_DATE);

// 「轉出本期營業稅申報檔」報表對話框內容（示範用固定假資料）
export const REPORT_SUMMARY: ReportSummary = {
  period: '115 年 01 -02 月',
  sales: [
    { label: '三聯式(電子及手開)', count: 18, untaxed: 620000000, tax: 31000000 },
    { label: '二聯式(電子及手開)', count: 9, untaxed: 45000000, tax: 2250000 },
    { label: '銷項折讓', count: 2, untaxed: -1200000, tax: -60000 },
    { label: '銷項加總', count: 29, untaxed: 663800000, tax: 33190000 },
  ],
  purchase: [
    { label: '統一發票(21)', count: 22, untaxed: 500000000, tax: 25000000 },
    { label: '三聯式及電子發票(25)', count: 14, untaxed: 300000000, tax: 15000000 },
    { label: '其他憑證(22)', count: 5, untaxed: 20000000, tax: 1000000 },
    { label: '進項折讓', count: 1, untaxed: -800000, tax: -40000 },
    { label: '進項加總', count: 42, untaxed: 819200000, tax: 40960000 },
  ],
  calc: {
    salesTax: 33190000,
    purchaseTax: 40960000,
    prevCredit: 0,
    subtotal: -7770000,
    payable: 0,
    currentCredit: 7770000,
  },
};
