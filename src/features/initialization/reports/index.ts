import { COVER_LEFT, COVER_RIGHT } from './cover';
import { INCOME_STATEMENT_PAGE } from './incomeStatement';
import { BALANCE_SHEET_PAGE } from './balanceSheet';
import { SHAREHOLDERS_PAGE } from './shareholders';
import { WITHHOLDING_RECONCILIATION_PAGE } from './withholdingReconciliation';
import { PROPERTY_LIST_PAGE } from './propertyList';
import type { ReportColumnDef, ReportFieldDef, ReportPageDef } from './types';
import type { ReportData, ReportField, SettlementReportId } from '../state/initializationReducer';

export type { ReportColumnDef, ReportFieldDef, ReportPageDef, ReportSectionDef, ReportTableDef, ReportFieldType } from './types';
export { COVER_LEFT, COVER_RIGHT };

/** 報表頁順序（不含封面，封面併入步驟 3 公司資料頁），對應 state.currentReportIndex 0-4 */
export const REPORT_PAGES: ReportPageDef[] = [
  INCOME_STATEMENT_PAGE,
  BALANCE_SHEET_PAGE,
  SHAREHOLDERS_PAGE,
  WITHHOLDING_RECONCILIATION_PAGE,
  PROPERTY_LIST_PAGE,
];

function collectFieldKeys(column?: ReportColumnDef): string[] {
  if (!column) return [];
  return column.sections.flatMap(section => section.fields.map(f => f.key));
}

function emptyField(): ReportField {
  return { value: '', aiFilled: false };
}

/** 依報表 config 建立初始 fields Record（表格型報表 fields 為空、僅用 rows） */
function buildInitialFields(page: ReportPageDef): Record<string, ReportField> {
  const keys = [...collectFieldKeys(page.left), ...collectFieldKeys(page.right)];
  return Object.fromEntries(keys.map(key => [key, emptyField()]));
}

/** InitializationState.reports 初始值，供 reducer 的 initialState 與 RESTORE_STATE 合併使用 */
export function buildInitialReportsState(): Record<SettlementReportId, ReportData> {
  const coverKeys = [...collectFieldKeys(COVER_LEFT), ...collectFieldKeys(COVER_RIGHT)];
  return {
    cover: { fields: Object.fromEntries(coverKeys.map(key => [key, emptyField()])), fieldsRight: {}, rows: [] },
    incomeStatement: { fields: buildInitialFields(INCOME_STATEMENT_PAGE), fieldsRight: {}, rows: [] },
    // mirrorRight：右欄與左欄科目相同，各自獨立一份初始值，供交叉核對輸入
    balanceSheet: { fields: buildInitialFields(BALANCE_SHEET_PAGE), fieldsRight: buildInitialFields(BALANCE_SHEET_PAGE), rows: [] },
    shareholders: { fields: {}, fieldsRight: {}, rows: [] },
    withholdingReconciliation: { fields: buildInitialFields(WITHHOLDING_RECONCILIATION_PAGE), fieldsRight: {}, rows: [] },
    propertyList: { fields: {}, fieldsRight: {}, rows: [] },
  };
}

/** 依表格欄位定義建立一列空白資料，供「新增一列」使用 */
export function buildEmptyRow(columns: ReportFieldDef[]): Record<string, ReportField> {
  return Object.fromEntries(columns.map(col => [col.key, emptyField()]));
}
