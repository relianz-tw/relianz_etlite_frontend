import type { SettleLedgerAllocation } from '@/api/types';

export type ReconSide = 'receivable' | 'payable';

/**
 * 沖帳操作模式：
 * - single：單筆沖帳，走手動沖帳 API（settleReceivable／settlePayable，reconMethod=0），
 *   事後可在交易明細頁用 SettlementEditDialog 編輯金額；不限定管道／廠商，「全部管道」「其他」亦可操作。
 * - multi：多筆沖帳，使用者勾選多筆交易後試算並沖帳；與 summary 共用 settle/preview + settle/summary API，
 *   差別僅在於帶入使用者勾選的 ledgerUuids 與 isDefault=false（summary 固定 isDefault=true、ledgerUuids=[]，
 *   由後端自動拆帳），需先於左側選擇明確銷售管道／廠商。
 * - summary：匯總沖帳，沿用既有 settle/preview + settle/summary 流程（reconMethod=2），僅能整批恢復。
 */
export type ReconMode = 'single' | 'multi' | 'summary';

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
  /** 顯示用交易編號；對帳中心 API 未回傳憑證資料，改以此欄位取代憑證號碼欄，憑證資訊改由展開面板懶載入 entries/detail */
  orderCode: string;
  amount: number;
  date: string; // 民國年 YYY/MM/DD
  /** 交易對方名稱：應收為買受人／應付為賣方，供展開面板顯示與交易明細頁帶入用 */
  counterparty: string;
  /** 該筆交易的銷售管道／廠商 uuid；未指定為 null */
  channelUuid?: string | null;
  /** 未沖帳金額；可為負代表超沖。單筆沖帳模式用於顯示「待付/待收 $X」與預估沖後剩餘 */
  remainingAmount?: number;
}
