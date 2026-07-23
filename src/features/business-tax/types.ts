export type TaxSide = 'sales' | 'purchase';
export type InvoiceStatus = 'pending' | 'voided';

/** 進階搜尋條件：金額區間 + 狀態 */
export interface AdvancedFilter {
  status: 'all' | InvoiceStatus;
  minAmount: string;
  maxAmount: string;
}

export interface TaxSubRow {
  id: string;
  label?: string;
  untaxed: number;
  tax: number;
  total: number;
  date?: string;
}

export interface TaxInvoiceRow {
  id: string;
  date: string;
  untaxed: number;
  tax: number;
  total: number;
  counterparty: string;
  status: InvoiceStatus;
  children?: TaxSubRow[];
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
