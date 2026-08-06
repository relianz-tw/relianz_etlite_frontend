/** 與銀行交易關聯的帳簿交易（inline 展開與交易明細頁的「關聯帳簿交易」清單皆使用）；uuid 對應 /ledger/[id] 編輯頁 */
export interface LinkedLedgerTxn {
  /** 帳簿交易編號（比照帳簿表格「交易編號」欄位格式，如 UA40435900），與 invoiceNo（發票號碼）為不同概念 */
  id: string;
  uuid: string;
  side: 'sales' | 'purchase';
  /** 買受人／賣家名稱 */
  counterparty: string;
  amount: number;
  /** 交易日期，YYYYMMDD */
  date: string;
  /** 發票號碼 */
  invoiceNo: string;
  /** 項目／交易摘要 */
  itemSummary: string;
  /** 費用類別；僅進項（purchase）交易有值，比照帳簿表格只有進項顯示此欄位 */
  category?: string;
  /** 專案名稱；僅進項（purchase）交易有值，未歸屬專案時為空字串 */
  project?: string;
}

/** 銀行帳戶總覽的單筆交易紀錄（存摺模式：交易時間／帳務時間／摘要／支出／存入／餘額／備註）；
 *  channel／referenceNo／handler／counterpartyBank／counterpartyAccount／voucherImage 僅交易明細頁顯示，
 *  inline 展開呈現基礎欄位（帳務時間/摘要/支出/存入/備註）＋關聯帳簿交易清單（文字呈現，比照帳簿表格欄位） */
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
  /** 此筆銀行交易對應的帳簿交易（可能為 0～多筆），僅交易詳細頁使用 */
  linkedTransactions: LinkedLedgerTxn[];
  /** 銀行流水編號，由銀行系統產生 */
  referenceNo: string;
  /** 交易管道（如網路銀行、自動扣款、临柜辦理） */
  channel: string;
  /** 經辦人員；系統自動處理的交易顯示「系統自動」 */
  handler: string;
  /** 對方銀行；僅轉帳類交易有值 */
  counterpartyBank?: string;
  /** 對方帳號；僅轉帳類交易有值 */
  counterpartyAccount?: string;
  /** 憑證照片，data URI 形式；null 代表尚無憑證（僅交易明細頁顯示，見 VoucherPreviewCard） */
  voucherImage: string | null;
}

/** 新增交易表單送出的資料：不含 id／balance／referenceNo（由 data.ts 產生 id 並重新計算餘額，
 *  referenceNo 為銀行流水編號，比照 id 由系統產生） */
export type NewBankTransactionInput = Omit<BankTransactionRow, 'id' | 'balance' | 'referenceNo'>;
