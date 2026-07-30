/**
 * 帳簿區後端 API 的 DTO 型別，對應 ledger.html 內嵌 OpenAPI 規格（/ael/vendors 群組）。
 * 命名直接沿用後端欄位名稱，與前端畫面用的 VendorRecord（src/features/settings/data.ts）在
 * VendorSection/VendorDialog 呼叫處做轉換，避免公用底層型別與畫面型別耦合。
 */
export interface VendorDto {
  uuid: string;
  companyUuid: string;
  taxId: string;
  name: string;
  registeredAddress: string;
  bankAccountName: string;
  bankCode: string;
  bankName: string;
  branchName: string;
  accountNo: string;
  isActive: boolean;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateVendorBody = Pick<
  VendorDto,
  'companyUuid' | 'taxId' | 'name' | 'registeredAddress' | 'bankAccountName' | 'bankCode' | 'bankName' | 'branchName' | 'accountNo' | 'remark'
>;

export type UpdateVendorBody = Pick<
  VendorDto,
  | 'uuid'
  | 'companyUuid'
  | 'taxId'
  | 'name'
  | 'registeredAddress'
  | 'bankAccountName'
  | 'bankCode'
  | 'bankName'
  | 'branchName'
  | 'accountNo'
  | 'remark'
  | 'isActive'
>;

export interface VendorExistsResult {
  exists: boolean;
  vendor: VendorDto | null;
}

/**
 * 公司銀行帳戶 DTO，對應 bank.html 內嵌 OpenAPI 規格（/ael/bankAccounts 群組）。
 * lastBalanceUpdateDate 格式為 YYYYMMDD 字串，新建帳戶尚未有紀錄時為 null。
 */
export interface BankAccountDto {
  uuid: string;
  companyUuid: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  branchName: string;
  accountNo: string;
  currentBalance: number;
  lastBalanceUpdateDate: string | null;
  isDefaultReceivingAccount: boolean;
  isDefaultPaymentAccount: boolean;
  isActive: boolean;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateBankAccountBody = Pick<
  BankAccountDto,
  | 'companyUuid'
  | 'accountName'
  | 'bankCode'
  | 'accountNo'
  | 'bankName'
  | 'branchName'
  | 'currentBalance'
  | 'isDefaultReceivingAccount'
  | 'isDefaultPaymentAccount'
  | 'isActive'
  | 'remark'
>;

export type UpdateBankAccountBody = Pick<
  BankAccountDto,
  | 'uuid'
  | 'companyUuid'
  | 'accountName'
  | 'bankCode'
  | 'accountNo'
  | 'bankName'
  | 'branchName'
  | 'currentBalance'
  | 'isDefaultReceivingAccount'
  | 'isDefaultPaymentAccount'
  | 'isActive'
  | 'remark'
> & {
  /** YYYYMMDD；後端要求必填，本次介面未提供異動餘額功能，故一律回填原值 */
  lastBalanceUpdateDate: string;
};

/**
 * 公司基本設定 DTO，對應 basic.html 內嵌 OpenAPI 規格（/ael/basic/companySetting）。
 * buyReconciliationMethod／sellReconciliationMethod 等對帳方式欄位本次不接 UI，僅保留型別完整性。
 */
export interface BasicSettingDto {
  acUuid: string;
  taxIdNumber: string;
  taxId: string;
  companyName: string;
  companyAddrPostal: string;
  companyAddr: string;
  orgType: string;
  headName: string;
  headPhone: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactRemark: string;
  agencyCode: string;
  introduction: string;
  propertyTaxNo: string;
  nhiInsuranceCode: string;
  customerNumber: number;
  disasterRateId: number | null;
  buyReconciliationMethod: number;
  sellReconciliationMethod: number;
  createTime: string;
  updateTime: string;
}

/** PATCH /ael/basic/companySetting/reconciliationMethod 除 acUuid 外皆選填，不傳的欄位後端不會更動 */
export interface UpdateBasicSettingBody {
  acUuid: string;
  headName?: string;
  headPhone?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  nhiInsuranceCode?: string;
}

/**
 * 官方費用科目 DTO（/ael/subject/official/list），依 year（民國年）帶出該年度科目清單。
 * debitCreditType／remark 目前皆為 null，本次介面不使用。
 */
export interface OfficialSubjectDto {
  id: number;
  year: number;
  subjectCode: string;
  name: string;
  debitCreditType: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 使用者常用科目 DTO（/ael/subject/usage），依 rank 由小到大排序即為常用程度排名 */
export interface SubjectUsageDto {
  acUuid: string;
  rank: number;
  subjectName: string;
  useCount: number;
  createTime: string;
  updateTime: string;
}
