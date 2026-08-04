/** 銀行帳戶總覽的單筆交易紀錄（存摺模式：交易時間／帳務時間／摘要／支出／存入／餘額／備註） */
export interface BankTransactionRow {
  id: string;
  bankAccountUuid: string;
  /** 交易時間，YYYYMMDD */
  transactionDate: string;
  /** 帳務時間（出入帳），YYYYMMDD */
  accountingDate: string;
  summary: string;
  /** 支出金額；與 deposit 互斥，同一筆恰有一者有值 */
  expense: number | null;
  /** 存入金額；與 expense 互斥，同一筆恰有一者有值 */
  deposit: number | null;
  /** 逐筆累計餘額，由 data.ts 的 recalcBalances 依交易時間排序後統一計算，不由使用者輸入 */
  balance: number;
  /** 備註（憑證備註），選填 */
  remark: string;
}

/** 新增交易表單送出的資料：不含 id／balance（由 data.ts 產生 id 並重新計算餘額） */
export type NewBankTransactionInput = Omit<BankTransactionRow, 'id' | 'balance'>;
