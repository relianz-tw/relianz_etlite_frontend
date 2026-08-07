import type { SettleLedgerAllocation } from '@/api/types';

export type ReconSide = 'receivable' | 'payable';

/**
 * 匯總沖帳預覽／執行結果，正規化銷項（depositAmount／paymentChannelUuid）與進項
 * （paymentAmount／counterpartyUuid）的欄位差異為同一組欄位，供 ReconciliationView 與下游元件
 * 不需要再依 side 分別處理型別。actualAmount 對應銷項 actualDepositAmount／進項 actualPaymentAmount。
 */
export interface ReconSettleResult {
  /** 本次匯總沖帳總額（使用者輸入的對帳單金額） */
  settleAmount: number;
  /** 實際沖到原單合計金額 */
  appliedSettleAmount: number;
  /** 實際異動銀行金額 */
  actualAmount: number;
  /** 沖前餘額（廠商／銷售管道） */
  balanceBefore: number;
  /** 沖後餘額（廠商／銷售管道） */
  balanceAfter: number;
  /** 是否將超沖少沖的金額記進餘額 */
  isBalance: boolean;
  /** 實際有分配金額的原單筆數 */
  affectedCount: number;
  /** 拆帳前各原單 remaining 合計 */
  totalBeforeRemaining: number;
  /** 各原單拆帳結果 */
  allocations: SettleLedgerAllocation[];
  /** 僅執行結果（summary）才有 */
  settlementOrderCode?: string;
  paymentDate?: string;
}

/** 沖帳紀錄中引用的單筆帳簿交易，僅取顯示與加總所需欄位 */
export interface ReconTxnRef {
  /** 應收/應付帳款真實 uuid，用於沖帳識別、去重比對與呼叫沖帳 API */
  uuid: string;
  /** 顯示用交易編號 */
  orderCode: string;
  /** 憑證號碼：invoiceTrack + invoiceNumber；無對應憑證時為 undefined */
  voucherNumber?: string;
  amount: number;
  date: string; // 民國年 YYY/MM/DD
  /** 交易對方名稱：應收為買受人／應付為賣方或交易敘述，供清單顯示用 */
  counterparty: string;
  /** 應付專用的項目摘要（科目＋專案），已選定廠商時清單改顯示此欄取代重複的廠商名稱 */
  summary?: string;
  /** 該筆交易的銷售管道／廠商 uuid；未指定為 null */
  channelUuid?: string | null;
}
