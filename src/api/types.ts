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

/**
 * 銷售管道規則 DTO，對應 sale.md 內嵌 OpenAPI 規格（/ael/payment/channelRules 群組）。
 * feeRateBps／feeFixedAmount（手續費）本次介面暫不編輯，一律傳 0，留待日後補上。
 */
export interface ChannelRuleDto {
  uuid: string;
  companyUuid: string;
  channelName: string;
  /** 入帳規則類型，0:固定延遲天數，1:每週固定星期，2:每月固定日期 */
  settlementStyle: number;
  /** settlementStyle=0 為延遲天數；=1 為每週星期；=2 為每月日期 */
  settlementAmount: number;
  /** 關聯公司銀行帳戶 uuid */
  receivingAccountUuid: string;
  /** 手續費基點（2.75%=275），本次介面暫不編輯 */
  feeRateBps: number;
  /** 固定手續費(元)，本次介面暫不編輯 */
  feeFixedAmount: number;
  isActive: boolean;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateChannelRuleBody = Pick<
  ChannelRuleDto,
  'companyUuid' | 'channelName' | 'settlementStyle' | 'settlementAmount' | 'receivingAccountUuid' | 'feeRateBps' | 'feeFixedAmount' | 'isActive' | 'remark'
>;

export type UpdateChannelRuleBody = CreateChannelRuleBody & Pick<ChannelRuleDto, 'uuid'>;

/**
 * 建立進項應付交易紀錄（POST /ael/ledger/payables）body。
 * entryDate 後端規格為必填，但本次介面允許使用者留空（留待日後手動入帳），
 * 標為選填讓表單留空時 JSON.stringify 自動略過該欄位。
 */
export interface CreatePayableBody {
  /** 字軌；有值時 invoiceNum 當純號碼 */
  alphabeticLetter?: string;
  companyUuid: string;
  /** 交易對象名稱 */
  counterpartyName: string;
  /** 賣方統編；選填 */
  counterpartyTaxId?: string;
  /** 0:廠商B2B，1:個人B2C */
  counterpartyType: number;
  /** 廠商 uuid；僅 counterpartyType=0 可帶，選填 */
  counterpartyUuid?: string;
  /** 交易發生日 YYYYMMDD */
  datetime: string;
  /** 可否扣抵；選填，未傳當可扣抵 */
  deductible?: boolean;
  /** 交易付款日 YYYYMMDD；選填 */
  entryDate?: string;
  /** 是否折讓 */
  ifDebit: boolean;
  /** 進口專用：海關代徵營業稅繳納證號碼 */
  importTaxNumber?: string;
  /** 發票日 YYYYMMDD */
  invoiceDate: string;
  /** 完整號碼；統一發票可為「字軌+號碼」；voucherKind≠4 時必填 */
  invoiceNum?: string;
  /** 是否退貨（進口等場景） */
  isReturnGoods?: boolean;
  /** 備註；選填 */
  memo?: string;
  /** 未稅 */
  netAmount: number;
  /** 官方科目 id（進貨／費用科目） */
  officialAccountingSubjectId: number;
  /** 進口專用：其他零總稅費加總 */
  others?: number;
  /** 發票備註 */
  remark?: string;
  /** 摘要 */
  summary?: string;
  /** 稅額 */
  taxAmount: number;
  /** 免稅銷售額；選填，未傳當 0 */
  taxFreeAmount?: number;
  /** 含稅總額 */
  totalAmount: number;
  /** 未申報／不可扣抵原因 */
  unreportedReason?: string;
  /** 進項：0收據 1統一發票 2交通 3水電 4進口 */
  voucherKind: number;
}

/** 建立銷項應收交易紀錄（POST /ael/ledger/receivables）body；entryDate 選填理由同 CreatePayableBody */
export interface CreateReceivableBody {
  alphabeticLetter?: string;
  companyUuid: string;
  counterpartyName: string;
  /** 買方統編；選填 */
  counterpartyTaxId?: string;
  counterpartyType: number;
  counterpartyUuid?: string;
  datetime: string;
  deductible?: boolean;
  /** 交易收款日 YYYYMMDD；選填 */
  entryDate?: string;
  ifDebit: boolean;
  /** 進口專用欄位（銷項通常不用） */
  importTaxNumber?: string;
  invoiceDate: string;
  /** 完整號碼；統一發票可為「字軌+號碼」 */
  invoiceNum: string;
  isReturnGoods?: boolean;
  memo?: string;
  netAmount: number;
  /** 官方科目 id（收入科目） */
  officialAccountingSubjectId: number;
  /** 進口專用其他稅費加總（銷項通常 0） */
  others?: number;
  /** 銷售管道 uuid；選填，須屬該公司且啟用 */
  paymentChannelUuid?: string;
  remark?: string;
  summary?: string;
  taxAmount: number;
  taxFreeAmount?: number;
  totalAmount: number;
  unreportedReason?: string;
  /** 銷項憑證類型；實務可傳 1（統一發票） */
  voucherKind: number;
}
