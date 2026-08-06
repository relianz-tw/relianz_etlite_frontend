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
 * 官方費用科目 DTO（/ael/subject/official/list/latest），帶出最新一版科目清單，不需帶 year 參數。
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
 * feeRateBps／feeFixedAmount（手續費）本次介面暫不編輯，建立/更新時一律不帶這兩個欄位，留待日後補上。
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
  feeRateBps: number | null;
  /** 固定手續費(元)，本次介面暫不編輯 */
  feeFixedAmount: number | null;
  isActive: boolean;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateChannelRuleBody = Pick<
  ChannelRuleDto,
  'companyUuid' | 'channelName' | 'settlementStyle' | 'settlementAmount' | 'receivingAccountUuid' | 'isActive' | 'remark'
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

/** 查詢進項應付交易列表（POST /ael/ledger/payables/filter）body */
export interface PayablesFilterBody {
  /** 金額下限 */
  amountFrom?: number;
  /** 金額上限 */
  amountTo?: number;
  companyUuid: string;
  /** 日期起，YYYYMMDD */
  dateFrom?: string;
  /** 日期迄，YYYYMMDD */
  dateTo?: string;
  /** 0 交易編號、1 發票號碼；兩者皆空＝不篩；必須和 filterValue 一起傳，只傳一邊 → 400 */
  filterType?: number;
  /** 篩選值 */
  filterValue?: string;
  /** 一頁筆數 */
  limit: number;
  /** 頁碼 */
  page: number;
}

/** 進項應付交易列表單筆項目 */
/**
 * 應收/應付交易內嵌的憑證資訊（隨 /ael/ledger/receivables|payables/filter 一併回傳，非另一支 API）；
 * 交易尚未有對應憑證（如手動入帳、無票收據）時為 null。
 */
export interface LedgerEntryInvoiceDto {
  uuid: string;
  /** 發票字軌；二聯式/三聯式發票才有，收據等其他憑證類型可能為空字串 */
  invoiceTrack: string;
  invoiceNumber: string;
  /** 民國年 YYYMMDD，如 1150717 */
  date: string;
  amount: number;
  businessTax: number;
  buyOrSell: number;
  ourInvoiceType: number;
  counterpartyTaxId: string;
}

export interface PayableListItemDto {
  ledgerUuid: string;
  orderCode: string;
  /** 交易付款日 YYYYMMDD；未入帳時為 null */
  entryDate: string | null;
  entryType: number;
  entryKind: number;
  direction: number;
  status: number;
  counterpartyName: string;
  counterpartyType: number;
  counterpartyUuid: string | null;
  totalAmount: number;
  netAmount: number;
  taxAmount: number;
  taxFreeAmount: number;
  settledAmount: number;
  remainingAmount: number;
  settlementStatus: number;
  officialAccountingSubjectId: number;
  memo: string;
  createdAt: string;
  invoice: LedgerEntryInvoiceDto | null;
}

/** 查詢進項應付交易列表回應（data 內容） */
export interface PayablesFilterResult {
  items: PayableListItemDto[];
  total: number;
  limit: number;
  page: number;
  /** 已收憑證金額（彙總） */
  receivedVoucherAmount: number;
  /** 已付款金額（彙總） */
  paidAmount: number;
  /** 應付帳款金額（彙總） */
  payableAmount: number;
}

/** 查詢銷項應收交易列表（POST /ael/ledger/receivables/filter）body */
export interface ReceivablesFilterBody {
  /** 金額下限 */
  amountFrom?: number;
  /** 金額上限 */
  amountTo?: number;
  companyUuid: string;
  /** 日期起，YYYYMMDD */
  dateFrom?: string;
  /** 日期迄，YYYYMMDD */
  dateTo?: string;
  /** 0 交易編號、1 發票號碼；兩者皆空＝不篩；必須和 filterValue 一起傳，只傳一邊 → 400 */
  filterType?: number;
  /** 篩選值 */
  filterValue?: string;
  /** 一頁筆數 */
  limit: number;
  /** 頁碼 */
  page: number;
}

/** 銷項應收交易列表單筆項目 */
export interface ReceivableListItemDto {
  ledgerUuid: string;
  orderCode: string;
  /** 交易收款日 YYYYMMDD；未入帳時為 null */
  entryDate: string | null;
  entryType: number;
  entryKind: number;
  direction: number;
  status: number;
  counterpartyName: string;
  counterpartyType: number;
  counterpartyUuid: string | null;
  /** 銷售管道 uuid；未指定時為 null */
  paymentChannelUuid: string | null;
  totalAmount: number;
  netAmount: number;
  taxAmount: number;
  taxFreeAmount: number;
  settledAmount: number;
  remainingAmount: number;
  settlementStatus: number;
  officialAccountingSubjectId: number;
  memo: string;
  createdAt: string;
  invoice: LedgerEntryInvoiceDto | null;
}

/** 查詢銷項應收交易列表回應（data 內容） */
export interface ReceivablesFilterResult {
  items: ReceivableListItemDto[];
  total: number;
  limit: number;
  page: number;
  /** 已開立憑證金額（彙總） */
  issuedVoucherAmount: number;
  /** 已收款金額（彙總） */
  collectedAmount: number;
  /** 應收帳款金額（彙總） */
  receivableAmount: number;
}

