import { FORM_LIST } from './formList';
import type { FormMetadata, IdentifiedFieldDataType } from '@/api/peit';
import type { ReportFieldDef, ReportFieldType, ReportPageDef, ReportSectionDef } from './types';
import type { ReportData, ReportField, SettlementReportId } from '../state/initializationReducer';

export type { ReportFieldDef, ReportPageDef, ReportSectionDef, ReportTableDef, ReportFieldType, ReportChoiceDef } from './types';
export * from './reportPages';
export { FORM_LIST, CIT_PAGE_ORDER, getDefaultFormYear, getCurrentOpenYear, getOpenYearOptions, resolveToday, toGregorianYear, getFormItem, isFormApplicable, isSoleOrPartnership, ORG_TYPE_LABEL } from './formList';

/** 沒有 sectionCode 的欄位歸入的預設區塊 */
const DEFAULT_SECTION_CODE = 'OTHER';

/** metadata dataType（0 文字、1 整數或金額、2 小數、3 日期、4 布林）→ 畫面欄位型別 */
const FIELD_TYPE_MAP: Record<IdentifiedFieldDataType, ReportFieldType> = {
  0: 'text',
  1: 'money',
  2: 'decimal',
  3: 'date',
  4: 'boolean',
};

/** 依 metadata API 回傳組出畫面渲染用的 ReportPageDef（步驟 3 封面頁、步驟 4 報表核對頁共用） */
export function buildReportPage(meta: FormMetadata): ReportPageDef {
  const formCode = meta.formCode as SettlementReportId;

  // 固定欄位依 sectionCode 分組並保留 API 回傳順序；列欄位另組成表格
  const sectionMap = new Map<string, ReportSectionDef>();
  const placedFields = new Map<string, { def: ReportFieldDef; section: ReportSectionDef }>();
  const tableColumns: ReportFieldDef[] = [];
  for (const f of meta.fields) {
    const def: ReportFieldDef = {
      key: f.fieldCode,
      label: f.fieldName,
      type: FIELD_TYPE_MAP[f.dataType] ?? 'text',
      parentKey: f.parentFieldCode ?? undefined,
      isDeduction: f.isDeduction || undefined,
      isSubtotal: f.isSubtotal || undefined,
    };
    if (f.isRow) {
      tableColumns.push(def);
      continue;
    }
    const sectionCode = f.sectionCode ?? DEFAULT_SECTION_CODE;
    let section = sectionMap.get(sectionCode);
    if (!section) {
      section = { key: sectionCode, fields: [] };
      sectionMap.set(sectionCode, section);
    }
    section.fields.push(def);
    placedFields.set(f.fieldCode, { def, section });
  }

  // choiceGroups 內的布林欄位合併成「多選一」（同組至少 2 個成員），放在第一個成員所在的區塊（≤3 項 tab、更多用下拉）。
  // 不論 API 的 maxSelect 為何（如簽證別為 2），一組內一律只能有一個選項為 true；不屬於任何組的布林欄位仍是獨立勾選
  for (const group of meta.choiceGroups) {
    const members = group.fieldCodes.map(code => placedFields.get(code)).filter((m): m is NonNullable<typeof m> => !!m && m.def.type === 'boolean');
    if (members.length < 2) continue;
    for (const { def, section } of members) section.fields = section.fields.filter(f => f !== def);
    const owner = members[0].section;
    owner.choices = [...(owner.choices ?? []), { groupCode: group.groupCode, title: group.groupName, fields: members.map(m => m.def) }];
  }

  return {
    id: formCode,
    title: meta.formName,
    sections: Array.from(sectionMap.values()),
    table: tableColumns.length > 0 ? { columns: tableColumns, addRowLabel: `新增一列${meta.formName}明細` } : undefined,
  };
}

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
