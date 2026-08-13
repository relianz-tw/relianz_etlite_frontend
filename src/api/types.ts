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
  /** 廠商當前餘額（進項匯總沖帳超沖/少沖記餘額時異動）；後端 GET 回應偶見字串格式，讀取時一律 Number() 正規化 */
  balance: number;
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
  | 'balance'
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
  bankAccountUuid: string;
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

/** PATCH /ael/bankAccounts body 的 uuid 為銀行帳戶 uuid，與回應 DTO 的 bankAccountUuid 為同一值但欄位名不同（api.md 第 9828、9849 行） */
export type UpdateBankAccountBody = Pick<
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
> & {
  uuid: string;
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
  channelUuid: string;
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
  /** 銷售管道當前餘額（銷項匯總沖帳超沖/少沖記餘額時異動）；後端回應偶見字串格式，讀取時一律 Number() 正規化 */
  balance: number;
}

export type CreateChannelRuleBody = Pick<
  ChannelRuleDto,
  'companyUuid' | 'channelName' | 'settlementStyle' | 'settlementAmount' | 'receivingAccountUuid' | 'isActive' | 'remark'
> & {
  /** 是否開通固定名稱為「其他」的管道；一般新增管道不帶此欄位 */
  initDefaultOther?: boolean;
};

/** PATCH /ael/payment/channelRules body 的 uuid 為渠道 uuid，與回應 DTO 的 channelUuid 為同一值但欄位名不同（api.md 第 10224、10237 行） */
export type UpdateChannelRuleBody = CreateChannelRuleBody & Pick<ChannelRuleDto, 'balance'> & { uuid: string };

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

/** 建立進折／銷折交易紀錄（POST /ael/ledger/{payables,receivables}/allowance）body；兩支端點欄位完全相同 */
export interface CreateAllowanceBody {
  companyUuid: string;
  /** 欲折讓的原單交易 uuid */
  originLedgerUuid: string;
  /** YYYYMMDD */
  datetime: string;
  /** 含稅總額 */
  totalAmount: number;
  /** 未稅 */
  netAmount: number;
  /** 稅額 */
  taxAmount: number;
  /** 科目 id */
  officialAccountingSubjectId: number;
  /** 備註；選填 */
  memo?: string;
}

/** GET /ael/ledger/invoices/origin 回應的 entry 區塊；僅型別化折讓建立畫面會用到的欄位 */
export interface InvoiceOriginEntryDto {
  ledgerUuid: string;
  orderCode: string;
  transactionDate: string | null;
  counterpartyName: string | null;
  totalAmount: number;
  netAmount: number;
  taxAmount: number;
  officialAccountingSubjectId: number;
  subjectName: string;
  remainingAmount: number;
}

/** GET /ael/ledger/invoices/origin 回應的 invoice 區塊；僅型別化本次會使用的欄位 */
export interface InvoiceOriginInvoiceDto {
  invoiceUuid: string;
  invoiceTrack: string;
  invoiceNumber: string;
}

/**
 * GET /ael/ledger/invoices/origin 回應（發票字軌＋號碼反查業務原單）。
 * invoice／entry 為 null 代表查無對應的原始憑證，此時不可用來建立折讓單。
 */
export interface InvoiceOriginResult {
  entry: InvoiceOriginEntryDto | null;
  invoice: InvoiceOriginInvoiceDto | null;
  isAllowance: boolean;
}

