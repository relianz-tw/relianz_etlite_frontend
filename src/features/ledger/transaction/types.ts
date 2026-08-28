import type { SubjectOption } from '@/components/ui/SubjectSelect';

export type TransactionMode = 'create' | 'edit';

/** 新增/編輯交易表單的本地狀態，欄位涵蓋銷項與進項全部情境（依 side 顯示對應子集） */
export interface TransactionFormState {
  isAllowance: boolean;
  /** 折讓時查得的原單交易 uuid；查無原單或非折讓時為空字串，作為「是否可送出」的判斷依據 */
  originLedgerUuid: string;
  /** 申報狀態，對應 API declared（1 已申報、2 未申報） */
  declared: boolean;
  invoicePeriod: string;
  voucherType: string;
  invoiceTrack: string;
  invoiceSerial: string;
  invoiceNumber: string;
  /** 進項一般發票專用：是否為固定資產；true 時科目改篩固定資產折舊與減損科目 */
  isFixedAsset: boolean;
  /** 進項固定資產使用年限（年，正整數）；isFixedAsset 為 true 時必填。
   *  ⚠️ 後端 CreatePayableBody 尚無對應欄位，目前不送出 */
  usefulLifeYears: number;
  /** 新增銷項：選中的發票簿 uuid（GET /ael/invoiceBook 回應的 invoiceBookId），對應 API invoiceBookUuid */
  invoiceBookUuid: string;
  /** 新增銷項：選中發票簿的 part（發票種類，1、2 為三聯式），未選擇發票簿時為 null；三聯式時買家統編／名稱為必填 */
  invoiceBookPart: number | null;
  declarePeriod: string;
  issueDate: Date | undefined;
  /** 銷項：選填，但與 buyerName 需一併填寫（填一項則兩項皆必填） */
  buyerTaxId: string;
  /** 銷項：選填，但與 buyerTaxId 需一併填寫（填一項則兩項皆必填） */
  buyerName: string;
  sellerTaxId: string;
  sellerName: string;
  /** 選擇既有廠商時帶入其 uuid，供建立進項交易時設定 counterpartyUuid；手動編輯賣家統編/名稱時會清空 */
  sellerVendorUuid: string;
  channel: string;
  tag: string;
  project: string;
  expenseCategory: SubjectOption | null;
  salesAmount: number;
  exemptSalesAmount: number;
  taxAmount: number;
  /** 可否扣抵（進項），對應 API deductible */
  deductible: boolean;
  /** 不可扣抵原因，deductible 為 false 時才顯示與帶出，對應 API unreportedReason */
  unreportedReason: string;
  /** 海關代徵營業稅繳納證號碼，僅憑證種類為「進口稅單」時顯示，對應 API importTaxNumber */
  importTaxNumber: string;
  /** 進口其他稅費加總，僅憑證種類為「進口稅單」時顯示，對應 API others */
  others: number;
  note: string;
  /** 摘要，對應 API summary；與備註（remark）是不同欄位，新增非折讓交易時必填 */
  summary: string;
  voucherFileName: string | null;
  voucherPreviewUrl: string | null;
}
