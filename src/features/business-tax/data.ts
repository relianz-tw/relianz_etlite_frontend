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

// 三張統計卡總額（對齊設計稿數字：銷項發票總額 - 進項發票總額 = 預估營業稅金額）
export const SALES_INVOICE_TOTAL = 999462582;
export const PURCHASE_INVOICE_TOTAL = 850000000;
export const ESTIMATED_TAX_TOTAL = SALES_INVOICE_TOTAL - PURCHASE_INVOICE_TOTAL;

const TREND_END_DATE = '2026/03/27'; // 對齊帳簿假資料的最新交易日期
export const TAX_TREND = generateDailyTrend(1, 16500000, 0.85, TREND_END_DATE);
export const PURCHASE_TREND = generateDailyTrend(2, 14000000, 0.8, TREND_END_DATE);

const SALES_SPLIT_CHILDREN = [
  { id: 'S26XH743195003', untaxed: 476, tax: 24, total: 500, date: '115/03/26' },
  { id: 'S26XH743195002', untaxed: 1905, tax: 95, total: 2000, date: '115/03/29' },
  { id: '應稅銷售額', label: '應稅銷售額', untaxed: 7143, tax: 357, total: 7500 },
];

export const SALES_INVOICES: TaxInvoiceRow[] = [
  { id: 'UA40435900', date: '115/03/22', untaxed: 952000000, tax: 47600000, total: 999600000, counterparty: '友信創新股份有限公司', status: 'pending' },
  { id: 'UA40435901', date: '115/03/23', untaxed: 6476, tax: 324, total: 6800, counterparty: '台積開發股份有限公司', status: 'voided' },
  { id: 'UA40435902', date: '115/03/25', untaxed: 952000000, tax: 47600000, total: 999600000, counterparty: '我的另一間公司', status: 'pending' },
  {
    id: 'UA40435903',
    date: '115/03/26',
    untaxed: 9524,
    tax: 476,
    total: 10000,
    counterparty: '名子很長很長很長很長股份有限公司',
    status: 'pending',
    children: SALES_SPLIT_CHILDREN,
  },
  { id: 'UA40435904', date: '115/03/27', untaxed: 121905, tax: 6095, total: 128000, counterparty: '長榮海運股份有限公司', status: 'voided' },
];

const PURCHASE_SPLIT_CHILDREN = [
  { id: 'S30XH900001', untaxed: 2857, tax: 143, total: 3000, date: '115/03/25' },
  { id: 'S30XH900002', untaxed: 4762, tax: 238, total: 5000, date: '115/03/26' },
  { id: '進項可扣抵金額', label: '進項可扣抵金額', untaxed: 1905, tax: 95, total: 2000 },
];

export const PURCHASE_INVOICES: TaxInvoiceRow[] = [
  { id: 'UA50112200', date: '115/03/21', untaxed: 800000000, tax: 40000000, total: 840000000, counterparty: '全球供應鏈股份有限公司', status: 'pending' },
  { id: 'UA50112201', date: '115/03/22', untaxed: 4762, tax: 238, total: 5000, counterparty: '文具行', status: 'voided' },
  { id: 'UA50112202', date: '115/03/24', untaxed: 45238000, tax: 2261900, total: 47499900, counterparty: '泰山材料有限公司', status: 'pending' },
  {
    id: 'UA50112203',
    date: '115/03/25',
    untaxed: 9524,
    tax: 476,
    total: 10000,
    counterparty: '名子很長很長很長很長股份有限公司',
    status: 'pending',
    children: PURCHASE_SPLIT_CHILDREN,
  },
  { id: 'UA50112204', date: '115/03/27', untaxed: 65714, tax: 3286, total: 69000, counterparty: '大山營造工程行', status: 'pending' },
];

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
