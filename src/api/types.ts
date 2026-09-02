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
 * 發票本 DTO，對應 api.md「發票本」章節（GET /ael/invoiceBook 回應內的 invoiceBook 陣列項目）。
 * 注意欄位名 aphabeticLetter 為後端既有拼字（少一個 l），與 ledger 交易 API 的 alphabeticLetter 不同，照抄勿改。
 */
export interface InvoiceBookDto {
  /** 發票簿 uuid；save 端點稱 invoiceId，receivables 端點稱 invoiceBookUuid，list 端點稱 invoiceBookId，三者同義 */
  invoiceBookId: string;
  /** invoice_type，發票種類：1、2 為三聯式（買家統編／名稱必填），其餘為二聯式 */
  part: number;
  name: string;
  aphabeticLetter: string;
  startNum: string;
  /** 當前發票號，選發票簿時據此帶入交易頁的流水號 */
  currentNum: string;
}

export interface InvoiceBookListResult {
  /** 該年期全部發票本數（含 ezreceipt）；無紙本時為 0 */
  count: number;
  invoiceBook: InvoiceBookDto[];
}

/**
 * 新增發票本（POST /ael/invoiceBook）。
 * 注意：實測 dev 環境此發票本相關 API 皆用 companyUuid（非 api.md 舊版文件標示的 uuid）。
 * 回應 data 固定為 null，uuid 由後端產生但不於 response 回傳；
 * 實測確認多次帶相同 name/year/phase/aphabeticLetter/startNum 呼叫會建立多筆，並非依欄位比對更新既有紀錄。
 */
export interface SaveInvoiceBookBody {
  companyUuid: string;
  name: string;
  /** 民國年 */
  year: number;
  /** 期別（1/3/5/7/9/11） */
  phase: number;
  aphabeticLetter: string;
  startNum: string;
}

/** 更新發票本（PATCH /ael/invoiceBook）body；需帶目標發票本 uuid，回應 data 同樣固定為 null */
export interface UpdateInvoiceBookBody extends SaveInvoiceBookBody {
  invoiceBookId: string;
}

/** GET /ael/invoiceBook/getDate/forSetting 回應項目：設定頁「發票期間」下拉可選期別 */
export interface InvoiceBookPeriodDto {
  /** 民國年 */
  year: number;
  /** 期別（1/3/5/7/9/11） */
  phase: number;
  /** 該期別下已建立的發票本數 */
  count: number;
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
 * buyReconciliationMethod／sellReconciliationMethod：0 為手動對帳，1 為自動對帳（發票開立/上傳即收付款）。
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
  /** 0：手動對帳，1：發票開立即收款 */
  sellReconciliationMethod?: number;
  /** 0：手動對帳，1：發票上傳即付款 */
  buyReconciliationMethod?: number;
}

/**
 * 官方費用科目 DTO（/ael/subject/official/list/latest、/ael/subject/official/list/filter）。
 * debitCreditType／remark 目前皆為 null，本次介面不使用。
 * type／calculationType／industryBitmask／isBank／buyOrSell 標 optional：/latest 端點的回應
 * 目前不含這些欄位，只有 /filter 確定會回。
 */
export interface OfficialSubjectDto {
  id: number;
  year: number;
  subjectCode: string;
  name: string;
  debitCreditType: string | null;
  remark: string | null;
  /** 0:收入,1:成本,2:損益表,3:營業成本,4:製造費用,5:研究發展費,6:其他費用,7:費用,8:非營業收入,9:營業外損失及費用,10:流動資產,11:非流動資產,12:流動負債,13:非流動負債,14:權益,15:資產負債表 */
  type?: number;
  /** 0:一般科目型欄位，1:合計型科目欄位，2:棄置科目，3:期初開帳設定科目，4:期末結帳設定科目 */
  calculationType?: number;
  /** 買賣業:1,勞務業:2,製造業:4 */
  industryBitmask?: number;
  /** 銀行項目專用科目嗎 */
  isBank?: boolean;
  /** 是固定資產折舊與減損科目嗎 */
  isFixedAssetDepreciationImpairment?: boolean;
  /** 沖帳區用途：1 沖帳 Others 科目，2 沖應收帳款，4 沖應付帳款；僅 /filter 帶 settle 篩選時確定會回 */
  settleBitmask?: number;
  /** 進項:2，銷項:3 */
  buyOrSell?: number;
  createdAt: string;
  updatedAt: string;
  /** 該官方科目下的公司自訂子科目；僅 /ael/subject/official/list/filter 會回傳，/list/latest 不含此欄位 */
  children?: SubjectChildDto[];
}

