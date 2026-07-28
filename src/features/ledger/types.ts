export type Side = 'sales' | 'purchase';
export type SalesSubTab = 'receivable' | 'received';
export type PurchaseSubTab = 'payable' | 'paid';

/** 簡易搜尋可選欄位：交易編號／往來對象為銷項與進項共用，其餘依身分別顯示 */
export type QuickSearchField = 'id' | 'counterparty' | 'channel' | 'category' | 'project';

/**
 * 進階搜尋條件：可與簡易搜尋同時套用
 * channel（銷售管道）僅銷項適用；category／project（費用類別／專案）僅進項適用；status（狀態）僅銷項適用
 */
export interface AdvancedFilter {
  status: 'all' | 'normal' | 'voided';
  minAmount: string;
  maxAmount: string;
  dateFrom: string;
  dateTo: string;
  counterparty: string;
  channel: string;
  category: string;
  project: string;
}

export interface SubRow {
  id: string;
  label?: string;
  amount: number;
  date?: string;
}

export interface AllowanceRecord {
  id: string;
  date: string;
  amount: number;
  note: string;
}

/** 可折讓的發票商品明細（未稅餘額 + 稅額），供「發票明細」折讓退回單使用 */
export interface AllowanceLineItem {
  id: string;
  productName: string;
  allowableNet: number;
  allowableTax: number;
}

export interface SalesRow {
  id: string;
  amount: number;
  counterparty: string;
  date: string;
  channel: string;
  voided: boolean;
  allowances: AllowanceRecord[];
  children?: SubRow[];
}

export interface PurchaseRow {
  id: string;
  amount: number;
  party: string;
  date: string;
  category: string;
  project: string;
  source: 'invoice' | 'labor' | 'salary';
  children?: SubRow[];
}
