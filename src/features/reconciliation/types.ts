export type ReconSide = 'receivable' | 'payable';

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
