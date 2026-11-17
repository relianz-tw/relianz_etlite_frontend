import { getRegistrationDocs } from '@/features/initialization/reports/registrationDocs';

export interface FileSlotDef {
  /** 文件類型代碼，後端 API 上線後作為 docType */
  code: string;
  title: string;
}

/** 營業稅每期的檔案格（401/403 由使用者自行上傳） */
export const BUSINESS_TAX_SLOTS: FileSlotDef[] = [
  { code: 'VAT_RETURN', title: '營業稅申報書（401/403）' },
  { code: 'VAT_PAYMENT_SLIP', title: '營業稅繳款書' },
  { code: 'VAT_PAYMENT_PROOF', title: '營業稅繳款證明' },
];

/** 營所稅每年的檔案格 */
export const INCOME_TAX_SLOTS: FileSlotDef[] = [
  { code: 'CIT_RETURN', title: '營所稅申報書' },
  { code: 'CIT_PAYMENT_SLIP', title: '營所稅繳款書' },
  { code: 'CIT_PAYMENT_PROOF', title: '營所稅繳款證明' },
  { code: 'WITHHOLDING_RETURN', title: '各類扣繳申報書' },
];

/** 營業稅六個申報期別（雙月申報） */
export const VAT_PERIODS = [
  { phase: 1, label: '1 - 2 月' },
  { phase: 2, label: '3 - 4 月' },
  { phase: 3, label: '5 - 6 月' },
  { phase: 4, label: '7 - 8 月' },
  { phase: 5, label: '9 - 10 月' },
  { phase: 6, label: '11 - 12 月' },
];

// TODO：組織型態目前只存在開帳流程 state，後端提供公司資料後改依實際型態取得
export const REGISTRATION_SLOTS: FileSlotDef[] = getRegistrationDocs('limited');
