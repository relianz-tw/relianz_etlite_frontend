import { DEFAULT_SECTION_CODE, getSectionTitle } from './sectionTitles';
import { FORM_LIST } from './formList';
import type { FormMetadata, IdentifiedFieldDataType } from '@/api/peit';
import type { ReportFieldDef, ReportFieldType, ReportPageDef, ReportSectionDef } from './types';
import type { ReportData, ReportField, SettlementReportId } from '../state/initializationReducer';

export type { ReportFieldDef, ReportPageDef, ReportSectionDef, ReportTableDef, ReportFieldType, ReportChoiceDef } from './types';
export { FORM_LIST, REPORT_PAGE_ORDER, getDefaultFormYear, getCurrentOpenYear, getOpenYearOptions, toGregorianYear, getFormItem } from './formList';

/** metadata dataType（0 文字、1 整數或金額、2 小數、3 日期、4 布林）→ 畫面欄位型別 */
const FIELD_TYPE_MAP: Record<IdentifiedFieldDataType, ReportFieldType> = {
  0: 'text',
  1: 'money',
  2: 'decimal',
  3: 'date',
  4: 'boolean',
};

/** 資產負債表：資產總計(BS_1000) 與負債及權益總計(BS_9000) 借貸平衡檢查 */
const BALANCE_CHECK_CONFIG: Partial<Record<SettlementReportId, NonNullable<ReportPageDef['balanceCheck']>>> = {
  CIT_BALANCE_SHEET: { leftKey: 'BS_1000', rightKey: 'BS_9000', leftLabel: '資產總計', rightLabel: '負債及權益總計' },
};

/** 依 metadata API 回傳組出畫面渲染用的 ReportPageDef（步驟 3 封面頁、步驟 4 報表核對頁共用） */
export function buildReportPage(meta: FormMetadata): ReportPageDef {
  const formCode = meta.formCode as SettlementReportId;

  // 固定欄位依 sectionCode 分組並保留 API 回傳順序；列欄位另組成表格
  const sectionMap = new Map<string, ReportSectionDef>();
  const placedFields = new Map<string, { def: ReportFieldDef; section: ReportSectionDef }>();
  const tableColumns: ReportFieldDef[] = [];
  for (const f of meta.fields) {
    const def: ReportFieldDef = { key: f.fieldCode, label: f.fieldName, type: FIELD_TYPE_MAP[f.dataType] ?? 'text' };
    if (f.isRow) {
      tableColumns.push(def);
      continue;
    }
    const sectionCode = f.sectionCode ?? DEFAULT_SECTION_CODE;
    let section = sectionMap.get(sectionCode);
    if (!section) {
      section = { key: sectionCode, title: getSectionTitle(sectionCode), fields: [] };
      sectionMap.set(sectionCode, section);
    }
    section.fields.push(def);
    placedFields.set(f.fieldCode, { def, section });
  }

  // choiceGroups 內的布林欄位合併成「多選一」（同組至少 2 個成員、maxSelect=1），放在第一個成員所在的區塊；
  // 不屬於任何組的布林欄位仍是獨立勾選
  for (const group of meta.choiceGroups) {
    if (group.maxSelect !== 1) continue;
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
    balanceCheck: BALANCE_CHECK_CONFIG[formCode],
  };
}

/**
 * 把指定區塊（sectionCode）合併成一張卡片，放在第一個符合區塊的位置，欄位與多選一依原順序串接。
 * 封面頁用來把組織型態／申報種類／其他勾選合成「申報類別」一張卡。
 */
export function mergeSections(sections: ReportSectionDef[], keys: string[], merged: { key: string; title: string }): ReportSectionDef[] {
  const matched = sections.filter(s => s.key && keys.includes(s.key));
  if (matched.length === 0) return sections;
  const combined: ReportSectionDef = {
    key: merged.key,
    title: merged.title,
    fields: matched.flatMap(s => s.fields),
    choices: matched.flatMap(s => s.choices ?? []),
  };
  const result: ReportSectionDef[] = [];
  let placed = false;
  for (const section of sections) {
    if (section.key && keys.includes(section.key)) {
      if (!placed) result.push(combined);
      placed = true;
    } else {
      result.push(section);
    }
  }
  return result;
}

/** InitializationState.reports 初始值；欄位定義改由 metadata 動態取得，這裡只需每份文件一個空容器 */
export function buildInitialReportsState(): Record<SettlementReportId, ReportData> {
  return Object.fromEntries(FORM_LIST.map(form => [form.formCode, { fields: {}, rows: [] }])) as unknown as Record<SettlementReportId, ReportData>;
}

function emptyField(): ReportField {
  return { value: '', aiFilled: false };
}

/** 依表格欄位定義建立一列空白資料，供「新增一列」使用 */
export function buildEmptyRow(columns: ReportFieldDef[]): Record<string, ReportField> {
  return Object.fromEntries(columns.map(col => [col.key, emptyField()]));
}
