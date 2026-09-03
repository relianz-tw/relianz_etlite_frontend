import type { MockFile } from '../components/mockFile';

/** 各類扣繳類別代碼：51 租金、9A 執行業務、9B 稿費、53 權利金、5B 其他利息、91 中獎、93 退職、97 受贈、92 其他所得 */
export type CategoryCode = '51' | '9A' | '9B' | '53' | '5B' | '91' | '93' | '97' | '92';

/** 所得人身份：個人／事務所／公司行號（事務所僅執行業務/稿費類別可選） */
export type EarnerType = 'individual' | 'firm' | 'company';

/** 居住狀態，僅租金使用：本國人並居住滿 183 天 / 外國人或居住未滿 183 天 */
export type Residency = 'domestic' | 'foreign';

/** 租金稅費負擔方：承租人負擔（不含稅費）／房東負擔（含稅費） */
export type Burden = 'tenant' | 'landlord';

/** 二代健保申報狀態：0 取消申報、1 已受理、2 系統入檔中、3 入檔成功、4 入檔失敗 */
export type NhiDeclareStatus = 0 | 1 | 2 | 3 | 4;

/** 租金房東資料，可多筆 */
export interface Landlord {
  id: string;
  name: string;
  idNumber: string;
  address: string;
}

export interface WithholdingRecord {
  uuid: string;
  /** 編號，對應原版「扣繳首頁編號」欄，此處以流水號模擬 */
  withholdingId: string;
  categoryCode: CategoryCode;
  earnerType: EarnerType;
  /** 僅租金使用，其餘類別固定 'domestic' */
  residency: Residency;
  /** 僅執行業務/稿費使用，決定業別代號選單來源 */
  incomeCategory?: '9A' | '9B';
  /** 業別代號，僅執行業務/稿費使用 */
  practiceTypeCode?: string;
  /** 表格顯示用所得人姓名；租金多房東時以「、」串接 */
  recipientName: string;
  /** 身分證字號或統一編號 */
  recipientIdNumber: string;
  recipientAddress: string;
  /** 僅租金使用，其餘類別固定 [] */
  landlords: Landlord[];
  /** 以下三欄僅租金使用 */
  rentalAddress: string;
  rentalAddressTaxId: string;
  burden: Burden;
  rentalFiles: MockFile[];
  paymentYear: number;
  paymentMonth: number;
  paymentDay: number;
  incomeYear: number;
  incomeMonth: number;
  grossIncome: number;
  withholdingAmount: number;
  nhiAmount: number;
  netPayment: number;
  remarks: string;
  withholdingPaid: boolean;
  withholdingFiles: MockFile[];
  withholdingProofFiles: MockFile[];
  nhiPaid: boolean;
  nhiFiles: MockFile[];
  nhiProofFiles: MockFile[];
  isNhiDeclared: boolean;
  nhiDeclareStatus: NhiDeclareStatus;
}
