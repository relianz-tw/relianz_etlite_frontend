/**
 * 開帳精靈（/initialization）文件辨識與欄位 metadata API，對應後端「開帳流程／peit」。
 * - GET  /ael/peit/form/metadata：依文件編號與民國年回欄位 metadata（畫面表單由此動態產生）
 * - POST /ael/peit/cit/identify：上傳 PDF 辨識營所稅結算申報書各表與營業稅 401／403，回傳各表自己的 taxYear
 */
import { apiFetch, buildQuery } from './client';
import { COMPANY_UUID } from './config';

/** dataType：0 文字、1 整數或金額元、2 小數、3 日期、4 布林 */
export type IdentifiedFieldDataType = 0 | 1 | 2 | 3 | 4;

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
    case 1: // 整數或金額元
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

/** 辨識營所稅結算申報書（可含多頁）或 401／403 PDF，不寫庫，僅回辨識結果供前端回填欄位 */
export function identifyCit(file: File): Promise<CitIdentifyResult> {
  const formData = new FormData();
  formData.append('companyUuid', COMPANY_UUID);
  formData.append('file', file);
  return apiFetch<CitIdentifyResult>('/ael/peit/cit/identify', {
    method: 'POST',
    body: formData,
    // 多頁並行 AI 辨識耗時較長，逾時放寬到 180 秒
    signal: AbortSignal.timeout(180_000),
  });
}
