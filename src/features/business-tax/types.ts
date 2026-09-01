import type { SortDir } from '@/lib/utils';

export type TaxSide = 'sales' | 'purchase';

/** 表格可排序欄位 */
export type SortKey = 'date' | 'id';

export interface SortState {
  key: SortKey | null;
  dir: SortDir;
}

/**
 * 進階搜尋條件：金額區間 + 開立日期區間（ROC 'YYY/MM/DD' 草稿字串，送 API 前需轉為西元 YYYYMMDD）+
 * 統一編號 / 公司名稱（模糊比對，進項比對賣方、銷項比對買方）+ 是否已作廢。
 * isVoid 沿用其餘欄位「草稿字串」慣例：'' 不篩、'true' 已作廢、'false' 未作廢。
 */
export interface AdvancedFilter {
  minAmount: string;
  maxAmount: string;
  dateFrom: string;
  dateTo: string;
  taxIdNumber: string;
  companyName: string;
  isVoid: '' | 'true' | 'false';
}

export interface TaxInvoiceRow {
  /** 發票 uuid（invoiceUuid） */
  uuid: string;
  /** 交易 uuid，供導向憑證細節內頁（/business-tax/{ledgerUuid}）使用 */
  ledgerUuid: string;
  id: string;
  date: string;
  untaxed: number;
  tax: number;
  total: number;
  counterparty: string;
  /** isDebit === 1，折讓 */
  isAllowance: boolean;
  /** 作廢狀態 */
  isVoid: boolean;
  /** 申報狀態 */
  declared: boolean;
  /** 可扣抵狀態（僅進項使用） */
  deductible: boolean;
}

export interface FilingPeriod {
  value: string;
  label: string;
}

export interface ReportLine {
  label: string;
  count: number;
  untaxed: number;
  tax: number;
}

export interface ReportCalc {
  salesTax: number;
  purchaseTax: number;
  prevCredit: number;
  subtotal: number;
  payable: number;
  currentCredit: number;
}

export interface ReportSummary {
  period: string;
  sales: ReportLine[];
  purchase: ReportLine[];
  calc: ReportCalc;
}
