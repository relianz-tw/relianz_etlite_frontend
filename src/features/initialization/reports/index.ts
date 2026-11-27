import { FORM_LIST } from './formList';
import type { ReportFieldDef } from './types';
import type { ReportData, ReportField } from '../state/initializationReducer';

export type { ReportFieldDef, ReportPageDef, ReportSectionDef, ReportTableDef, ReportFieldType, ReportChoiceDef } from './types';
export { buildReportPage, omitFields, isAmountType } from './paperLayout';
export * from './reportPages';
export { FORM_LIST, CIT_PAGE_ORDER, getDefaultFormYear, getCurrentOpenYear, getOpenYearOptions, resolveToday, toGregorianYear, getFormItem, isFormApplicable, isSoleOrPartnership, ORG_TYPE_LABEL } from './formList';
export { findFormInMessage, formTitleOf } from './confirmErrors';
export { buildRequiredDocs, COVER_CODE } from './requiredDocs';
export type { RequiredDoc, RequiredDocStatus } from './requiredDocs';
export {
  COMPANY_REGISTRATION_KEY,
  IDENTIFY_MAX_SIZE_MB,
  OFFICER_COLUMN_KEYS,
  REGISTRATION_FORM_NO,
  REGISTRATION_FORM_YEAR,
  REGISTRATION_ITEMS_CODE,
  REGISTRATION_LOCKED_COVER_FIELDS,
  REGISTRATION_OFFICER_TO_COVER,
  REGISTRATION_SUMMARY_GROUPS,
  REGISTRATION_TO_COMPANY,
  REGISTRATION_TO_COVER,
  hasRegistrationData,
  isMaskedValue,
  lockedCoverValues,
  officerRows,
  representativeRow,
  withoutSharedFields,
} from './registrationForm';

/** InitializationState.reports 初始值：只種營所稅各表（含封面）的空容器；401／403 各期別頁的 key 在使用時才建立 */
export function buildInitialReportsState(): Record<string, ReportData> {
  return Object.fromEntries(FORM_LIST.filter(form => form.taxType === 'cit').map(form => [form.formCode, { fields: {}, rows: [] }]));
}

function emptyField(): ReportField {
  return { value: '', aiFilled: false };
}

/** 依表格欄位定義建立一列空白資料，供「新增一列」使用 */
export function buildEmptyRow(columns: ReportFieldDef[]): Record<string, ReportField> {
  return Object.fromEntries(columns.map(col => [col.key, emptyField()]));
}
