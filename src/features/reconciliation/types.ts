export type ReconSide = 'receivable' | 'payable';

/** 沖帳紀錄中引用的單筆帳簿交易，僅取顯示與加總所需欄位 */
export interface ReconTxnRef {
  /** 應收/應付帳款真實 uuid，用於沖帳識別、去重比對與（日後）呼叫沖帳 API */
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
  /** 該筆交易目前生效的銷售管道／廠商 uuid（含使用者手動歸類覆寫後的結果）；未指定為 null */
  channelUuid?: string | null;
}

/**
 * 一筆匯總沖帳紀錄：使用者於匯總沖帳頁選擇銷售管道／廠商，輸入對帳單金額與手續費後，
 * 由使用者逐筆勾選要沖銷的待沖帳款，確認後寫入本紀錄。
 * 可沖銷總額（pool）= statementAmount + feeAmount + carryOverIn，
 * 因發票金額為管道預扣手續費前的原始金額，須把手續費加回才能對應到待沖帳款的金額。
 */
export interface ReconRecord {
  id: string;
  side: ReconSide;
  groupLabel: string; // 應收：銷售管道；應付：廠商名稱
  statementAmount: number; // 使用者輸入的本次對帳單金額（未加回手續費）
  feeAmount: number;
  /** 本次併入 pool 的上次結餘（帶入使用） */
  carryOverIn: number;
  matched: ReconTxnRef[]; // 使用者本次勾選沖銷的交易
  matchedAmount: number;
  /** pool - matchedAmount；大於 0 代表本次金額有餘額未沖入（多收/多付） */
  surplus: number;
  /** 本次留到下次沖帳使用的結餘（使用者選擇「留餘額下次用」時 = surplus，否則為 0） */
  carryOverOut: number;
  unmatched: ReconTxnRef[]; // 該群組本次未勾選沖帳的交易（少沖，維持待沖帳狀態）
}
