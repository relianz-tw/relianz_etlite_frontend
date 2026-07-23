export type Side = 'sales' | 'purchase';
export type SalesSubTab = 'receivable' | 'received';
export type PurchaseSubTab = 'payable' | 'paid';

/** 進階搜尋條件：金額區間 + 狀態（僅銷項可用，進項資料無作廢狀態） */
export interface AdvancedFilter {
  status: 'all' | 'normal' | 'voided';
  minAmount: string;
  maxAmount: string;
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
