/**
 * 開帳精靈（/initialization）文件辨識與欄位 metadata API，對應後端「開帳流程／peit」。
 * - GET  /ael/peit/form/metadata：依文件編號與民國年回欄位 metadata（畫面表單由此動態產生）
 * - POST /ael/peit/cit/identify：上傳 PDF 辨識營所稅結算申報書各表與營業稅 401／403，回傳各表自己的 taxYear
 * - POST /ael/peit/vat/compare：某期發票試算 401／403 並與已寫入申報值對帳
 * - POST /ael/peit/vat/media/{txt,tetu,t07,t07/supplement}：產生申報媒體檔（重送覆蓋）
 * - GET  /ael/peit/vat/media/status：查媒體檔產生狀態；GET /ael/peit/vat/media：下載
 */
import { apiFetch, apiFetchFile, buildQuery } from './client';
import { COMPANY_UUID } from './config';
import { normalizeDateToIso } from '@/lib/utils';

/** dataType：0 文字、1 金額元（可負）、2 小數、3 日期、4 布林、5 純整數（年數、份數等，非金額）、6 百分比（顯示值，20＝20%，可負） */
export type IdentifiedFieldDataType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface IdentifiedField {
  fieldCode: string;
  fieldName: string;
  officialFieldCode: string | null;
  dataType: IdentifiedFieldDataType;
  valueInt: number | null;
  valueDecimal: number | null;
  valueText: string | null;
  valueDate: string | null;
  valueBoolean: boolean | null;
}

export interface IdentifiedRow {
  /** 列序，從 1 起 */
  rowIndex: number;
  /** 財產目錄的列種：DETAIL 明細、SUBTOTAL 類別小計；省略視為 DETAIL */
  rowKind?: 'DETAIL' | 'SUBTOTAL' | null;
  /** 財產目錄類別列的分組鍵（類別編號）；明細列、小計列沒有 */
  groupKey?: string | null;
  fields: IdentifiedField[];
}

export interface IdentifiedForm {
  formCode: string;
  officialFormCode: string | null;
  formName: string;
  /** 文件中看得到該表才為 true；false 時 fields／rows 皆為空 */
  present: boolean;
  /** 該表自己的民國年，之後依此年度撈 metadata */
  taxYear: number;
  /** 單路失敗碼（0019／0025／0029）；成功為 null */
  errorCode: string | null;
  errorMessage: string;
  /** 僅 401／403 會傳：申報始月、結月 */
  periodStartMonth?: number;
  periodEndMonth?: number;
  fields: IdentifiedField[];
  rows: IdentifiedRow[];
}

export interface CitIdentifyResult {
  /** 開帳民國年（回傳請求帶入的 openingYear） */
  openingYear?: number;
  profile: Record<string, boolean | null>;
  /** 固定 13 筆（11 張營所稅＋401＋403），請用 formCode 對應，不要用陣列下標 */
  forms: IdentifiedForm[];
}

