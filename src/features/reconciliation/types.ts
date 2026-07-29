export type ReconSide = 'receivable' | 'payable';

/** 沖帳紀錄中引用的單筆帳簿交易，僅取顯示與加總所需欄位 */
export interface ReconTxnRef {
  id: string;
  amount: number;
  date: string; // 民國年 YYY/MM/DD
}

/**
 * 一筆匯總沖帳紀錄：使用者於帳簿頁選擇銷售管道／廠商與交易期間、輸入本次收付款金額與手續費後，
 * 系統依日期由舊到新依序累加該期間內尚未沖帳的交易，直到達到（不超過）金額為止。
 */
export interface ReconRecord {
  id: string;
  side: ReconSide;
  groupLabel: string; // 應收：銷售管道；應付：廠商名稱
  periodFrom: string;
  periodTo: string;
  inputAmount: number; // 使用者輸入的本次收／付款金額（未扣手續費）
  feeAmount: number;
  matched: ReconTxnRef[]; // 本次依日期舊到新累加沖銷的交易
  matchedAmount: number;
  /** inputAmount - feeAmount - matchedAmount；大於 0 代表本次金額超過期間內可沖銷交易，需另立一筆調整項（多收/多付） */
  adjustment: number;
  unmatched: ReconTxnRef[]; // 期間內同管道／廠商仍未沖到帳的交易（少沖，維持待沖帳狀態）
}
