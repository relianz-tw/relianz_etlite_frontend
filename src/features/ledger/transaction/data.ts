import { listOfficialSubjects } from '@/api/subjects';
import type { EntryInvoiceDetailDto } from '@/api/types';
import type { SubjectOption } from '@/components/ui/SubjectSelect';
import type { Side } from '../types';
import type { TransactionFormState } from './types';

/** 路由 searchParams 的 side 參數解析：非 'purchase' 一律視為 'sales'，供新增/編輯頁共用 */
export function parseSideParam(value: string | string[] | undefined): Side {
  return value === 'purchase' ? 'purchase' : 'sales';
}

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
  originLedgerUuid: '',
  declared: false,
  invoicePeriod: INVOICE_PERIOD_OPTIONS[0],
  voucherType: VOUCHER_TYPES[0],
  invoiceTrack: '',
  invoiceSerial: '',
  // 新增銷項的發票號碼為單選發票簿下拉（僅一個選項，瀏覽器會自動帶入）；新增進項若憑證種類非一般發票則改用這個欄位輸入憑證編號
  invoiceNumber: '',
  declarePeriod: DECLARE_PERIOD_OPTIONS[0],
  issueDate: undefined,
  buyerTaxId: '',
  buyerName: '',
  sellerTaxId: '',
  sellerName: '',
  sellerVendorUuid: '',
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

/** cmsPhase 雙月期別代碼（1/3/5/7/9/11）→ 申報期間顯示字串，如 "115 年 01 - 02 月份" */
function formatDeclarePeriod(cmsYear: number, cmsPhase: number): string {
  const start = String(cmsPhase).padStart(2, '0');
  const end = String(cmsPhase + 1).padStart(2, '0');
  return `${cmsYear} 年 ${start} - ${end} 月份`;
}

/**
 * GET /ael/ledger/entries/detail 回應的 invoice 區塊 → 交易表單狀態。
 * entry／settlements 區塊本次未使用；invoice 沒有對應資料的欄位（標籤/專案/銷售管道等）維持
 * EMPTY_TRANSACTION_FORM 預設值，畫面上以「尚未串接」標記提醒。
 * invoice 為 null（該筆交易尚未關聯發票）時整份表單維持 EMPTY_TRANSACTION_FORM，不視為錯誤。
 */
export function mapInvoiceDetailToForm(side: Side, invoice: EntryInvoiceDetailDto | null): TransactionFormState {
  if (!invoice) return EMPTY_TRANSACTION_FORM;
  const common: TransactionFormState = {
    ...EMPTY_TRANSACTION_FORM,
    invoiceTrack: invoice.invoiceTrack,
    invoiceSerial: invoice.invoiceNumber,
    invoiceNumber: `${invoice.invoiceTrack}${invoice.invoiceNumber}`,
    declarePeriod: formatDeclarePeriod(invoice.cmsYear, invoice.cmsPhase),
    issueDate: new Date(invoice.year + 1911, invoice.month - 1, invoice.day),
    salesAmount: invoice.sales,
    exemptSalesAmount: invoice.taxFreeAmount,
    taxAmount: invoice.businessTax,
    note: invoice.remark,
    voucherPreviewUrl: invoice.invoicePicUrl || null,
    isAllowance: invoice.isAllowance,
    declared: invoice.declared === 1,
  };
  return side === 'sales'
    ? { ...common, buyerTaxId: invoice.buyerTaxIdNumber }
    : { ...common, sellerTaxId: invoice.sellerTaxIdNumber, sellerName: invoice.companyName };
}

/**
 * entry.officialAccountingSubjectId → SubjectOption，比照帳簿列表 mapPayableItemsToRows 向
 * /ael/subject/official/list/latest 反查科目的方式；查無對應科目時退回以編號顯示。
 */
export async function resolveExpenseCategory(subjectId: number): Promise<SubjectOption> {
  const subjectList = await listOfficialSubjects();
  const subject = subjectList.find(s => s.id === subjectId);
  return subject
    ? { id: subject.id, subjectCode: subject.subjectCode, name: subject.name }
    : { id: subjectId, subjectCode: '', name: `科目 #${subjectId}` };
}