/**
 * 官方科目下的公司自訂子科目（隨 OfficialSubjectDto.children 一併回傳，非獨立端點）。
 * 選用子科目時，送出交易 API 需同時帶父科目 officialAccountingSubjectId 與此處 uuid
 * （對應 companyAccountingSubjectUuid），見各 Create/Settle body 的欄位註解。
 */
export interface SubjectChildDto {
  uuid: string;
  /** 子科目會計項目代號 */
  subjectCode: string;
  name: string;
  /** 銀行帳戶uuid；子科目非銀行帳戶時為空字串 */
  bankAccountUuid: string;
  debitCreditType: string | null;
  type?: number;
  calculationType?: number;
  buyOrSell?: number;
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
 * 公司科目餘額（GET /ael/ledger/subjectBalances），沖帳中心「沖帳對象分配」科目選項用。
 * 端點為單科目查詢、回傳單一物件，查無資料時後端會先初始化，見 subjects.ts 的 getSubjectBalance()。
 */
export interface SubjectBalanceDto {
  companyUuid: string;
  officialAccountingSubjectId: number;
  name: string | null;
  currentBalance: number;
  /** YYYYMMDD；尚未異動餘額時為 null */
  lastBalanceUpdateDate: string | null;
}

/** AI 依交易描述建議的會計科目（/ael/subject/identify），最多 3 筆，依信心排序 */
export interface SubjectIdentifyCandidateDto {
  subjectCode: string;
  name: string;
  reason: string;
  /** 科目分類純文字，如「製造費用」「研究發展費」「費用」，用於前端標籤顯示 */
  type: string;
}

/**
 * 單張發票 Gemini 結構化辨識候選科目（POST /ael/invoice/identification/one 回應內的
 * gui_subject_candidates），欄位命名與 SubjectIdentifyCandidateDto 不同，不共用型別。
 */
export interface InvoiceIdentificationSubjectCandidateDto {
  gui_subject_code: string;
  gui_subject_name: string;
  reason: string;
}

/**
 * 單張發票 Gemini 結構化辨識結果（POST /ael/invoice/identification/one）。
 * api.md 的 schema 標示多數欄位 required，但同頁回應範例本身就缺漏數個欄位（如
 * gui_subject_candidates／seller_name／seller_tax_id／others），故全數宣告為 optional/nullable，
 * 呼叫端一律需自行判斷欄位是否存在。
 */
export interface InvoiceIdentificationDto {
  /** 1~7:一般憑證 8:交通憑證 9:水電瓦斯 10:其他 11:進口 */
  gui_type?: number | null;
  gui_alphabetic_letter?: string | null;
  gui_number?: string | null;
  /** 民國年 */
  gui_date_year?: number | null;
  gui_date_month?: number | null;
  gui_date_day?: number | null;
  seller_name?: string | null;
  seller_tax_id?: string | null;
  buyer_name?: string | null;
  buyer_tax_id?: string | null;
  subtotal?: number | null;
  tax?: number | null;
  tax_free_amount?: number | null;
  others?: number | null;
  total_amount?: number | null;
  summary?: string | null;
  angle?: number | null;
  document_template?: number | null;
  gui_subject_candidates?: InvoiceIdentificationSubjectCandidateDto[] | null;
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
  /** 官方科目 id（進貨／費用科目）；選到子科目時仍傳父科目 id，子科目另見 companyAccountingSubjectUuid */
  officialAccountingSubjectId: number;
  /** 公司自訂子科目 uuid；選填，僅選到子科目時傳（見 OfficialSubjectDto.children） */
  companyAccountingSubjectUuid?: string;
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
  /** 官方科目 id（收入科目）；選到子科目時仍傳父科目 id，子科目另見 companyAccountingSubjectUuid */
  officialAccountingSubjectId: number;
  /** 公司自訂子科目 uuid；選填，僅選到子科目時傳（見 OfficialSubjectDto.children） */
  companyAccountingSubjectUuid?: string;
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
  /** 發票簿 uuid（對應 GET /ael/invoiceBook 回應的 invoiceBookId），銷項建立交易必填 */
  invoiceBookUuid: string;
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
  /** 科目 id；選到子科目時仍傳父科目 id，子科目另見 companyAccountingSubjectUuid */
  officialAccountingSubjectId: number;
  /** 公司自訂子科目 uuid；選填，僅選到子科目時傳（見 OfficialSubjectDto.children） */
  companyAccountingSubjectUuid?: string;
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
  /** 廠商 uuid；帶入時僅回傳該廠商的交易與彙總數字（帳簿總覽「廠商佔比」卡片下鑽用） */
  counterpartyUuid?: string;
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
  /** 費用科目官方科目 id；恆為父科目 id */
  officialAccountingSubjectId: number;
  /** 科目名稱；若該筆交易選了子科目，此欄位優先回傳子科目名稱 */
  subjectName: string;
  /** 公司自訂子科目 uuid；該筆交易未選子科目時為 undefined */
  companyAccountingSubjectUuid?: string;
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
  /** 銷售管道 uuid；帶入時僅回傳該管道的交易與彙總數字（帳簿總覽「銷售管道佔比」卡片下鑽用） */
  paymentChannelUuid?: string;
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
  /** 收入科目官方科目 id；恆為父科目 id */
  officialAccountingSubjectId: number;
  /** 科目名稱；若該筆交易選了子科目，此欄位優先回傳子科目名稱 */
  subjectName: string;
  /** 公司自訂子科目 uuid；該筆交易未選子科目時為 undefined */
  companyAccountingSubjectUuid?: string;
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

/**
 * 帳簿總覽彙總 body，供 POST /ael/ledger/receivables/summary（應收）與
 * /ael/ledger/receivables/collected/summary（已收）共用，兩者 body/response 形狀相同，
 * 差異僅在 dateFrom/dateTo 口徑（應收＝transaction_date、已收＝entry_date，由後端依端點決定）。
 * 與 ReceivablesFilterBody 條件一致（僅少 limit/page），確保圖表與下方列表口徑相同。
 */
export type ReceivablesSummaryBody = Omit<ReceivablesFilterBody, 'limit' | 'page'>;

/** 帳簿總覽「已開立發票金額」趨勢圖單日資料點 */
export interface LedgerDailyAmount {
  /** 西元 YYYYMMDD；口徑為憑證開立日（invoice.date），非收款日 */
  date: string;
  issuedAmount: number;
}

/** 帳簿總覽「銷售管道佔比」單一管道資料 */
export interface LedgerChannelShare {
  /** 未指定銷售管道時為 null */
  paymentChannelUuid: string | null;
  channelName: string;
  amount: number;
}

/** POST /ael/ledger/receivables/summary、/ael/ledger/receivables/collected/summary 共用回應形狀 */
export interface ReceivablesSummaryResult {
  /** 與 ReceivablesFilterResult 同名欄位同口徑，供帳簿總覽「入帳狀況」卡片使用 */
  issuedVoucherAmount: number;
  collectedAmount: number;
  receivableAmount: number;
  /** 區間內逐日金額；缺漏的日期代表當日無交易，前端補 0 */
  dailyAmounts: LedgerDailyAmount[];
  /** 依銷售管道分組金額；未排序、未取 Top N，由前端處理 */
  channelShares: LedgerChannelShare[];
}

/**
 * 帳簿總覽彙總 body，供 POST /ael/ledger/payables/summary（應付）與
 * /ael/ledger/payables/paid/summary（已付）共用，兩者 body/response 形狀相同，
 * 差異僅在 dateFrom/dateTo 口徑（應付＝transaction_date、已付＝entry_date，由後端依端點決定）。
 * 與 PayablesFilterBody 條件一致（僅少 limit/page）。
 */
export type PayablesSummaryBody = Omit<PayablesFilterBody, 'limit' | 'page'>;

/** 帳簿總覽「廠商佔比」單一廠商資料 */
export interface LedgerVendorShare {
  /** 未指定廠商時為 null */
  counterpartyUuid: string | null;
  counterpartyName: string;
  amount: number;
}

/** POST /ael/ledger/payables/summary、/ael/ledger/payables/paid/summary 共用回應形狀 */
export interface PayablesSummaryResult {
  /** 與 PayablesFilterResult 同名欄位同口徑，供帳簿總覽「入帳狀況」卡片使用 */
  receivedVoucherAmount: number;
  paidAmount: number;
  payableAmount: number;
  /** 區間內逐日金額；缺漏的日期代表當日無交易，前端補 0 */
  dailyAmounts: LedgerDailyAmount[];
  /** 依廠商分組金額；未排序、未取 Top N，由前端處理 */
  vendorShares: LedgerVendorShare[];
}

/** GET /ael/ledger/reconciliation/{payables,receivables} 共用 query 參數 */
export interface ReconciliationQuery {
  /** 日期起，YYYYMMDD */
  dateFrom?: string;
  /** 日期迄，YYYYMMDD */
  dateTo?: string;
  /** 'true'=已結清、'false'=未結清、省略=全部 */
  settled?: string;
  /** 金額下限 */
  amountFrom?: string;
  /** 金額上限 */
  amountTo?: string;
}

/** 對帳中心項目關聯發票資訊；GET /ael/ledger/reconciliation/{payables,receivables} 各筆項目皆附帶此欄位 */
export interface ReconInvoiceDto {
  uuid: string;
  invoiceTrack: string;
  invoiceNumber: string;
  /** 發票字軌＋發票號碼 */
  voucherNumber: string;
  /** 憑證開立日，YYYMMDD（民國年，無分隔符） */
  date: string;
  buyerName: string;
  sellerName: string;
  buyerTaxIdNumber: string;
  sellerTaxIdNumber: string;
  counterpartyTaxId: string;
  /** 未稅額 */
  amount: number;
  /** 稅額 */
  businessTax: number;
  /** 2 進項／3 銷項 */
  buyOrSell: number;
  ourInvoiceType: number;
}

/** 對帳中心進項應付單筆項目；與 PayableListItemDto 不同，無 memo／entryType／status／counterpartyType 欄位 */
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
  /** 費用科目官方科目 id；恆為父科目 id */
  officialAccountingSubjectId: number;
  /** 科目名稱；若該筆交易選了子科目，此欄位優先回傳子科目名稱 */
  subjectName: string;
  /** 公司自訂子科目 uuid；該筆交易未選子科目時為 undefined */
  companyAccountingSubjectUuid?: string;
  createdAt: string;
  invoice: ReconInvoiceDto;
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

/** 對帳中心銷項應收單筆項目；與 ReceivableListItemDto 不同，無 memo／entryType／status／counterpartyType 欄位 */
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
  /** 收入科目官方科目 id；恆為父科目 id */
  officialAccountingSubjectId: number;
  /** 科目名稱；若該筆交易選了子科目，此欄位優先回傳子科目名稱 */
  subjectName: string;
  /** 公司自訂子科目 uuid；該筆交易未選子科目時為 undefined */
  companyAccountingSubjectUuid?: string;
  createdAt: string;
  invoice: ReconInvoiceDto;
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
  /** 收款管道 */
  depositChannels: SettleChannel[];
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
  /** 電商平台扣款物件；非應收沖帳中心情境（如手動沖帳編輯）可不傳 */
  ecommercePlatformFee?: SettleEcommercePlatformFee;
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
  /** 付款管道 */
  paymentChannels: SettleChannel[];
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

/**
 * 收付款管道：isBankAccount=true 時 bankAccountUuid 必填，false 時 officialAccountingSubjectId 必填。
 * 各管道 amount 加總＝實際存入／付出金額，四支沖帳 API（手動／匯總 × 銷項／進項）共用同一結構。
 */
export interface SettleChannel {
  isBankAccount: boolean;
  bankAccountUuid?: string;
  officialAccountingSubjectId?: number;
  /** 公司自訂子科目 uuid；選填，僅 !isBankAccount 且選到子科目時傳，officialAccountingSubjectId 仍為父科目 id */
  companyAccountingSubjectUuid?: string;
  /** 該管道沖帳金額 */
  amount: number;
}

/** 匯總沖帳手續費物件（單一物件，非陣列），銷項／進項共用同一結構；API 僅需 feeAmount */
export interface SettleSummaryFee {
  /** 手續費 */
  feeAmount: number;
}

/** 電商平台扣款物件（僅應收沖帳 API 支援）：feeAmount 為正的扣款金額；API 僅需 feeAmount */
export interface SettleEcommercePlatformFee {
  feeAmount: number;
}

/** 匯總沖帳的額外扣款項（可無限新增），銷項／進項共用同一結構 */
export interface SettleSummaryOtherDeduction {
  /** 沖帳項目名稱 */
  name: string;
  /** 沖帳金額 */
  amount: number;
  /** 科目 id；選到子科目時仍傳父科目 id，子科目另見 companyAccountingSubjectUuid */
  officialAccountingSubjectId: number;
  /** 公司自訂子科目 uuid；選填，僅選到子科目時傳（見 OfficialSubjectDto.children） */
  companyAccountingSubjectUuid?: string;
}

/**
 * 手動沖帳（POST /ael/ledger/receivables/settle、/ael/ledger/payables/settle）回應 data 區塊，
 * 銷項／進項共用同一形狀（見 api.md「手動沖帳銷項應收帳款／進項應付帳款」）。
 * 沒有 balanceBefore／balanceAfter（手動沖帳不影響管道／廠商餘額），也沒有 isBalance（不支援自動記入餘額）。
 */
export interface ManualSettleResult {
  orderCode: string;
  settledAmount: number;
  beforeRemaining: number;
  afterRemaining: number;
  /** 0平衡 1超沖 2少沖 */
  settlementStatus: number;
  closed: boolean;
  settlementLedgerUuid: string;
  paymentDate: string;
  relationUuid: string;
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
  /** 本次沖後是否結清（after<=0 且有沖）；超沖少沖差額一律強制沖入最後一筆並標記結清 */
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
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee;
  /** 電商平台扣款物件；非應收沖帳中心情境（如手動沖帳編輯）可不傳 */
  ecommercePlatformFee?: SettleEcommercePlatformFee;
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
 * ledgerUuids 取自預覽回應的 ledgerAllocations；差額（超沖／少沖）一律直接沖入最後一筆交易。
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
  /** 收款管道 */
  depositChannels: SettleChannel[];
  /** 備註（選填） */
  memo?: string;
  /** 使用餘額 */
  balanceUsed: number;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee;
  /** 電商平台扣款物件；非應收沖帳中心情境（如手動沖帳編輯）可不傳 */
  ecommercePlatformFee?: SettleEcommercePlatformFee;
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
  /** 付款管道 */
  paymentChannels: SettleChannel[];
  memo?: string;
  /** 使用餘額 */
  balanceUsed: number;
  allocations: SettleSummaryFee;
  otherDeductions?: SettleSummaryOtherDeduction[];
}

/** 匯總沖帳執行結果共用欄位（銷項／進項共用） */
interface SettleSummaryResultBase {
  /** 有沖帳的原單筆數 */
  affectedCount: number;
  /** 各原單沖帳結果；實測欄位名稱與 preview 一致為 ledgerAllocations，非 api.md 範例所示的 allocations */
  ledgerAllocations: SettleLedgerAllocation[];
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
  /** 收款管道 */
  depositChannels: SettleChannel[];
  /** 實際銀行存入 */
  depositAmount: number;
  actualDepositAmount: number;
}

/** POST /ael/ledger/reconciliation/payables/settle/summary 回應 */
export interface SettlePayableSummaryResult extends SettleSummaryResultBase {
  counterpartyUuid: string;
  paymentChannelUuid?: string;
  /** 付款管道 */
  paymentChannels: SettleChannel[];
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
  /** 摘要，對應建立交易 body 的 summary */
  summary: string;
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
  /** 可否扣抵：1 可扣抵、2 不可扣抵（進項適用） */
  deductible: number;
  /** 不可扣抵原因；deductible=2 時才有意義 */
  unreportedReason: string;
  /** 憑證種類代號，值域 1~7；僅此範圍內才顯示折讓紀錄區塊 */
  ourInvoiceType: number;
}

/** GET /ael/ledger/entries/detail 回應的 entry 區塊；僅型別化本次會使用的沖帳狀態與折讓原單摘要欄位 */
export interface EntryDetailEntryDto {
  /** 交易編號 */
  orderCode: string;
  /** 0進項／1進折／2銷項／3銷折 */
  entryType: number;
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
  /** 科目名稱；若該筆交易選了子科目，此欄位優先回傳子科目名稱 */
  subjectName: string;
  /** 已沖金額（元） */
  settledAmount: number;
  /** 未沖金額（元） */
  remainingAmount: number;
  /** 0平衡 1超沖 2少沖 */
  settlementStatus: number;
  /** 費用類別／收入科目官方科目 id，對應 /ael/subject/official/list/latest 的 id；恆為父科目 id */
  officialAccountingSubjectId: number;
  /** 公司自訂子科目 uuid；該筆交易未選子科目時為 undefined */
  companyAccountingSubjectUuid?: string;
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

/** GET /ael/ledger/settle/event/list 回應中，展開明細單筆原單的欄位 */
export interface SettleEventListDetailDto {
  /** 原單交易 uuid */
  ledgerUuid: string;
  /** 憑證開立日，YYYYMMDD */
  voucherDate: string;
  /** 發票字軌＋號碼；無票為空字串 */
  voucherNumber: string;
  /** 「買受人」或「賣方」（依 side 決定文字） */
  counterpartyLabel: string;
  /** 買受人／賣方名稱 */
  counterpartyName: string;
  /** 該原單本次分配到的沖帳金額 */
  amount: number;
}

/** GET /ael/ledger/settle/event/list 回應單筆沖帳事件；供「沖帳紀錄」清單顯示與就地復原使用 */
export interface SettleEventListItemDto {
  /** settle_events.uuid，復原時要傳入 */
  settleEventUuid: string;
  /** 0 手動沖帳／2 匯總沖帳；決定復原時要打哪支 API */
  reconMethod: number;
  /** 0 銷項／1 進項 */
  side: number;
  /** 收／付款日，YYYYMMDD */
  paymentDate: string;
  /** 沖帳建立時間，ISO 格式（含時區位移） */
  createdAt: string;
  /** 帳面沖帳金額 */
  settleAmount: number;
  /** 實際收付金額（銷項為存入、進項為付款） */
  cashAmount: number;
  /** 目前是否可撤銷（未撤銷且無更新的未撤銷事件） */
  canReverse: boolean;
  /** 進項＝廠商名；銷項＝銷售管道名 */
  counterpartyName: string;
  /** 收／付款管道顯示名，一次沖帳可能拆多個管道 */
  targetNames: string[];
  /** 本批原單筆數 */
  itemCount: number;
  /** 展開明細，一次帶回不分頁 */
  details: SettleEventListDetailDto[];
}

/** GET /ael/ledger/settle/event/list 回應 data 區塊 */
export interface SettleEventListResult {
  /** 符合條件總筆數（不含已復原） */
  total: number;
  page: number;
  pageSize: number;
  items: SettleEventListItemDto[];
}

/** GET /ael/ledger/settle/event 回應；依沖帳事件反查關聯交易 uuid，只回 uuid 陣列，
 *  不含憑證欄位——顯示憑證明細需再逐筆打 fetchEntryDetail（見 settleEventOrigins.ts） */
export interface SettleEventRelationsResult {
  settleEventUuid: string;
  /** 0 手動／1 即沖／2 匯總／4 銀行提匯等 */
  reconMethod: number;
  /** 0 銷項／1 進項 */
  side: number;
  /** 付款／收款日，YYYYMMDD */
  paymentDate: string;
  settleAmount: number;
  cashAmount: number;
  isReverse: boolean;
  bankAccountUuid: string | null;
  /** 主結算交易 uuid */
  mainSettlementLedgerUuid: string;
  /** 業務原單交易 uuid */
  originLedgerUuids: string[];
  /** 手續費交易 uuid */
  feeLedgerUuids: string[];
  /** 其他減項交易 uuid */
  deductionLedgerUuids: string[];
}

/** GET /ael/ledger/entries/detail 回應；僅型別化 invoice 區塊與沖帳相關子集
 *  （entry／settlements 其餘欄位如 direction／status 等本次不使用）。
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
  /** 會計科目名稱；若該筆分錄選了子科目，此欄位優先回傳子科目名稱 */
  subjectName: string;
  /** 公司自訂子科目 uuid；該筆分錄未選子科目時為 undefined */
  companyAccountingSubjectUuid?: string;
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

/** POST /ael/bankAccounts/transactions body */
export interface BankTransactionsBody {
  companyUuid: string;
  bankAccountUuid: string;
  /** 起時間 YYYYMMDD */
  dateFrom: string;
  /** 迄時間 YYYYMMDD */
  dateTo: string;
  /** 一頁資料筆數 */
  limit: number;
  page: number;
}

/** 銀行帳戶相關的單筆沖帳事件 */
export interface BankSettleEventDto {
  /** 沖帳事件uuid */
  settleEventUuid: string;
  /** 0手動／1即沖／2匯總／4銀行提匯等 */
  reconMethod: number;
  /** 0銷項／1進項 */
  side: number;
  /** YYYYMMDD */
  paymentDate: string;
  /** 實際沖帳金額 */
  settleAmount: number;
  cashAmount: number;
  /** 0存入／1付出 */
  cashDirection: number;
  /** 是交易恢復嗎 */
  isReverse: boolean;
  /** 交易原單uuid */
  mainSettlementLedgerUuid: string;
  /** 交易關聯單uuid */
  originLedgerUuids: string[];
  /** 所有交易關聯單科目id */
  originOfficialAccountingSubjectIds: number[];
  primaryOriginLedgerUuid: string;
  /** 最早的那筆交易關聯單科目id */
  primaryOfficialAccountingSubjectId: number;
  /** 有發票嗎 */
  hasInvoice: boolean;
  /** 廠商名稱 */
  counterpartyName: string;
  /** 銷售管道名稱 */
  paymentChannelName: string;
  /** 備註；counterpartyName 為空字串時的顯示備援 */
  memo: string | null;
  createdAt: string;
}

/** POST /ael/bankAccounts/transactions 回應 data */
export interface BankTransactionsResult {
  bankAccountUuid: string;
  items: BankSettleEventDto[];
  /** 全部資料筆數 */
  total: number;
  limit: number;
  page: number;
}

/** POST /ael/bankAccounts/cashMovements body：建立一筆銀行直接提／匯款 */
export interface CashMovementBody {
  companyUuid: string;
  bankAccountUuid: string;
  /** 0 匯入／1 提出 */
  cashDirection: number;
  amount: number;
  /** YYYYMMDD */
  paymentDate: string;
  /** 科目id；選到子科目時仍傳父科目 id，子科目另見 companyAccountingSubjectUuid */
  officialAccountingSubjectId: number;
  /** 公司自訂子科目 uuid；選填，僅選到子科目時傳（見 OfficialSubjectDto.children） */
  companyAccountingSubjectUuid?: string;
  memo: string;
}

/** POST /ael/bankAccounts/cashMovements 回應 data */
export interface CashMovementResult {
  /** 交易uuid */
  ledgerEntryUuid: string;
  /** 交易編號 */
  orderCode: string;
  /** 沖帳事件uuid */
  settleEventUuid: string;
  bankAccountUuid: string;
  /** 0匯入／1提出 */
  cashDirection: number;
  amount: number;
  /** YYYYMMDD */
  paymentDate: string;
}

/**
 * 營業稅中心：指定期別進／銷項發票列表（POST /ael/vat/input/filter、/ael/vat/output/filter）body。
 * 兩支端點 body 結構完全相同，共用同一型別。
 */
export interface VatInvoiceFilterBody {
  companyUuid: string;
  /** 民國年 */
  cmsYear: number;
  /** 期別 1/3/5/7/9/11 */
  cmsPhase: number;
  /** 選填；字軌+號碼模糊比對 */
  invoiceNumber?: string;
  /** 選填；金額下限，比對 invoice amount */
  amountFrom?: number;
  /** 選填；金額上限，比對 invoice amount */
  amountTo?: number;
  /** 選填；起日，西元 YYYYMMDD */
  dateFrom?: string;
  /** 選填；迄日，西元 YYYYMMDD */
  dateTo?: string;
  /** 選填；統一編號，進項比對賣方、銷項比對買方 */
  taxIdNumber?: string;
  /** 選填；公司名稱模糊比對，進項比對賣方、銷項比對買方 */
  companyName?: string;
  /** 選填；true＝作廢、false＝非作廢，省略＝不篩 */
  isVoid?: boolean;
  /** 選填；預設 10 */
  limit?: number;
  /** 選填；預設 1 */
  page?: number;
}

/** 營業稅中心進／銷項發票列表單筆項目；兩支端點回應結構相同，共用同一型別 */
export interface VatInvoiceItemDto {
  invoiceUuid: string;
  /** 發票字軌 */
  invoiceTrack: string;
  /** 發票號碼 */
  invoiceNumber: string;
  /** 發票字軌+發票號碼 */
  voucherNumber: string;
  /** 民國年 YYYMMDD */
  invoiceDate: string;
  /** 未稅銷售額 */
  sales: number;
  /** 稅額 */
  businessTax: number;
  /** 總額 */
  amount: number;
  /** 免稅銷售額 */
  taxFreeAmount: number;
  /** 0一般／1折讓 */
  isDebit: number;
  /** 2進項／3銷項 */
  buyOrSell: number;
  ourInvoiceType: number;
  /** 公司名稱 */
  companyName: string;
  /** 買方統編 */
  buyerTaxIdNumber: string;
  /** 賣方統編 */
  sellerTaxIdNumber: string;
  /** 交易uuid */
  ledgerUuid: string;
  /** 交易編號 */
  orderCode: string;
  /** 0:進項交易，1:進折交易，2:銷項交易，3:銷折交易 */
  entryType: number;
  /** 0:業務原單 1:沖帳結算付款帳 */
  entryKind: number;
  /** 0:收入(銷項)，1:支出(進項)，2:應收(銷項)，3:應付(進項)，4:其他 */
  direction: number | null;
  /** 廠商名稱 */
  counterpartyName: string | null;
  /** 科目id；恆為父科目 id */
  officialAccountingSubjectId: number;
  /** 科目名稱；若該筆交易選了子科目，此欄位優先回傳子科目名稱 */
  subjectName: string;
  /** 公司自訂子科目 uuid；該筆交易未選子科目時為 undefined */
  companyAccountingSubjectUuid?: string;
  /** 作廢狀態 */
  isVoid: boolean;
  /** 申報狀態，1=已申報、2=未申報 */
  declared: number;
  /** 可扣抵狀態，1=可扣抵、2=不可扣抵 */
  deductible: number;
}

/**
 * 營業稅中心進／銷項發票列表回應（data 內容）。totalSales／totalBusinessTax／totalAmount
 * 為篩選後不分頁的合計，pageSales／pageBusinessTax／pageAmount 為本頁 items 合計
 * （皆折讓以負值計入），前端不得自行加總，一律直接顯示這六個欄位。
 */
export interface VatInvoiceFilterResult {
  items: VatInvoiceItemDto[];
  /** 總筆數 */
  total: number;
  /** 一頁資料筆數 */
  limit: number;
  page: number;
  /** 篩選後不分頁；折讓以負值計入 */
  totalSales: number;
  /** 篩選後不分頁；折讓以負值計入 */
  totalBusinessTax: number;
  /** 篩選後不分頁；折讓以負值計入 */
  totalAmount: number;
  /** 本頁 items 的 sales 合計 */
  pageSales: number;
  /** 本頁 items 的 businessTax 合計 */
  pageBusinessTax: number;
  /** 本頁 items 的 amount 合計 */
  pageAmount: number;
}

/** 營業稅中心：計算本期銷／進發票金額與應納營業稅（GET /ael/vat/periodSummary）回應 data */
export interface VatPeriodSummaryDto {
  /** 民國年 */
  cmsYear: number;
  /** 期別 */
  cmsPhase: number;
  /** 銷項非作廢 amount 合計；折讓以負值計入 */
  outputInvoiceAmountTotal: number;
  /** 進項非作廢 amount 合計；折讓以負值計入 */
  inputInvoiceAmountTotal: number;
  /** 銷項稅合計 − 進項稅合計；可為負 */
  businessTaxTotal: number;
}
