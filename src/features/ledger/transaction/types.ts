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
  sellerTaxId: string;
  sellerName: string;
  channel: string;
  tag: string;
  project: string;
  expenseCategory: string;
  salesAmount: number;
  taxAmount: number;
  note: string;
  voucherFileName: string | null;
  voucherPreviewUrl: string | null;
}
