import type { SettleLedgerAllocation } from '@/api/types';

export type ReconSide = 'receivable' | 'payable';

/**
 * 沖帳操作模式：
 * - perTxn：逐筆沖帳（單筆／多筆整合），使用者從右側清單勾選交易，依勾選筆數自動分流 API——
 *   勾 1 筆走手動沖帳 API（settleReceivable／settlePayable，reconMethod=0，允許超沖少沖，
 *   事後可在交易明細頁用 SettlementEditDialog 編輯金額，不限定管道／廠商，「全部管道」「其他」亦可操作）；
 *   勾多筆走 settle/preview + settle/summary（明確帶入使用者勾選的 ledgerUuids 與 isDefault=false），
 *   需先於左側選擇明確銷售管道／廠商。兩種筆數在畫面上共用同一套「確認沖帳→結果」流程
 *   （見 ReconciliationView 的 handleOpenConfirm）：按下「確認沖帳」即打 preview（或單筆本地試算）取得逐筆
 *   明細，於彈窗顯示後直接送出執行 API，沒有中途選項；超沖／少沖差額一律直接留在該筆原單／沖入最後一筆交易。
 * - summary：匯總沖帳，沿用既有 settle/preview + settle/summary 流程（reconMethod=2），僅能整批恢復。
 */
export type ReconMode = 'perTxn' | 'summary';

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
  /** 沖前餘額（廠商／銷售管道）；逐筆沖帳勾 1 筆走手動沖帳 API 無此欄位 */
  balanceBefore?: number;
  /** 沖後餘額（廠商／銷售管道）；逐筆沖帳勾 1 筆走手動沖帳 API 無此欄位 */
  balanceAfter?: number;
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

/**
 * 逐筆沖帳明細（ReconAllocationTable）用來補上買受人／賣方與憑證號碼的反查資料——
 * 沖帳 API（preview／summary／manual settle）回應本身只有 ledgerUuid／orderCode，不含這兩個欄位，
 * 需在送出確認沖帳當下從候選清單（ReconCandidate）依 ledgerUuid 反查一次並存成快照
 * （沖帳完成後清單會重新拉取，已結清交易可能從未結清清單消失，故不能即時查詢，須用快照）。
 */
export interface ReconAllocationInfo {
  counterparty: string;
  voucherNumber: string;
}

/** 沖帳紀錄中引用的單筆帳簿交易，僅取顯示與加總所需欄位 */
export interface ReconTxnRef {
  /** 應收/應付帳款真實 uuid，用於沖帳識別、去重比對與呼叫沖帳 API */
  uuid: string;
  /** 交易編號，供展開面板顯示 */
  orderCode: string;
  amount: number;
  date: string; // 民國年 YYY/MM/DD，開立日期見 data.ts 的 toIssueDate
  /** 交易對方名稱：應收為買受人／應付為賣方，供清單欄位、展開面板顯示與交易明細頁帶入用 */
  counterparty: string;
  /** 憑證號碼（發票字軌＋發票號碼），供清單欄位與展開面板顯示 */
  voucherNumber: string;
  /** 該筆交易的銷售管道／廠商 uuid；未指定為 null */
  channelUuid?: string | null;
  /** 未沖帳金額；可為負代表超沖。單筆沖帳模式用於顯示「待付/待收 $X」與預估沖後剩餘 */
  remainingAmount?: number;
}
