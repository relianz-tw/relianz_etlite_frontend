import type { SubjectOption } from '@/components/ui/SubjectSelect';

export type TransactionMode = 'create' | 'edit';

/** 新增/編輯交易表單的本地狀態，欄位涵蓋銷項與進項全部情境（依 side 顯示對應子集） */
export interface TransactionFormState {
  isAllowance: boolean;
  invoicePeriod: string;
  voucherType: string;
  invoiceTrack: string;
  invoiceSerial: string;
  invoiceNumber: string;
  declarePeriod: string;
  issueDate: Date | undefined;
  payDate: Date | undefined;
  buyerTaxId: string;
  /** 銷項交易對象名稱（買方名稱），API counterpartyName 必填 */
  buyerName: string;
  sellerTaxId: string;
  sellerName: string;
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
  voucherFileName: string | null;
  voucherPreviewUrl: string | null;
}