export interface MetadataField {
  /** 唯一鍵 */
  fieldCode: string;
  /** 欄位名稱（保留現況，可能含「－帳載結算金額」等後綴） */
  fieldName: string;
  /** 紙本顯示文字，去掉帳載／調整後等前後綴；畫面一律用它 */
  displayName?: string;
  /** 紙本紅色編號，同一張表可重複，不可當 key */
  officialFieldCode: string | null;
  /** 紙本圈號（①②…），不是欄位代碼 */
  refNo?: string | null;
  /** true＝紙本沒有此欄：值照常讀寫與送出，但不畫 */
  hidden?: boolean;
  dataType: IdentifiedFieldDataType;
  sectionCode: string | null;
  /** true＝可重複列欄位（列模板） */
  isRow: boolean;
  /** 父科目 fieldCode（目前僅資產負債表有），用於縮排呈現階層 */
  parentFieldCode?: string | null;
  /** layout=inline 時指向主列的 rowCode */
  parentRowCode?: string | null;
  /** 減項標記（紙本沒印「減：」的也可能為 true），名稱以 displayName 為準 */
  isDeduction?: boolean;
  /** 紙本填在「合計」欄的科目（資產負債表），標題粗體 */
  isTotalColumn?: boolean;
  /** 小計／算式欄：欄位可編輯，沒有值時前端依 formula.expr 試算顯示 */
  isSubtotal?: boolean;
  /** 同一列共同代號，BOOK／ADJ 共用；單欄等於 fieldCode */
  rowCode?: string;
  /** BOOK＝帳載結算金額、ADJ＝自行依法調整後金額；單欄為 null */
  column?: 'BOOK' | 'ADJ' | null;
  /** row 一般列（預設）／inline 嵌在別列標題空格／cell 表格格子／text 段落內空格／group 分組標題列 */
  layout?: 'row' | 'inline' | 'cell' | 'text' | 'group';
  /** 列標題模板：{{field:fieldCode}}、{{group:groupCode}}，只放在該列第一個欄位 */
  labelTemplate?: string | null;
  /** 紙本標題後括號備註 */
  note?: string | null;
  /** 區塊內分組（如調節加項／減項） */
  groupCode?: string | null;
  /** 條件成立才顯示 */
  visibleWhen?: { fieldCode: string; op: 'checked' | 'unchecked' | 'nonZero' } | null;
  /** 有值必為 isSubtotal；text 給前端顯示，expr 由後端計算 */
  formula?: { text: string; expr: string; scope?: 'table' | 'group' } | null;
  tableCode?: string | null;
  rowNo?: string | number | null;
  columnCode?: string | null;
  /** 財產目錄列欄位的列種：DETAIL 明細、SUBTOTAL 類別小計；其餘為 null */
  rowKind?: 'DETAIL' | 'SUBTOTAL' | null;
}

/** 互斥勾選組；maxSelect=1 表示二選一／多選一 */
export interface MetadataChoiceGroup {
  groupCode: string;
  /** 紙本完整題目 */
  groupName: string;
  officialFieldCode?: string | null;
  /** 題目旁括號提示 */
  note?: string | null;
  /** checkbox＝並排勾選框 */
  display?: string | null;
  /** 勾選框每列並排數；0 或省略表示不指定 */
  columns?: number;
  maxSelect: number;
  fieldCodes: string[];
}

export interface MetadataTableColumn {
  columnCode: string;
  title: string;
  /** 欄群組標題，由上到下；實測可能為 null */
  groups?: string[] | null;
  refNo?: string | null;
  officialFieldCode?: string | null;
}

export interface MetadataTable {
  tableCode: string;
  title?: string | null;
  note?: string | null;
  sectionCode?: string | null;
  /** TOP、某個 blockCode／tableCode／fieldCode，null 放該區塊最後 */
  placeAfter?: string | null;
  corner?: { column: string | null; row: string | null } | null;
  columns: MetadataTableColumn[];
  /** true＝使用者可新增列 */
  rowRepeatable?: boolean;
  /** 規格為物件，實測目前回分組欄 fieldCode 字串，兩種都接 */
  groupBy?: string | { fieldCodes: string[]; headerTemplate?: string; subtotalLabel?: string } | null;
  rowNumber?: { title: string | null; pad: number } | null;
  /** 固定列（含 TOTAL／SUBTOTAL） */
  rows?: { rowNo: string | number; rowLabel?: string | null; rowGroup?: string | null }[];
}

export interface MetadataTextBlock {
  blockCode: string;
  sectionCode?: string | null;
  officialFieldCode?: string | null;
  placeAfter?: string | null;
  /** {{field:…}}、{{ref:…}}、{{group:…}} */
  template: string;
}

export interface MetadataSection {
  sectionCode: string;
  title: string | null;
  parentSectionCode?: string | null;
}

export interface MetadataDateRange {
  groupCode: string;
  groupName: string;
  startFieldCode: string;
  endFieldCode: string;
}

export interface FormMetadata {
  formNo: number;
  formCode: string;
  formName: string;
  officialFormCode: string | null;
  taxYear: number;
  /** 0 營所稅、1 營業稅 */
  taxType: number;
  fields: MetadataField[];
  choiceGroups: MetadataChoiceGroup[];
  tables?: MetadataTable[];
  textBlocks?: MetadataTextBlock[];
  sections?: MetadataSection[];
  dateRanges?: MetadataDateRange[];
}

