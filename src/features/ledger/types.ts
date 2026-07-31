import type { SortDir } from '@/lib/utils';

export type Side = 'sales' | 'purchase';
export type SalesSubTab = 'receivable' | 'received';
export type PurchaseSubTab = 'payable' | 'paid';

/** 表格可排序欄位：counterparty 對應銷項 counterparty／進項 party（買受人/賣家名稱/交易敘述） */
export type SortKey = 'id' | 'amount' | 'counterparty' | 'date';

export interface SortState {
  key: SortKey | null;
  dir: SortDir;
}

/** 簡易搜尋可選欄位：對應後端 filterType（0 交易編號、1 發票號碼） */
export type QuickSearchField = 'id' | 'invoice';

/** 進階搜尋條件：可與簡易搜尋同時套用，欄位對齊後端 filter API 支援範圍（金額區間、日期區間） */
export interface AdvancedFilter {
  minAmount: string;
  maxAmount: string;
  /** ROC 'YYY/MM/DD'，送 API 前需轉為西元 YYYYMMDD */
  dateFrom: string;
  dateTo: string;
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
  /** 應收帳款真實 uuid（來自 /ael/ledger/receivables/filter）；假資料或已收款列未提供 */
  uuid?: string;
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
  /** 進項交易真實 uuid（來自 /ael/ledger/payables/filter）；假資料列未提供 */
  uuid?: string;
  amount: number;
  party: string;
  date: string;
  category: string;
  project: string;
  source: 'invoice' | 'labor' | 'salary';
  children?: SubRow[];
}