/** GET /ael/ledger/entries/detail 回應中，原單關聯的折讓單摘要 */
export interface EntryDetailAllowanceDto {
  /** 折讓單交易 uuid */
  ledgerUuid: string;
  orderCode: string;
  /** 含稅總額 */
  totalAmount: number;
  /** 未稅額 */
  netAmount: number;
  taxAmount: number;
  /** 折讓金額 */
  allowanceAmount: number;
  /** 0收入 1支出 2應收 3應付 4其他 */
  direction: number;
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
  /** 進折為 true；paid/filter 未記載是否回傳此欄位，故為選填，讀取時應搭配 ?? false */
  isAllowance?: boolean;
  /** 折讓時有值，指原單交易 uuid */
  originLedgerUuid?: string;
  /** 該原單已開立的折讓單數量；大於 0 代表可展開查看折讓單清單 */
  allowanceCount?: number;
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
  /** 銷折為 true；collected/filter 未記載是否回傳此欄位，故為選填，讀取時應搭配 ?? false */
  isAllowance?: boolean;
  /** 折讓時有值，指原單交易 uuid */
  originLedgerUuid?: string;
  /** 該原單已開立的折讓單數量；大於 0 代表可展開查看折讓單清單 */
  allowanceCount?: number;
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

/** GET /ael/ledger/reconciliation/{payables,receivables} 共用 query 參數 */
export interface ReconciliationQuery {
  /** 日期起，YYYYMMDD */
  dateFrom?: string;
  /** 日期迄，YYYYMMDD */
  dateTo?: string;
  /** 'true'=已結清、'false'=未結清、省略=全部 */
  settled?: string;
}

/** 對帳中心進項應付單筆項目；與 PayableListItemDto 不同，無 invoice／memo／entryType／status／counterpartyType 欄位 */
export interface ReconPayableItemDto {
  ledgerUuid: string;
  orderCode: string;
  /** 交易付款日 YYYYMMDD；未入帳時為 null */
  entryDate: string | null;
  entryKind: number;
  direction: number;
  counterpartyName: string;
  counterpartyUuid: string | null;
  totalAmount: number;
  netAmount: number;
  taxAmount: number;
  taxFreeAmount: number;
  settledAmount: number;
  remainingAmount: number;
  settlementStatus: number;
  officialAccountingSubjectId: number;
  createdAt: string;
}

/** 對帳中心進項應付分組（依廠商） */
export interface ReconPayableGroupDto {
  groupKey: string;
  isVendor: boolean;
  counterpartyUuid: string | null;
  counterpartyName: string;
  totalSettledAmount: number;
  totalRemainingAmount: number;
  settlementStatus: number;
  items: ReconPayableItemDto[];
}

/** 對帳中心銷項應收單筆項目；與 ReceivableListItemDto 不同，無 invoice／memo／entryType／status／counterpartyType 欄位 */
export interface ReconReceivableItemDto {
  ledgerUuid: string;
  orderCode: string;
  /** 交易收款日 YYYYMMDD；未入帳時為 null */
  entryDate: string | null;
  entryKind: number;
  direction: number;
  counterpartyName: string;
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
  createdAt: string;
}

/** 對帳中心銷項應收分組（依銷售管道） */
export interface ReconReceivableGroupDto {
  groupKey: string;
  hasChannel: boolean;
  paymentChannelUuid: string | null;
  channelName: string;
  totalSettledAmount: number;
  totalRemainingAmount: number;
  settlementStatus: number;
  items: ReconReceivableItemDto[];
}

/**
 * 單筆手動入帳表單值：呼叫端（LedgerTable／LedgerCards）依 side 組成
 * SettleReceivableBody／SettlePayableBody 送出，兩者欄位命名不同（見下方）。
 */
export interface ManualSettleAllocation {
  /** 應收/應付帳款 uuid */
  ledgerUuid: string;
  /** 沖帳金額 */
  amount: number;
  /** 銀行帳戶 uuid */
  bankAccountUuid: string;
  /** 銷項為實際存入金額；進項為實際付款金額 */
  actualAmount: number;
  /** 手續費 */
  feeAmount: number;
  /** YYYYMMDD */
  paymentDate: string;
  /** 額外扣款項（可無限新增），使用者未新增任何額外金額時不傳此欄位 */
  otherDeductions?: SettleSummaryOtherDeduction[];
}

/**
 * 應收帳款手動入帳（POST /ael/ledger/receivables/settle）body。
 * ledgerUuid／allocations 實測與 api.md 文件不符：uuid 欄位實際固定叫 ledgerUuid
 * （非 receivableLedgerUuid／payableLedgerUuid），allocations 實際須為陣列（非單一物件）。
 */
export interface SettleReceivableBody {
  companyUuid: string;
  /** 應收帳款 uuid */
  ledgerUuid: string;
  /** 交易收款日，YYYYMMDD */
  paymentDate: string;
  /** 銀行帳戶 uuid */
  bankAccountUuid: string;
  /** 沖帳金額 */
  settleAmount: number;
  /** 實際存入 */
  depositAmount: number;
  /** 使用餘額 */
  balanceUsed: number;
  /** 備註 */
  memo: string;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee[];
  /** 沖帳其他減項物件 */
  otherDeductions?: SettleSummaryOtherDeduction[];
}

/** 應付帳款手動入帳（POST /ael/ledger/payables/settle）body。同上，ledgerUuid／allocations 見備註。 */
export interface SettlePayableBody {
  companyUuid: string;
  /** 應付帳款 uuid */
  ledgerUuid: string;
  /** 交易付款日，YYYYMMDD */
  paymentDate: string;
  /** 銀行帳戶 uuid */
  bankAccountUuid: string;
  /** 沖帳金額 */
  settleAmount: number;
  /** 實際付款 */
  paymentAmount: number;
  /** 使用餘額 */
  balanceUsed: number;
  /** 備註 */
  memo: string;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee[];
  /** 沖帳其他減項物件 */
  otherDeductions?: SettleSummaryOtherDeduction[];
}

/** 匯總沖帳手續費物件（單一物件，非陣列），銷項／進項共用同一結構 */
export interface SettleSummaryFee {
  /** 沖帳項目名稱，目前固定帶入「手續費」 */
  name: string;
  /** 手續費 */
  feeAmount: number;
}

/** 匯總沖帳的額外扣款項（可無限新增），銷項／進項共用同一結構 */
export interface SettleSummaryOtherDeduction {
  /** 沖帳項目名稱 */
  name: string;
  /** 沖帳金額 */
  amount: number;
  /** 科目 id */
  officialAccountingSubjectId: number;
}

/** 匯總沖帳預覽回應中，請求手續費物件的回填（後端附加欄位，實測皆為空字串，用途未知） */
export interface SettlePreviewFeeEcho {
  feeAmount: number;
  name: string;
  settlementLedgerUuid: string;
  orderCode: string;
  relationUuid: string;
}

/**
 * 匯總沖帳預覽／執行回應中，單張原單的拆帳結果，銷項／進項共用同一結構。
 * settlementLedgerUuid／settlementOrderCode／relationUuid 僅執行結果（summary，alloc>0 時）才有。
 */
export interface SettleLedgerAllocation {
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
  paymentAmount?: number;
  feeAmount?: number;
  deductionAmount?: number;
  /** 沖後剩餘（元，可負＝超沖） */
  afterRemaining: number;
  /** 沖後狀態：0平衡 1超沖 2少沖 */
  settlementStatus: number;
  /** 本次沖後是否結清（after<=0 且有沖）；isBalance=false 時超沖少沖差額會強制沖入最後一筆並標記結清 */
  closed: boolean;
  /** 結算傳票 uuid（alloc>0 才有） */
  settlementLedgerUuid?: string;
  /** 結算傳票編號 */
  settlementOrderCode?: string;
  /** 沖帳關聯 uuid */
  relationUuid?: string;
}

/** POST /ael/ledger/reconciliation/receivables/settle/preview body */
export interface SettleReceivablePreviewBody {
  companyUuid: string;
  /** 銷售管道 uuid */
  paymentChannelUuid: string;
  /** 使用預設預覽嗎：true 由後端依 transaction_date 由舊到新自動拆帳（匯總沖帳）；false 僅預覽 ledgerUuids 指定的原單（多筆沖帳） */
  isDefault: boolean;
  /** 要預覽匯總沖帳的自選 uuid 列表；isDefault=true 時傳空陣列 */
  ledgerUuids: string[];
  /** 本次匯總沖帳總額（元）；依 transaction_date／created_at 由舊到新拆帳，超沖加在最後一筆 */
  settleAmount: number;
  /** 銷項實際存入 */
  depositAmount: number;
  /** 使用餘額 */
  balanceUsed: number;
  /** 是否將超沖少沖的金額記進餘額 */
  isBalance: boolean;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee;
  /** 使用者未新增任何額外金額時不傳此參數 */
  otherDeductions?: SettleSummaryOtherDeduction[];
}

/** POST /ael/ledger/reconciliation/payables/settle/preview body */
export interface SettlePayablePreviewBody {
  companyUuid: string;
  /** 廠商 uuid */
  counterpartyUuid: string;
  /** 使用預設預覽嗎：true 由後端依 transaction_date 由舊到新自動拆帳（匯總沖帳）；false 僅預覽 ledgerUuids 指定的原單（多筆沖帳） */
  isDefault: boolean;
  /** 要預覽匯總沖帳的自選 uuid 列表；isDefault=true 時傳空陣列 */
  ledgerUuids: string[];
  /** 本次匯總沖帳總額（元）；依 transaction_date／created_at 由舊到新拆帳，超沖加在最後一筆 */
  settleAmount: number;
  /** 進項實際付出 */
  paymentAmount: number;
  /** 使用餘額 */
  balanceUsed: number;
  /** 是否將超沖少沖的金額記進餘額 */
  isBalance: boolean;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee;
  /** 使用者未新增任何額外金額時不傳此參數 */
  otherDeductions?: SettleSummaryOtherDeduction[];
}

/**
 * 匯總沖帳預覽回應共用欄位（銷項／進項共用）。
 * 實測回應中 allocations 並非陣列，而是請求手續費物件的回填；各原單拆帳結果在 ledgerAllocations。
 */
interface SettlePreviewResultBase {
  /** 實際有分配金額（alloc>0）的原單筆數 */
  affectedCount: number;
  allocations: SettlePreviewFeeEcho;
  /** 各原單拆帳結果 */
  ledgerAllocations: SettleLedgerAllocation[];
  /** 請求 otherDeductions 的回填；目前前端未消費此欄位，結構未知，故不進一步型別化 */
  otherDeductions: unknown[];
  /** 本次匯總沖帳總額（元） */
  settleAmount: number;
  /** 實際沖到原單合計金額 */
  appliedSettleAmount: number;
  /** 沖前餘額（廠商／銷售管道） */
  balanceBefore: number;
  /** 沖後餘額（廠商／銷售管道） */
  balanceAfter: number;
  /** 是否將超沖少沖的金額記進餘額 */
  isBalance: boolean;
  /** 拆帳前各原單 remaining 合計 */
  totalBeforeRemaining: number;
}

/** POST /ael/ledger/reconciliation/receivables/settle/preview 回應 */
export interface SettleReceivablePreviewResult extends SettlePreviewResultBase {
  paymentChannelUuid?: string;
  /** 銷項實際存入 */
  depositAmount: number;
  /** 實際異動銀行金額 */
  actualDepositAmount: number;
}

/** POST /ael/ledger/reconciliation/payables/settle/preview 回應 */
export interface SettlePayablePreviewResult extends SettlePreviewResultBase {
  counterpartyUuid?: string;
  /** 進項實際付出 */
  paymentAmount: number;
  /** 實際異動銀行金額 */
  actualPaymentAmount: number;
}

/**
 * POST /ael/ledger/reconciliation/receivables/settle/summary body：真正執行沖帳（非預覽）。
 * isBalance=true 時，depositAmount 須帶「實際沖完整的那幾筆金額總和」（即預覽回應 ledgerAllocations 中
 * closed=true 各筆 settleAmount 加總），而非使用者原始輸入的存入金額；isBalance=false 時沿用原始輸入值，
 * 差額直接沖入最後一筆交易。ledgerUuids 取自預覽回應的 ledgerAllocations（依所選 isBalance 重新預覽後的結果）。
 */
export interface SettleReceivableSummaryBody {
  companyUuid: string;
  /** 要匯總沖帳的原單 uuid 列表（不可重複；須同銷售管道） */
  ledgerUuids: string[];
  /** 本次匯總沖帳總額（元） */
  settleAmount: number;
  /** 銷項實際存入 */
  depositAmount: number;
  /** 收款日 YYYYMMDD */
  paymentDate: string;
  /** 存入銀行帳戶 uuid */
  bankAccountUuid: string;
  /** 備註（選填） */
  memo?: string;
  /** 使用餘額 */
  balanceUsed: number;
  /** 是否將超沖少沖的金額記進餘額 */
  isBalance: boolean;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee;
  otherDeductions?: SettleSummaryOtherDeduction[];
}

/** POST /ael/ledger/reconciliation/payables/settle/summary body，欄位語意同 SettleReceivableSummaryBody（進項版） */
export interface SettlePayableSummaryBody {
  companyUuid: string;
  ledgerUuids: string[];
  settleAmount: number;
  /** 進項實際付出 */
  paymentAmount: number;
  /** 付款日 YYYYMMDD */
  paymentDate: string;
  /** 付款銀行帳戶 uuid */
  bankAccountUuid: string;
  memo?: string;
  /** 使用餘額 */
  balanceUsed: number;
  isBalance: boolean;
  allocations: SettleSummaryFee;
  otherDeductions?: SettleSummaryOtherDeduction[];
}

/** 匯總沖帳執行結果共用欄位（銷項／進項共用） */
interface SettleSummaryResultBase {
  /** 有沖帳的原單筆數 */
  affectedCount: number;
  /** 各原單沖帳結果；實測欄位名稱與 preview 一致為 ledgerAllocations，非 api.md 範例所示的 allocations */
  ledgerAllocations: SettleLedgerAllocation[];
  /** 付款／收款戶頭 */
  bankAccountUuid: string;
  /** 付款／收款日 YYYYMMDD */
  paymentDate: string;
  /** 匯總沖帳總額 */
  settleAmount: number;
  /** 實際沖到原單的合計 */
  appliedSettleAmount: number;
  /** 沖前餘額（廠商／銷售管道） */
  balanceBefore: number;
  /** 沖後餘額（廠商／銷售管道） */
  balanceAfter: number;
  /** 是否將超沖少沖的金額記進餘額 */
  isBalance: boolean;
  /** 沖前剩餘合計 */
  totalBeforeRemaining: number;
  /** 唯一匯總結算帳 uuid */
  settlementLedgerUuid: string;
  /** 交易編號 */
  settlementOrderCode: string;
}

/** POST /ael/ledger/reconciliation/receivables/settle/summary 回應 */
export interface SettleReceivableSummaryResult extends SettleSummaryResultBase {
  counterpartyUuid?: string;
  paymentChannelUuid: string;
  /** 實際銀行存入 */
  depositAmount: number;
  actualDepositAmount: number;
}

/** POST /ael/ledger/reconciliation/payables/settle/summary 回應 */
export interface SettlePayableSummaryResult extends SettleSummaryResultBase {
  counterpartyUuid: string;
  paymentChannelUuid?: string;
  /** 實際銀行付出 */
  paymentAmount: number;
  actualPaymentAmount: number;
}

/** GET /ael/ledger/entries/detail 回應的 invoice 區塊；僅型別化本次會使用的欄位 */
export interface EntryInvoiceDetailDto {
  /** 1 銷項／2 進項 */
  buyOrSell: number;
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
  /** 是否折讓 */
  isAllowance: boolean;
  /** 申報狀態：1 已申報、2 未申報 */
  declared: number;
  /** 憑證種類代號，值域 1~7；僅此範圍內才顯示折讓紀錄區塊 */
  ourInvoiceType: number;
}

/** GET /ael/ledger/entries/detail 回應的 entry 區塊；僅型別化本次會使用的沖帳狀態與折讓原單摘要欄位 */
export interface EntryDetailEntryDto {
  /** 交易編號 */
  orderCode: string;
  /** 交易發生日（ISO 字串） */
  transactionDate: string | null;
  /** 交易對象名稱 */
  counterpartyName: string | null;
  /** 總金額 */
  totalAmount: number;
  /** 淨額 */
  netAmount: number;
  /** 稅額 */
  taxAmount: number;
  /** 科目名稱 */
  subjectName: string;
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

/** GET /ael/ledger/entries/detail 回應的單筆沖帳事件；供「沖帳紀錄」卡片的恢復／編輯操作使用 */
export interface EntryDetailSettleEventDto {
  /** settle_events.uuid，恢復沖帳時需傳入 */
  settleEventUuid: string;
  /** 0 手動沖帳／2 匯總沖帳 */
  reconMethod: number;
  /** 0 銷項／1 進項 */
  side: number;
  /** 付款／收款日，YYYYMMDD */
  paymentDate: string;
  /** 帳面沖帳金額 */
  settleAmount: number;
  /** 實際收付（銷項為存入、進項為付款） */
  cashAmount: number;
  /** 沖前廠商／銷售管道餘額 */
  balanceBefore: number;
  /** 沖後廠商／銷售管道餘額 */
  balanceAfter: number;
  /** 是否已撤銷 */
  isReverse: boolean;
  /** 目前是否可撤銷（未撤銷且無更新的未撤銷事件） */
  canReverse: boolean;
  createdAt: string;
}

/** GET /ael/ledger/entries/detail 回應；僅型別化 invoice 區塊與沖帳相關子集
 *  （entry／settlements 其餘欄位如 direction／entryType／status 等本次不使用）。
 *  invoice 沒有關聯發票的交易（如未開立發票的應收帳款）會是 null */
export interface EntryDetailResult {
  entry: EntryDetailEntryDto;
  invoice: EntryInvoiceDetailDto | null;
  settlements: EntryDetailSettlementDto[];
  /** 此原單相關沖帳事件（供撤銷）；無則空陣列 */
  settleEvents: EntryDetailSettleEventDto[];
  /** 是否為折讓；api.md 200 範例 JSON 未含此欄位（只有 schema 表格記載），故為選填 */
  isAllowance?: boolean;
  /** 如果是查折讓單，這邊顯示原單交易 uuid；同上為選填 */
  originLedgerUuid?: string;
  /** 關聯折讓單；同上為選填，讀取時應搭配 ?? [] */
  allowances?: EntryDetailAllowanceDto[];
}

/** POST /ael/ledger/settle/reverse 與 /ael/ledger/reconciliation/settle/reverse 共用 body */
export interface ReverseSettleBody {
  companyUuid: string;
  /** settle_events.uuid */
  settleEventUuid: string;
}

/** GET /ael/ledger/entries/dailyDetail 單筆分錄 */
export interface DailyDetailLineDto {
  rocYear: string;
  /** 傳票號 */
  voucherNo: string;
  seq: string;
  /** 傳票類型：1=現金收入、2=現金支出、3=轉帳 */
  voucherType: string;
  /** 民國日期 YYYMMDD，例 '1150807' */
  rocDate: string;
  /** 會計科目名稱 */
  subjectName: string;
  /** 對方科目/對象代碼（目前多為空） */
  counterpartyCode: string;
  summary: string;
  /** 借貸別：'1'=借、'2'=貸 */
  debitCredit: '1' | '2';
  amount: number;
  voucherCategory: string;
  printFlag: string;
  taxAmount: string;
  ledgerUuid: string;
  lineUuid: string;
  settleEventUuid?: string;
  isReverse: boolean;
  /** 分錄建立日 YYYYMMDD */
  createdDate: string;
  /** 同傳票內列排序 */
  sortOrder: number;
}

/** GET /ael/ledger/entries/dailyDetail 回應 data */
export interface DailyDetailResult {
  ledgerUuid: string;
  settleEventUuids: string[];
  lines: DailyDetailLineDto[];
}