/** 依 dataType 取出該欄位實際值；未辨識（皆為 null）回傳 undefined，畫面上維持留空 */
export function pickIdentifiedValue(field: IdentifiedField): string | number | undefined {
  switch (field.dataType) {
    case 0: {
      // 文字：辨識結果常夾帶空白（如統編「6064 1234」、姓名中間有空格），一律移除所有空白（含全形空白與零寬字元）
      const text = field.valueText?.replace(/[\s\u200B-\u200D\uFEFF]+/g, '');
      return text ? text : undefined;
    }
    case 1: // 金額元
    case 5: // 純整數
    case 6: // 百分比：顯示值（15＝15%），同樣放在 valueInt
      return field.valueInt ?? undefined;
    case 2: // 小數
      return field.valueDecimal ?? undefined;
    case 3: // 日期
      // 後端日期格式不固定（民國年原樣），統一轉成 ISO，畫面與 confirm 才能解析
      return field.valueDate ? normalizeDateToIso(field.valueDate) : undefined;
    case 4: // 布林：畫面以 1／0 存放（見 ReportFieldRow boolean 分支）
      return field.valueBoolean === null ? undefined : field.valueBoolean ? 1 : 0;
    default:
      return undefined;
  }
}

/** 依文件編號（1–12）與民國年取得該表欄位 metadata */
export function getFormMetadata(formNo: number, taxYear: number): Promise<FormMetadata> {
  return apiFetch<FormMetadata>(`/ael/peit/form/metadata${buildQuery({ formNo, taxYear })}`);
}

/** 辨識營所稅結算申報書（可含多頁）或 401／403 PDF，不寫庫，僅回辨識結果供前端回填欄位；openingYear 為開帳民國年 */
export function identifyCit(file: File, openingYear: number): Promise<CitIdentifyResult> {
  const formData = new FormData();
  formData.append('companyUuid', COMPANY_UUID);
  formData.append('openingYear', String(openingYear));
  formData.append('file', file);
  return apiFetch<CitIdentifyResult>('/ael/peit/cit/identify', {
    method: 'POST',
    body: formData,
    // 多頁並行 AI 辨識耗時較長，逾時放寬到 180 秒
    signal: AbortSignal.timeout(180_000),
  });
}

/** confirm 的單一欄位值：依 dataType 只填對應的 value*，其餘留 null */
export interface ConfirmField {
  fieldCode: string;
  valueInt?: number | null;
  valueDecimal?: number | null;
  valueText?: string | null;
  valueDate?: string | null;
  valueBoolean?: boolean | null;
  /** 使用者是否改過辨識值；true 後端記為人工調整 */
  isManualAdjusted?: boolean;
}

export interface ConfirmRow {
  /** 列序，≥0；前端依畫面順序從 0 起 */
  rowIndex: number;
  /** 財產目錄的列種：小計列送 SUBTOTAL；明細列省略（視為 DETAIL） */
  rowKind?: 'SUBTOTAL';
  /** 財產目錄類別列的分組鍵（類別編號），與辨識回傳一致 */
  groupKey?: string;
  fields: ConfirmField[];
}

export interface ConfirmForm {
  formCode: string;
  present: boolean;
  taxYear: number;
  /** 僅 401／403：期別 1／3／5／7／9／11（可省略，後端由 periodStartMonth 推） */
  cmsPhase?: number;
  /** 僅 401／403：所屬起月（1／3／5／7／9／11） */
  periodStartMonth?: number;
  fields: ConfirmField[];
  rows: ConfirmRow[];
}

export interface CitConfirmResult {
  companyUuid: string;
  writtenFormCount: number;
  forms: { formCode: string; written: boolean; writtenFieldCount: number; skipped: boolean; skipReason?: string }[];
}

/** compare 的單一對帳欄位；filedValue／delta 為 null 代表該期尚未寫入申報書 */
export interface VatCompareDiff {
  fieldCode: string;
  fieldName: string;
  /** IN_NONDEDUCT_RATIO（dataType=2）為 0–1 小數，其餘為金額元 */
  invoiceValue: number;
  filedValue: number | null;
  /** invoiceValue − filedValue */
  delta: number | null;
}

