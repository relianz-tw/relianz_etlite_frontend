import type { SortDir } from '@/lib/utils';

export type Side = 'sales' | 'purchase';
export type SalesSubTab = 'receivable' | 'received';
export type PurchaseSubTab = 'payable' | 'paid';

/** 帳簿總覽頂部 KPI 卡片數字，來自 filter API 回傳的彙總欄位（非前端計算） */
export interface LedgerTotals {
  /** 銷項：已開立發票金額（issuedVoucherAmount）／進項：已收取憑證金額（receivedVoucherAmount） */
  primary: number;
  /** 銷項：已入帳金額（collectedAmount）／進項：已付款金額（paidAmount） */
  settled: number;
  /** 銷項：應收帳款（receivableAmount）／進項：應付金額（payableAmount） */
  outstanding: number;
}

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

export interface SalesRow {
  id: string;
  /** 應收帳款真實 uuid（來自 /ael/ledger/receivables/filter） */
  uuid?: string;
  amount: number;
  counterparty: string;
  date: string;
  /** 銷售管道真實 uuid（來自 /ael/ledger/receivables/filter 的 paymentChannelUuid）；供匯總沖帳依 uuid 分組比對，
   * 亦供帳簿列表反查管道名稱顯示（見 LedgerView 的 channelNameByUuid） */
  paymentChannelUuid?: string | null;
  /** 憑證號碼：invoice.invoiceTrack + invoice.invoiceNumber；無對應憑證時為 undefined */
  voucherNumber?: string;
  voided: boolean;
  /** 已沖帳金額（累計）；僅應收帳款/應付帳款分頁顯示，已收款/已付款分頁不需要 */
  settledAmount?: number;
  /** 未沖帳金額；可為負，代表超沖 */
  remainingAmount?: number;
  /** 0平衡 1超沖 2少沖 */
  settlementStatus?: number;
  /** 是否為折讓（銷折）；來自 /ael/ledger/receivables/filter 的 isAllowance */
  isAllowance?: boolean;
  /** 已開立的折讓單數量；大於 0 才顯示展開箭頭，來自 receivables/{filter,collected/filter} 的 allowanceCount */
  allowanceCount?: number;
}

export interface PurchaseRow {
  id: string;
  /** 進項交易真實 uuid（來自 /ael/ledger/payables/filter） */
  uuid?: string;
  amount: number;
  party: string;
  date: string;
  category: string;
  project: string;
  source: 'invoice' | 'labor' | 'salary';
  /** 廠商真實 uuid（來自 /ael/ledger/payables/filter 的 counterpartyUuid）；供匯總沖帳依 uuid 分組比對 */
  counterpartyUuid?: string | null;
  /** 憑證號碼：invoice.invoiceTrack + invoice.invoiceNumber；無對應憑證時為 undefined */
  voucherNumber?: string;
  /** 已沖帳金額（累計）；僅應收帳款/應付帳款分頁顯示，已收款/已付款分頁不需要 */
  settledAmount?: number;
  /** 未沖帳金額；可為負，代表超沖 */
  remainingAmount?: number;
  /** 0平衡 1超沖 2少沖 */
  settlementStatus?: number;
  /** 是否為折讓（進折）；來自 /ael/ledger/payables/filter 的 isAllowance */
  isAllowance?: boolean;
  /** 已開立的折讓單數量；大於 0 才顯示展開箭頭，來自 payables/{filter,paid/filter} 的 allowanceCount */
  allowanceCount?: number;
}
