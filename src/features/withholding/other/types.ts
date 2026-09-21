import type { RentalFileDto, WithholdingCategoryCode, WithholdingVoucherTypeCode } from '@/api/types';

/** 各類扣繳類別代碼：51 租金、9A 執行業務、9B 稿費、53 權利金、5B 其他利息、91 中獎、93 退職、97 受贈、92 其他所得 */
export type CategoryCode = WithholdingCategoryCode;

/** 所得人身份：個人／事務所／公司行號（事務所僅執行業務/稿費類別可選） */
export type EarnerType = 'individual' | 'firm' | 'company';

/** 憑證類別：0 收據／1 租約全份／2 租金收據／3 事務所收據 */
export type VoucherType = WithholdingVoucherTypeCode;

/** 租金稅費負擔方：承租人負擔（不含稅費）／房東負擔（含稅費） */
export type Burden = 'tenant' | 'landlord';

/** 二代健保申報狀態：0 取消申報、1 已受理、2 系統入檔中、3 入檔成功、4 入檔失敗 */
export type NhiDeclareStatus = 0 | 1 | 2 | 3 | 4;

/** 租金房東資料，可多筆 */
export interface Landlord {
  /** 新增時前端暫用流水號；已存在的房東為後端 landlordUuid */
  id: string;
  name: string;
  idNumber: string;
  address: string;
}

/**
 * 各類扣繳單筆資料，畫面共用的正規化形狀，由 mapper.ts 從後端 DTO（9 類共用
 * WithholdingOtherRecordDto／租金 RentalRecordDto）轉換而來。
 * ⚠️ 後端無「本國人／外國人」欄位，故不含 residency；繳款書／繳款證明／二代健保申報明細
 * 皆非本紀錄的一部分，改由 WithholdingPdfManager 依 uuid 另外查詢，不放在這裡。
 */
export interface WithholdingRecord {
  uuid: string;
  /** 編號，對應原版「扣繳首頁編號」欄 */
  withholdingId: string;
  categoryCode: CategoryCode;
  earnerType: EarnerType;
  voucherType: VoucherType;
  /** 僅執行業務/稿費使用，決定業別代號選單來源 */
  incomeCategory?: '9A' | '9B';
  /** 業別代號；僅執行業務（9A）使用，對應 code type=1 */
  practiceTypeCode?: string;
  /** 必要費用別代號；僅稿費（9B）使用，對應 code type=2 */
  royaltyExpenseCode?: string;
  /** 給付項目代號；僅其他所得（92）使用，對應 code type=3 */
  otherIncomeTypeCode?: string;
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
  isMonthlyPayment: boolean;
  rentalFiles: RentalFileDto[];
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
  nhiPaid: boolean;
  isNhiDeclared: boolean;
  nhiDeclareStatus: NhiDeclareStatus;
  /**
   * 二代健保署查詢代碼（後端 code 欄位）；重新查詢申報狀態（GET .../declare/checkstatus）需要，
   * 但該端點另需「申報記錄 UUID」——本紀錄的 detail／filter 回應皆未附加此值，僅本次申報流程當下
   * （declareNhi 回應）才拿得到，故跨工作階段重新載入的既有申報紀錄無法重新查詢狀態，只能顯示既有狀態。
   */
  nhiDeclareCode?: string;
}

/**
 * 彙總列表（L1）單列，「同一所得人同一類別」加總；由 mapper.ts 的 mapSummaryGroupDtoToRow
 * 從後端 WithholdingSummaryGroupDto 轉換而來。groupKey 為不透明字串，點擊列時原樣帶入
 * L2 網址（/withholding/other/group/{groupKey}?ic=<類別代碼>）。
 */
export interface WithholdingGroupRow {
  groupKey: string;
  categoryCode: CategoryCode;
  /** 租金多房東以「、」串接 */
  recipientName: string;
  /** 租金多房東時可能為空字串 */
  recipientIdNumber: string;
  /** 僅租金（51）使用 */
  rentalAddress: string;
  recordCount: number;
  grossIncome: number;
  withholdingAmount: number;
  nhiAmount: number;
  netPayment: number;
  unremitWithholdingCount: number;
  unremitNhiCount: number;
  firstPaymentMonth: number;
  lastPaymentMonth: number;
}