/** compare 回傳中前端用到的部分；invoiceCalc 為發票試算明細，目前畫面不使用故不展開型別 */
export interface VatCompareResult {
  taxYear: number;
  cmsPhase: number;
  /** 依發票判定：401 或 403 */
  formKind: string;
  /** 已 confirm 寫入的申報書；該期尚未寫入為 null */
  filed: { caseUuid: string; formCode: string; status: number } | null;
  diffs: VatCompareDiff[];
}

/** 某期發票試算 401／403 並與已寫入申報值對帳（POST /ael/peit/vat/compare）；cmsPhase 僅 1／3／5／7／9／11 */
export function compareVat(params: { taxYear: number; cmsPhase: number }): Promise<VatCompareResult> {
  return apiFetch<VatCompareResult>('/ael/peit/vat/compare', {
    method: 'POST',
    body: JSON.stringify({ companyUuid: COMPANY_UUID, ...params }),
  });
}

/** 申報媒體檔種類：TXT／TET_U／T07／T07 補申報 */
export type VatMediaKind = 'txt' | 'tetu' | 't07' | 't07s';

export interface VatMediaFile {
  fileName: string;
  /** ISO 8601 */
  generatedAt: string;
  /** 401／403；T07 類檔案為 null */
  formKind: string | null;
  kind: VatMediaKind;
}

interface VatMediaParams {
  taxYear: number;
  cmsPhase: number;
}

/** t07s 的路徑為 /media/t07/supplement，其餘與 kind 同名 */
const VAT_MEDIA_PATH: Record<VatMediaKind, string> = {
  txt: '/ael/peit/vat/media/txt',
  tetu: '/ael/peit/vat/media/tetu',
  t07: '/ael/peit/vat/media/t07',
  t07s: '/ael/peit/vat/media/t07/supplement',
};

/** 產生某期申報媒體檔；重送視為重新產生（覆蓋） */
export function generateVatMedia(kind: VatMediaKind, params: VatMediaParams): Promise<VatMediaFile> {
  return apiFetch<VatMediaFile>(VAT_MEDIA_PATH[kind], {
    method: 'POST',
    body: JSON.stringify({ companyUuid: COMPANY_UUID, ...params }),
  });
}

/**
 * 查某期全部媒體檔的產生狀態（GET /ael/peit/vat/media/status，不帶 kind）。
 * 規格寫「省略 kind＝回該期全部」但 schema 只標單一物件，故陣列／物件／null 都統一成陣列，待實測確認。
 */
export async function getVatMediaStatus(params: VatMediaParams): Promise<VatMediaFile[]> {
  const data = await apiFetch<VatMediaFile | VatMediaFile[] | null>(
    `/ael/peit/vat/media/status${buildQuery({ companyUuid: COMPANY_UUID, ...params })}`,
  );
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

/** 下載已產生的媒體檔（GET /ael/peit/vat/media，text/plain）；未產檔後端回 errorCode 0006 */
export function downloadVatMedia(kind: VatMediaKind, params: VatMediaParams): Promise<Blob> {
  return apiFetchFile(`/ael/peit/vat/media${buildQuery({ companyUuid: COMPANY_UUID, ...params, kind })}`);
}

/** 寫入／覆寫公司開帳日；openingDate 為民國 YYYMMDD（如 1140514），重送會覆寫 */
export function saveOpeningDate(openingDate: string): Promise<{ companyUuid: string; openingDate: string }> {
  return apiFetch('/ael/peit/openingDate', {
    method: 'POST',
    body: JSON.stringify({ companyUuid: COMPANY_UUID, openingDate }),
  });
}

/** 確認並寫入營所稅各表與營業稅 401／403 各期資料（使用者逐頁核對後的最終值） */
export function confirmCit(forms: ConfirmForm[]): Promise<CitConfirmResult> {
  return apiFetch<CitConfirmResult>('/ael/peit/cit/confirm', {
    method: 'POST',
    body: JSON.stringify({ companyUuid: COMPANY_UUID, forms }),
  });
}