/** 應收帳款手動入帳沖帳物件 */
export interface ReceivableAllocation {
  /** 金額 */
  amount: number;
  /** 銀行帳戶 uuid */
  bankAccountUuid: string;
  /** 實際存入金額 */
  depositAmount: number;
  /** 手續費 */
  feeAmount: number;
  /** YYYYMMDD */
  paymentDate: string;
  /** 應收帳款 uuid */
  receivableLedgerUuid: string;
}

/** 應收帳款手動入帳（POST /ael/ledger/receivables/settle）body */
export interface SettleReceivableBody {
  /** 沖帳物件 */
  allocations: ReceivableAllocation[];
  companyUuid: string;
  /** 備註 */
  memo: string;
}

/**
 * 應付帳款手動入帳（POST /ael/ledger/payables/settle）body。
 * 後端沖帳物件與應收帳款共用同一 Allocation 結構（含欄位名稱 receivableLedgerUuid），
 * 呼叫端傳入應付帳款 uuid 即可，非命名錯誤。
 */
export interface SettlePayableBody {
  /** 沖帳物件 */
  allocations: ReceivableAllocation[];
  companyUuid: string;
  /** 備註 */
  memo: string;
}

/** 匯總沖帳預覽請求中的手續費物件（單一物件，非陣列） */
export interface SettleReceivablePreviewFee {
  /** 沖帳項目名稱，目前固定帶入「手續費」 */
  name: string;
  /** 手續費 */
  feeAmount: number;
}

/** 匯總沖帳預覽的額外扣款項（可無限新增） */
export interface SettleReceivableOtherDeduction {
  /** 沖帳項目名稱 */
  name: string;
  /** 沖帳金額 */
  amount: number;
  /** 科目 id */
  officialAccountingSubjectId: number;
}

/** POST /ael/ledger/reconciliation/receivables/settle/preview body */
export interface SettleReceivablePreviewBody {
  /** 沖帳手續費物件 */
  allocations: SettleReceivablePreviewFee;
  companyUuid: string;
  /** 銷項實際存入 */
  depositAmount: number;
  /** 使用者未新增任何額外金額時不傳此參數 */
  otherDeductions?: SettleReceivableOtherDeduction[];
  /** 銷售管道 uuid */
  paymentChannelUuid: string;
  /** 本次匯總沖帳總額（元）；依 transaction_date／created_at 由舊到新拆帳，超沖加在最後一筆 */
  settleAmount: number;
}

/** 匯總沖帳預覽回應中，請求手續費物件的回填（後端附加欄位，實測皆為空字串，用途未知） */
export interface SettleReceivablePreviewFeeEcho {
  feeAmount: number;
  name: string;
  settlementLedgerUuid: string;
  orderCode: string;
  relationUuid: string;
}

/** 匯總沖帳預覽回應中，單張原單的拆帳結果 */
export interface SettleReceivablePreviewLedgerAllocation {
  /** 原單 uuid */
  ledgerUuid: string;
  /** 原單交易編號 */
  orderCode: string;
  /** 原單交易日 */
  transactionDate?: string | null;
  /** 沖前剩餘（元） */
  beforeRemaining: number;
  /** 本次分配沖帳額（元） */
  settleAmount: number;
  paymentAmount: number;
  feeAmount: number;
  deductionAmount: number;
  /** 沖後剩餘（元，可負＝超沖） */
  afterRemaining: number;
  /** 沖後狀態：0平衡 1超沖 2少沖 */
  settlementStatus: number;
  /** 本次沖後是否結清（after<=0 且有沖） */
  closed: boolean;
}

/**
 * POST /ael/ledger/reconciliation/receivables/settle/preview 回應。
 * 實測回應中 allocations 並非陣列，而是請求手續費物件的回填；各原單拆帳結果在 ledgerAllocations。
 */
export interface SettleReceivablePreviewResult {
  /** 實際有分配金額（alloc>0）的原單筆數 */
  affectedCount: number;
  allocations: SettleReceivablePreviewFeeEcho;
  /** 各原單拆帳結果 */
  ledgerAllocations: SettleReceivablePreviewLedgerAllocation[];
  /** 請求 otherDeductions 的回填；目前前端未消費此欄位，結構未知，故不進一步型別化 */
  otherDeductions: unknown[];
  /** 應收匯總才有；應付 preview 通常不出現 */
  paymentChannelUuid?: string;
  /** 應付匯總：廠商 uuid；銷項不會出現 */
  counterpartyUuid?: string;
  /** 本次匯總沖帳總額（元） */
  settleAmount: number;
  /** 銷項實際存入 */
  depositAmount: number;
  /** 拆帳前各原單 remaining 合計 */
  totalBeforeRemaining: number;
}

