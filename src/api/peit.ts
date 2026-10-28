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

/** dataType：0 文字、1 金額元、2 小數、3 日期、4 布林、5 純整數（年數、份數等，非金額） */
export type IdentifiedFieldDataType = 0 | 1 | 2 | 3 | 4 | 5;

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
  /** 固定 10 筆，請用 formCode 對應，不要用陣列下標 */
  forms: IdentifiedForm[];
}

export interface MetadataField {
  fieldCode: string;
  fieldName: string;
  officialFieldCode: string | null;
  dataType: IdentifiedFieldDataType;
  sectionCode: string | null;
  /** true＝可重複列欄位（列模板） */
  isRow: boolean;
  /** 父科目 fieldCode（目前僅資產負債表有），用於縮排呈現階層 */
  parentFieldCode?: string | null;
  /** 扣除項（紙本以括號或「減：」表示） */
  isDeduction?: boolean;
  /** 小計／合計列（非使用者直接輸入的明細） */
  isSubtotal?: boolean;
}

/** 互斥勾選組；maxSelect=1 表示二選一／多選一 */
export interface MetadataChoiceGroup {
  groupCode: string;
  groupName: string;
  maxSelect: number;
  fieldCodes: string[];
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
}

/** 依 dataType 取出該欄位實際值；未辨識（皆為 null）回傳 undefined，畫面上維持留空 */
export function pickIdentifiedValue(field: IdentifiedField): string | number | undefined {
  switch (field.dataType) {
    case 0: // 文字
      return field.valueText ?? undefined;
    case 1: // 金額元
    case 5: // 純整數
      return field.valueInt ?? undefined;
    case 2: // 小數
      return field.valueDecimal ?? undefined;
    case 3: // 日期
      return field.valueDate ?? undefined;
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
}

export interface ConfirmRow {
  /** 列序，≥0；前端依畫面順序從 0 起 */
  rowIndex: number;
  fields: ConfirmField[];
}

export interface ConfirmForm {
  formCode: string;
  present: boolean;
  taxYear: number;
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
