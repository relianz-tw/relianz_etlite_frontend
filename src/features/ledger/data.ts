import { listOfficialSubjects } from '@/api/subjects';
import type { LedgerEntryInvoiceDto, PayableListItemDto, ReceivableListItemDto } from '@/api/types';
import { formatRocDate } from '@/components/ui/DatePicker';
import { generateDailyTrend } from '@/lib/utils';
import type { AllowanceLineItem, AllowanceRecord, PurchaseRow, SalesRow } from './types';

export const PROJECT_NAMES = ['好長好長的專案名稱', '台北旗艦店擴建', '年度品牌重塑', ''];
export const SALES_CHANNELS = ['現金', '匯票', '國泰信用卡', 'MoMo'];
export const BANK_ACCOUNTS = ['中國信託港墅分行 (822-01256789012)', '國泰世華敦南分行 (013-98765432101)', '現金'];

/** /ael/ledger/payables/filter 回傳的 YYYYMMDD 或 ISO 日期字串 → Date */
function parseApiDate(value: string): Date | undefined {
  if (/^\d{8}$/.test(value)) {
    const year = parseInt(value.slice(0, 4), 10);
    const month = parseInt(value.slice(4, 6), 10) - 1;
    const day = parseInt(value.slice(6, 8), 10);
    return new Date(year, month, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** 憑證號碼＝發票字軌＋號碼（無字軌的憑證類型 invoiceTrack 為空字串，串接後自然只剩號碼）；無對應憑證時回傳 undefined */
function voucherNumberFromInvoice(invoice: LedgerEntryInvoiceDto | null): string | undefined {
  return invoice ? `${invoice.invoiceTrack}${invoice.invoiceNumber}` : undefined;
}

/**
 * /ael/ledger/payables/filter 一批項目 → 表格 PurchaseRow[]。
 * officialAccountingSubjectId 向 /ael/subject/official/list/latest 查詢最新科目清單反查名稱；
 * 查無對應科目時，退回以編號顯示。專案欄位 API 未提供，故留空。
 * source 標為 'invoice'：費用類別／專案下拉與現有假資料列一致可就地編輯（表格既有編輯皆僅存本地狀態，未串接更新 API）。
 * uuid 帶入真實 uuid 供交易明細頁查詢使用。
 */
export async function mapPayableItemsToRows(items: PayableListItemDto[]): Promise<PurchaseRow[]> {
  const dated = items.map(item => {
    const date = item.entryDate ? parseApiDate(item.entryDate) : parseApiDate(item.createdAt);
    return { item, rocDate: formatRocDate(date) };
  });

  const subjectList = await listOfficialSubjects();
  const subjectNameById = new Map<number, string>();
  subjectList.forEach(subject => subjectNameById.set(subject.id, subject.name));

  return dated.map(({ item, rocDate }) => ({
    id: item.orderCode,
    uuid: item.uuid,
    amount: item.totalAmount,
    party: item.counterpartyName,
    date: rocDate,
    category: subjectNameById.get(item.officialAccountingSubjectId) ?? `科目 #${item.officialAccountingSubjectId}`,
    project: '',
    source: 'invoice',
    counterpartyUuid: item.counterpartyUuid,
    voucherNumber: voucherNumberFromInvoice(item.invoice),
  }));
}

/**
 * /ael/ledger/receivables/filter 一批項目 → 表格 SalesRow[]。
 * 銷項表格不需科目名稱反查（不同於進項），故為同步函式；uuid 帶入真實應收帳款 uuid 供手動入帳沖帳與交易明細頁查詢使用。
 * 銷售管道名稱反查本次未做，channel 留空。
 */
export function mapReceivableItemsToRows(items: ReceivableListItemDto[]): SalesRow[] {
  return items.map(item => {
    const date = item.entryDate ? parseApiDate(item.entryDate) : parseApiDate(item.createdAt);
    return {
      id: item.orderCode,
      uuid: item.uuid,
      amount: item.totalAmount,
      counterparty: item.counterpartyName,
      date: formatRocDate(date),
      channel: '',
      paymentChannelUuid: item.paymentChannelUuid,
      voucherNumber: voucherNumberFromInvoice(item.invoice),
      voided: false,
      allowances: [],
    };
  });
}

const TREND_END_DATE = '2026/03/27'; // 對齊既有假資料中最新的交易日期，趨勢圖固定顯示兩個月（62 天）每日金額

export const SALES_DAILY = generateDailyTrend(0, 16000000, 0.9, TREND_END_DATE);
export const PURCHASE_DAILY = generateDailyTrend(3, 14000000, 0.8, TREND_END_DATE);

const SPLIT_CHILDREN = [
  { id: 'S26XH743195003', amount: 500, date: '115/03/26' },
  { id: 'S26XH743195002', amount: 2000, date: '115/03/29' },
  { id: '可折讓餘額（含稅）', label: '可折讓餘額（含稅）', amount: 7500 },
];

/** 銷貨折讓退回單「發票明細」的可折讓商品假資料 */
export const ALLOWANCE_LINE_ITEMS: AllowanceLineItem[] = [{ id: 'ALI-01', productName: '測試商品A', allowableNet: 952, allowableTax: 48 }];

const UA40435903_ALLOWANCES: AllowanceRecord[] = [
  { id: 'ALW-UA40435903-01', date: '115/03/28', amount: 500, note: '出貨數量認列錯誤，折讓部分金額' },
  { id: 'ALW-UA40435903-02', date: '115/04/02', amount: 1500, note: '客戶議價後補開折讓' },
  { id: 'ALW-UA40435903-03', date: '115/04/10', amount: 800, note: '瑕疵品部分金額折讓' },
];

export const SALES_RECEIVABLE: SalesRow[] = [
  { id: 'UA40435900', amount: 999500999, counterparty: '友信創新股份有限公司', date: '115/03/22', channel: '', voided: false, allowances: [] },
  { id: 'UA40435901', amount: 6800, counterparty: '台積開發股份有限公司', date: '115/03/23', channel: '', voided: false, allowances: [] },
  { id: 'UA40435902', amount: 999500999, counterparty: '我的另一間公司', date: '115/03/25', channel: '', voided: false, allowances: [] },
  { id: 'UA40435903', amount: 10000, counterparty: '名子很長很長很長很長股份有限公司', date: '115/03/26', channel: '', voided: false, allowances: UA40435903_ALLOWANCES, children: SPLIT_CHILDREN },
  { id: 'UA40436010', amount: 85000, counterparty: '大立科技有限公司', date: '115/07/03', channel: '現金', voided: false, allowances: [] },
  { id: 'UA40436011', amount: 320000, counterparty: '晶采設計工作室', date: '115/07/08', channel: '匯票', voided: false, allowances: [] },
  { id: 'UA40436012', amount: 12500, counterparty: '陳先生', date: '115/07/15', channel: '國泰信用卡', voided: false, allowances: [] },
  { id: 'UA40436013', amount: 67800, counterparty: '悅讀書店有限公司', date: '115/07/22', channel: 'MoMo', voided: false, allowances: [] },
  { id: 'UA40436014', amount: 45000, counterparty: '匯入待歸類客戶股份有限公司', date: '115/07/26', channel: '', voided: false, allowances: [] },
];

export const PURCHASE_PAYABLE: PurchaseRow[] = [
  { id: 'UA40435900', amount: 999500999, party: '友信創新股份有限公司', date: '115/03/22', category: '進貨', project: '好長好長的專案名稱', source: 'invoice' },
  { id: 'UA40435901', amount: 6800, party: '', date: '115/03/23', category: '文具用品', project: '', source: 'invoice' },
  { id: 'UA40435902', amount: 999500999, party: '名子很長很長很長很長股份有限公司', date: '115/03/25', category: '修繕費', project: '', source: 'invoice' },
  { id: 'WHT-115-A101', amount: 45000, party: '勞報單 - 王小明', date: '115/03/26', category: '勞務費', project: '', source: 'labor' },
  { id: 'WHT-115-A102', amount: 4500, party: '勞報單 - 陳小柬', date: '115/03/26', category: '代扣稅款', project: '', source: 'labor' },
  { id: 'WHT-115-A103', amount: 350000, party: '薪資 - 2月份', date: '115/03/26', category: '員工薪資', project: '', source: 'salary' },
  { id: 'WHT-115-A104', amount: 50000, party: '薪資 - 2月份', date: '115/03/26', category: '勞健保費', project: '', source: 'salary' },
  { id: 'UA40436020', amount: 158000, party: '友信創新股份有限公司', date: '115/07/05', category: '進貨', project: '台北旗艦店擴建', source: 'invoice' },
  { id: 'UA40436021', amount: 23400, party: '快印設計印刷行', date: '115/07/11', category: '文具用品', project: '', source: 'invoice' },
  { id: 'UA40436022', amount: 76500, party: '名子很長很長很長很長股份有限公司', date: '115/07/18', category: '修繕費', project: '', source: 'invoice' },
  { id: 'UA40436023', amount: 9800, party: '', date: '115/07/24', category: '雜項購置', project: '', source: 'invoice' },
];
