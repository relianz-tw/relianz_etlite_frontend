export interface BasicInfoField {
  label: string;
  value: string;
}

export const BASIC_INFO_FIELDS: BasicInfoField[] = [
  { label: '組織型態', value: '有限公司' },
  { label: '統一編號', value: '93790155' },
  { label: '稅籍編號', value: '323232332' },
  { label: '登記名稱', value: '測試有限公司' },
  { label: '負責人姓名', value: '彭建彰' },
  { label: '健保投保單位代號', value: '153959516' },
];

export const BASIC_INFO_ZIP = '114';
export const BASIC_INFO_ADDRESS = '臺北市內湖區瑞光路358巷30弄6號6樓';
export const BASIC_INFO_LABOR_RISK = '運輸輔助業（報關業及船務代理業、陸上運輸輔助業除外）、倉儲業（0.23%）';

export const BASIC_INFO_CONTACT: BasicInfoField[] = [
  { label: '聯絡人全名', value: '彭建彰' },
  { label: '聯絡人電話', value: '0900000000' },
];
export const BASIC_INFO_EMAIL = 'shuyuan.chuang@relianz.tw';

export interface ProjectRecord {
  id: string;
  name: string;
  status: '已完成' | '進行中';
  startDate: string;
  endDate: string;
}
export const SETTINGS_PROJECTS: ProjectRecord[] = [
  { id: 'p1', name: 'e', status: '已完成', startDate: '2026-03-05', endDate: '2026-03-20' },
  { id: 'p2', name: '測試', status: '已完成', startDate: '2025-12-02', endDate: '2026-01-02' },
];

export interface TagRecord {
  id: string;
  name: string;
}
export const SETTINGS_TAGS: TagRecord[] = [
  { id: 't1', name: '10-1鹿東國小-二校區' },
  { id: 't2', name: '10-B鹿東國小-二校區' },
  { id: 't3', name: '28-A湖西國小' },
];

export interface InvoiceBookRecord {
  id: string;
  name: string;
  trackCode: string;
  startNumber: string;
}
export const INVOICE_PERIOD_LABEL = '115 年 07 月 - 08 月';
export const HAND_INVOICE_BOOKS: InvoiceBookRecord[] = [
  { id: 'ib1', name: '三聯式手開', trackCode: 'CA', startNumber: '32323200' },
];

export interface PlanServiceItem {
  id: string;
  label: string;
}
export const PLAN_QUANTITY_LABEL = '每期 200 張';
export const PLAN_SERVICE_ITEMS: PlanServiceItem[] = [
  { id: 's1', label: '進銷帳管理' },
  { id: 's2', label: '線上稅務申報系統' },
  { id: 's3', label: '線上財務儀表板' },
  { id: 's4', label: '線上稅務小幫手' },
  { id: 's5', label: '每單月營業稅申報' },
  { id: 's6', label: '年度營利事業所得稅申報' },
  { id: 's7', label: '年度各類扣繳申報' },
  { id: 's8', label: '公司暫繳申報' },
];
export const PLAN_PRICE = 3000;
export const PLAN_NEXT_CHARGE_DATE = '2025/7/30';
export const PLAN_CARD_LAST4 = '1111';
export const PLAN_CARD_EXPIRY = '07/30';

export interface BillingRecord {
  id: string;
  month: string;
  amount: number;
  itemLabel: string;
  status: '成功' | '失敗';
  paidDate: string;
  invoiceNumber: string;
}
export const BILLING_YEAR = 2025;
export const BILLING_RECORDS: BillingRecord[] = [
  {
    id: 'b1',
    month: '6月',
    amount: 3000,
    itemLabel: 'EasyTax 簡易稅',
    status: '成功',
    paidDate: '2025/6/30',
    invoiceNumber: 'RELA20252700003',
  },
];

export interface OperatingStatusRecord {
  id: string;
  status: '開業' | '停業' | '復業';
  startDate: string;
  endDate: string;
}
export const CURRENT_OPERATING_STATUS: OperatingStatusRecord['status'] = '復業';
export const OPERATING_STATUS_RECORDS: OperatingStatusRecord[] = [
  { id: 'o1', status: '開業', startDate: '2026-07-01', endDate: '2026-07-16' },
  { id: 'o2', status: '停業', startDate: '2026-07-16', endDate: '2026-07-01' },
  { id: 'o3', status: '復業', startDate: '2026-08-01', endDate: '進行中' },
];

export interface BankAccountRecord {
  id: string;
  nickname: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  updatedDate: string;
}

// 註：僅列常見銀行供下拉選單使用，非官方完整清單；正式清單需另外對照
// https://www.fisc.com.tw/TC/Download/atm.pdf
export const BANK_CODE_OPTIONS = [
  { code: '822', name: '中國信託' },
  { code: '013', name: '國泰世華' },
  { code: '004', name: '台灣銀行' },
  { code: '007', name: '第一銀行' },
  { code: '008', name: '華南銀行' },
  { code: '011', name: '上海商業儲蓄銀行' },
  { code: '012', name: '台北富邦' },
  { code: '017', name: '兆豐國際商業銀行' },
  { code: '050', name: '台灣中小企業銀行' },
  { code: '700', name: '中華郵政' },
  { code: '807', name: '永豐商業銀行' },
  { code: '808', name: '玉山商業銀行' },
  { code: '812', name: '台新國際商業銀行' },
];

export const SEED_BANK_ACCOUNTS: BankAccountRecord[] = [
  {
    id: 'acc1',
    nickname: '收款用中國信託港墅分行',
    bankCode: '822',
    bankName: '中國信託',
    accountNumber: '01256789012',
    balance: 3736519,
    updatedDate: '115/1/1',
  },
];