/**
 * POST /ael/ledger/reconciliation/receivables/settle/summary body：真正執行沖帳（非預覽）。
 * 目前僅確認 ledgerUuids／bankAccountUuid 兩個欄位；回應中另有 paymentDate／paymentChannelUuid／settleAmount，
 * 但無法確認這些是否也是請求所需欄位（也可能是後端依 ledgerUuids 反查／自動計算後才回填），需再與後端確認。
 */
export interface SettleReceivableSummaryBody {
  /** 本次勾選要沖帳的原單 uuid 清單 */
  ledgerUuids: string[];
  /** 存入銀行帳戶 uuid */
  bankAccountUuid: string;
  companyUuid: string;
}

/** 匯總沖帳執行結果中，單張原單的沖帳結果 */
export interface SettleReceivableSummaryAllocation {
  /** 原單 uuid */
  ledgerUuid: string;
  /** 原單交易編號 */
  orderCode: string;
  transactionDate?: string | null;
  /** 沖前剩餘 */
  beforeRemaining: number;
  /** 本次分配沖帳額 */
  settleAmount: number;
  /** 沖後剩餘（可負＝超沖） */
  afterRemaining: number;
  /** 0平衡 1超沖 2少沖 */
  settlementStatus: number;
  /** 結算傳票 uuid（alloc>0 才有） */
  settlementLedgerUuid?: string;
  /** 結算傳票編號 */
  settlementOrderCode?: string;
  /** 沖帳關聯 uuid */
  relationUuid?: string;
  closed: boolean;
}

/** POST /ael/ledger/reconciliation/receivables/settle/summary 回應 */
export interface SettleReceivableSummaryResult {
  /** 有沖帳的原單筆數 */
  affectedCount: number;
  allocations: SettleReceivableSummaryAllocation[];
  /** 付款戶頭 */
  bankAccountUuid: string;
  /** 廠商 uuid；銷項不會出現 */
  counterpartyUuid?: string;
  /** 銷售管道 uuid */
  paymentChannelUuid: string;
  /** 付款日 YYYYMMDD */
  paymentDate: string;
  /** 匯總沖帳總額 */
  settleAmount: number;
  /** 唯一匯總結算帳 uuid */
  settlementLedgerUuid: string;
  /** 交易編號 */
  settlementOrderCode: string;
  /** 沖前剩餘合計 */
  totalBeforeRemaining: number;
}

/** GET /ael/ledger/entries/detail 回應的 invoice 區塊；僅型別化本次會使用的欄位 */
export interface EntryInvoiceDetailDto {
  invoiceTrack: string;
  invoiceNumber: string;
  /** 民國年 */
  year: number;
  month: number;
  day: number;
  /** 銷售額 */
  sales: number;
  /** 稅額 */
  businessTax: number;
  taxFreeAmount: number;
  /** 憑證圖片網址，無圖時為空字串 */
  invoicePicUrl: string;
  remark: string;
  buyerTaxIdNumber: string;
  sellerTaxIdNumber: string;
  /** 賣家名稱（進項適用） */
  companyName: string;
  /** 申報年度（民國年） */
  cmsYear: number;
  /** 申報期別代碼：1/3/5/7/9/11，對應雙月期間 */
  cmsPhase: number;
  /** 是否為折讓：1 折讓、2 否 */
  isDebit: number;
  /** 申報狀態：1 已申報、2 未申報 */
  declared: number;
}

/** GET /ael/ledger/entries/detail 回應的 entry 區塊；僅型別化本次會使用的沖帳狀態欄位 */
export interface EntryDetailEntryDto {
  /** 已沖金額（元） */
  settledAmount: number;
  /** 未沖金額（元） */
  remainingAmount: number;
  /** 0平衡 1超沖 2少沖 */
  settlementStatus: number;
  /** 費用類別／收入科目官方科目 id，對應 /ael/subject/official/list/latest 的 id */
  officialAccountingSubjectId: number;
  /** 銷售管道 uuid；未指定時為 null */
  paymentChannelUuid: string | null;
}

/** GET /ael/ledger/entries/detail 回應的單筆沖帳關聯；僅型別化本次會使用的欄位 */
export interface EntryDetailSettlementDto {
  /** receivable_payable_relations.uuid，供列表 key 使用 */
  relationUuid: string;
  /** 沖之前剩餘 */
  beforeSettlementAmount: number;
  /** 沖之後剩餘 */
  afterSettlementAmount: number;
  /** 本次沖帳金額 */
  settlementAmount: number;
  /** true＝沖完後原單仍有餘額；false＝已結清（含超沖） */
  isOpen: boolean;
  /** 關聯備註 */
  remark: string | null;
  /** 結算帳 header；本次只使用 entryDate（入帳日期） */
  settlement: { entryDate: string | null } | null;
}

/** GET /ael/ledger/entries/detail 回應；僅型別化 invoice 區塊與沖帳相關子集
 *  （entry／settlements 其餘欄位如 direction／entryType／status 等本次不使用）。
 *  invoice 沒有關聯發票的交易（如未開立發票的應收帳款）會是 null */
export interface EntryDetailResult {
  entry: EntryDetailEntryDto;
  invoice: EntryInvoiceDetailDto | null;
  settlements: EntryDetailSettlementDto[];
}
