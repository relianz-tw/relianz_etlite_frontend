import type { AllowanceRecord, Side } from '../types';
import type { TransactionFormState } from './types';

export { officialSubjectYear } from '../data';

/** 路由 searchParams 的 side 參數解析：非 'purchase' 一律視為 'sales'，供新增/編輯頁共用 */
export function parseSideParam(value: string | string[] | undefined): Side {
  return value === 'purchase' ? 'purchase' : 'sales';
}

export const TAX_RATE_LABEL = '應稅 5%';
export const TAG_PLACEHOLDER = '新增一般標籤';
export const PROJECT_PLACEHOLDER = '選擇專案';

export const INVOICE_PERIOD_OPTIONS = ['115 年 01 - 02 月份', '115 年 03 - 04 月份', '115 年 05 - 06 月份'];
export const DECLARE_PERIOD_OPTIONS = ['115/02/09', '115/01/09', '115/03/09'];

export const VOUCHER_TYPES = ['一般發票', '交通通聯', '水電瓦斯', '進口稅單', '收據 (無稅額)'];

/** 進項憑證種類 → API voucherKind 數字對照（0收據 1統一發票 2交通 3水電 4進口） */
export const VOUCHER_KIND_MAP: Record<string, number> = {
  一般發票: 1,
  交通通聯: 2,
  水電瓦斯: 3,
  進口稅單: 4,
  '收據 (無稅額)': 0,
};

/** Date → API 需要的西元 YYYYMMDD 字串 */
export function formatYmd(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export const SALES_INVOICE_BOOK_OPTIONS = ['三聯式 TW56789900'];
export const PURCHASE_INVOICE_NUMBER_OPTIONS = ['VG-12345678'];

export const EMPTY_TRANSACTION_FORM: TransactionFormState = {
  isAllowance: false,
  invoicePeriod: INVOICE_PERIOD_OPTIONS[0],
  voucherType: VOUCHER_TYPES[0],
  invoiceTrack: '',
  invoiceSerial: '',
  // 新增銷項的發票號碼為單選發票簿下拉（僅一個選項，瀏覽器會自動帶入）；新增進項若憑證種類非一般發票則改用這個欄位輸入憑證編號
  invoiceNumber: '',
  declarePeriod: DECLARE_PERIOD_OPTIONS[0],
  issueDate: undefined,
  payDate: undefined,
  buyerTaxId: '',
  buyerName: '',
  sellerTaxId: '',
  sellerName: '',
  // 銷售管道改為串接真實銷售管道 API 後才有可選值，預設空字串代表「不指定」
  channel: '',
  tag: TAG_PLACEHOLDER,
  project: PROJECT_PLACEHOLDER,
  expenseCategory: null,
  salesAmount: 0,
  exemptSalesAmount: 0,
  taxAmount: 0,
  // 未特別勾選「不可扣抵」前，依 API 慣例視為可扣抵
  deductible: true,
  unreportedReason: '',
  importTaxNumber: '',
  others: 0,
  note: '',
  voucherFileName: null,
  voucherPreviewUrl: null,
};

/** 編輯銷項的假資料種子：入帳金額 $1,473 + 手續費 $27 = 交易總金額 $1,500（與編輯進項種子對齊，方便對照） */
export const EDIT_SALES_FORM: TransactionFormState = {
  ...EMPTY_TRANSACTION_FORM,
  invoiceNumber: SALES_INVOICE_BOOK_OPTIONS[0],
  issueDate: new Date(2026, 1, 9),
  channel: 'MoMo',
  salesAmount: 1400,
  taxAmount: 100,
  voucherFileName: '發票掃描檔.jpg',
};

export interface SalesStatusSummary {
  declareStatus: string;
  declareDate: string;
  postedDate: string;
  postedAmount: number;
  fee: number;
}
export const SALES_STATUS_SUMMARY: SalesStatusSummary = {
  declareStatus: '尚未申報',
  declareDate: '115-3',
  postedDate: '115-2-9',
  postedAmount: 1473,
  fee: 27,
};

/** 編輯銷項交易的折讓歷史紀錄假資料 */
export const TRANSACTION_ALLOWANCES: AllowanceRecord[] = [
  { id: 'ALW-EDIT-01', date: '115/02/15', amount: 200, note: '出貨數量認列錯誤，折讓部分金額' },
];

/** 編輯進項的假資料種子：賣家統編/名稱維持空白（沿用原型呈現的待補值狀態） */
export const EDIT_PURCHASE_FORM: TransactionFormState = {
  ...EMPTY_TRANSACTION_FORM,
  invoiceNumber: PURCHASE_INVOICE_NUMBER_OPTIONS[0],
  declarePeriod: DECLARE_PERIOD_OPTIONS[0],
  issueDate: new Date(2026, 1, 9),
  expenseCategory: { subjectCode: '0100010', name: '薪資支出' },
  salesAmount: 1400,
  taxAmount: 100,
  voucherFileName: '發票掃描檔.jpg',
};

export interface PurchaseStatusSummary {
  declareStatus: string;
  declareDate: string;
  payDate: string;
  payAmount: number;
}
export const PURCHASE_STATUS_SUMMARY: PurchaseStatusSummary = {
  declareStatus: '已申報完成',
  declareDate: '115-3',
  payDate: '115-2-9',
  payAmount: 1500,
};
