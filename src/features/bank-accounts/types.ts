/** 與銀行沖帳事件關聯的帳簿交易（展開列與交易明細頁的「關聯帳簿交易」清單皆使用），
 *  由 GET /ael/ledger/entries/detail 回應對映而來（見 data.ts 的 mapEntryDetailToLinked）；
 *  ledgerUuid 對應 /ledger/[id] 編輯頁。 */
export interface LinkedLedgerTxn {
  ledgerUuid: string;
  /** 帳簿交易編號 */
  orderCode: string;
  side: 'sales' | 'purchase';
  /** 交易對象名稱 */
  counterpartyName: string;
  /** 總金額 */
  totalAmount: number;
  /** 交易發生日（ISO 字串），查無則為 null */
  transactionDate: string | null;
  /** 科目名稱 */
  subjectName: string;
  /** 本次沖帳事件對該原單的沖帳金額；該原單的 settleEvents 內找不到對應事件時為 null */
  eventSettleAmount: number | null;
  /** 發票號碼（字軌＋號碼）；無發票（如未開立發票的應收/應付）時為空字串 */
  invoiceNo: string;
}

/** 銀行帳戶總覽的單筆沖帳事件（由 POST /ael/bankAccounts/transactions 回應的 BankSettleEventDto 對映，
 *  見 data.ts 的 mapSettleEventToRow）；後端僅提供沖帳事件，無逐筆累計餘額，故不含餘額欄位。 */
export interface BankTxnRow {
  /** 沖帳事件 uuid，列表 key 與交易明細頁路由參數 */
  settleEventUuid: string;
  /** 付款／收款日，YYYYMMDD */
  paymentDate: string;
  /** 0手動／1即沖／2匯總／4銀行提匯等 */
  reconMethod: number;
  /** 0銷項／1進項 */
  side: number;
  /** 交易對象顯示名稱：優先取廠商名稱，取不到（空字串）則回退備註 */
  counterpartyLabel: string;
  /** 帳面沖帳金額 */
  settleAmount: number;
  /** 實際收付金額 */
  cashAmount: number;
  /** 0 匯入／1 提出 */
  cashDirection: number;
  /** 支出金額；與 deposit 互斥，由 cashDirection 展開，比照既有元件慣例 */
  expense: number | null;
  /** 存入金額；與 expense 互斥 */
  deposit: number | null;
  /** 是否為交易恢復（撤銷） */
  isReverse: boolean;
  /** 是否有發票 */
  hasInvoice: boolean;
  /** 交易原單 uuid，供查詢日記帳分錄 */
  mainSettlementLedgerUuid: string;
  /** 交易關聯單 uuid 列表，供查詢關聯帳簿交易 */
  originLedgerUuids: string[];
  primaryOriginLedgerUuid: string;
  createdAt: string;
}

/** 新增銀行提／匯款交易表單送出的資料，對應 POST /ael/bankAccounts/cashMovements body
 *  （companyUuid／bankAccountUuid 由呼叫端另外帶入，見 data.ts createCashMovementTxn） */
export interface NewBankTransactionInput {
  /** 0 匯入／1 提出 */
  cashDirection: number;
  amount: number;
  /** YYYYMMDD */
  paymentDate: string;
  officialAccountingSubjectId: number;
  memo: string;
}
