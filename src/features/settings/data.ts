/** 職災費率類別後端無對應欄位，維持前端唯讀 mock */
export const BASIC_INFO_LABOR_RISK = '運輸輔助業（報關業及船務代理業、陸上運輸輔助業除外）、倉儲業（0.23%）';

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
  bankBranch: string;
  accountNumber: string;
  balance: number;
  /** 最後更新餘額日期，YYYYMMDD；尚無紀錄時為空字串 */
  lastBalanceUpdateDate: string;
  remark: string;
  isActive: boolean;
  /** 預設收款／付款戶頭，各自全站唯一；設定新的預設時由前端負責先解除舊帳戶的旗標 */
  isDefaultReceivingAccount: boolean;
  isDefaultPaymentAccount: boolean;
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

export interface ChannelRuleRecord {
  id: string;
  channelName: string;
  /** 入帳規則類型，0:固定延遲天數，1:每週固定星期，2:每月固定日期 */
  settlementStyle: number;
  settlementAmount: number;
  /** 收款帳戶 uuid，對應 BankAccountRecord.id */
  receivingAccountUuid: string;
  remark: string;
  isActive: boolean;
  /** 當前餘額（銷項匯總沖帳超沖/少沖記餘額時異動） */
  balance: number;
}

export const SETTLEMENT_STYLE = {
  AFTER_INVOICE_DAYS: 0,
  WEEKLY: 1,
  MONTHLY: 2,
} as const;

// 註：sale.md 未定義 settlementStyle=1（每週）星期數字對應，暫採 1=週一…7=週日，日後需與後端確認
export const SETTLEMENT_WEEKDAYS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
export const SETTLEMENT_MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/** 入帳規則轉為顯示文字，例：「發票開立後 7 天」／「每週三」／「每月 15 號」 */
export function formatSettlement(style: number, amount: number): string {
  if (style === SETTLEMENT_STYLE.WEEKLY) {
    return `每週${SETTLEMENT_WEEKDAYS[amount - 1] ? SETTLEMENT_WEEKDAYS[amount - 1].replace('週', '') : amount}`;
  }
  if (style === SETTLEMENT_STYLE.MONTHLY) {
    return `每月 ${amount} 號`;
  }
  return `發票開立後 ${amount} 天`;
}

export interface VendorRecord {
  id: string;
  taxId: string;
  name: string;
  address: string;
  bankAccountName: string;
  /** 銀行代碼，對應 BANK_CODE_OPTIONS 的 code；後端建立/更新廠商時為必填欄位 */
  bankCode: string;
  bankName: string;
  bankBranch: string;
  bankAccountNumber: string;
  remark: string;
  isActive: boolean;
  /** 當前餘額（進項匯總沖帳超沖/少沖記餘額時異動） */
  balance: number;
}

export const SETTINGS_VENDORS: VendorRecord[] = [
  {
    id: 'V001',
    taxId: '12345678',
    name: '友信創新股份有限公司',
    address: '台北市信義區松高路1號',
    bankAccountName: '友信創新股份有限公司',
    bankCode: '822',
    bankName: '中國信託',
    bankBranch: '港墅分行',
    bankAccountNumber: '822-01256789012',
    remark: '',
    isActive: true,
    balance: 0,
  },
  {
    id: 'V002',
    taxId: '',
    name: '名子很長很長很長很長股份有限公司',
    address: '',
    bankAccountName: '',
    bankCode: '',
    bankName: '',
    bankBranch: '',
    bankAccountNumber: '',
    remark: '',
    isActive: true,
    balance: 0,
  },
];
