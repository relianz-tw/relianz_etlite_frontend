import type { FormMetadata, IdentifiedFieldDataType, MetadataField, MetadataTable } from '@/api/peit';
import type {
  ReportChoiceDef,
  ReportFieldDef,
  ReportFieldType,
  ReportPageDef,
  ReportPaperTableDef,
  ReportRowDef,
  ReportSectionDef,
  ReportSectionItem,
} from './types';
import type { SettlementReportId } from '../state/initializationReducer';

/** 沒有 sectionCode 的欄位歸入的區塊（紙本無標題，不畫標題） */
const DEFAULT_SECTION_CODE = 'OTHER';

/** metadata dataType（0 文字、1 金額元、2 小數、3 日期、4 布林、5 純整數、6 百分比）→ 畫面欄位型別 */
const FIELD_TYPE_MAP: Record<IdentifiedFieldDataType, ReportFieldType> = {
  0: 'text',
  1: 'money',
  2: 'decimal',
  3: 'date',
  4: 'boolean',
  5: 'integer',
  6: 'percent',
};

const TEMPLATE_TOKEN = /\{\{(field|ref|group):([^}]+)\}\}/g;

/** 逐列呈現的數值型別（金額、純整數、小數、百分比）；文字、日期、勾選另外排 */
export const isAmountType = (type: ReportFieldType) => type === 'money' || type === 'integer' || type === 'decimal' || type === 'percent';

function toFieldDef(f: MetadataField): ReportFieldDef {
  const type = FIELD_TYPE_MAP[f.dataType] ?? 'text';
  return {
    key: f.fieldCode,
    label: f.displayName || f.fieldName,
    type,
    // 金額欄一律允許正負值（虧損、調整數、差額）
    allowSign: type === 'money' || undefined,
    parentKey: f.parentFieldCode ?? undefined,
    isDeduction: f.isDeduction || undefined,
    isSubtotal: f.isSubtotal || undefined,
    officialCode: f.officialFieldCode ?? undefined,
    refNo: f.refNo ?? undefined,
    note: f.note ?? undefined,
    formulaText: f.formula?.text,
    formulaExpr: f.formula?.expr,
    rowCode: f.rowCode,
    column: f.column ?? undefined,
    layout: f.layout,
    labelTemplate: f.labelTemplate ?? undefined,
    groupCode: f.groupCode ?? undefined,
    visibleWhen: f.visibleWhen ?? undefined,
    hidden: f.hidden || undefined,
    isRow: f.isRow || undefined,
    tableCode: f.tableCode ?? undefined,
    rowNo: f.rowNo ?? undefined,
    columnCode: f.columnCode ?? undefined,
  };
}

/** 模板（labelTemplate、textBlocks）以 {{field:}}、{{group:}} 嵌入的欄位與勾選組：這些不再單獨成列 */
function collectTemplateRefs(templates: (string | undefined)[]) {
  const fields = new Set<string>();
  const groups = new Set<string>();
  for (const template of templates) {
    if (!template) continue;
    // {{ref:}} 只是引用值，該欄位仍是自己的一列，不算嵌入
    for (const m of Array.from(template.matchAll(TEMPLATE_TOKEN))) {
      if (m[1] === 'group') groups.add(m[2]);
      else if (m[1] === 'field') fields.add(m[2]);
    }
  }
  return { fields, groups };
}

function buildTable(
  t: MetadataTable,
  defs: ReportFieldDef[],
  rowFields: ReportFieldDef[],
  soleRepeatable: boolean
): ReportPaperTableDef {
  const columns = t.columns.map(c => ({
    code: c.columnCode,
    title: c.title,
    groups: c.groups ?? [],
    refNo: c.refNo ?? undefined,
    officialCode: c.officialFieldCode ?? undefined,
  }));
  const cells: Record<string, ReportFieldDef> = {};
  for (const f of defs) {
    if (f.tableCode === t.tableCode && !f.isRow && f.rowNo !== undefined && f.columnCode) cells[`${f.rowNo}|${f.columnCode}`] = f;
  }
  let rowColumns: ReportFieldDef[] = [];
  let rowColumnsMatch = false;
  if (t.rowRepeatable) {
    let claimed = rowFields.filter(f => f.tableCode === t.tableCode);
    // 後端沒有為列欄位標 tableCode 時，整頁只有一張可重複表就全數歸它
    if (claimed.length === 0 && soleRepeatable) claimed = rowFields.filter(f => !f.tableCode);
    rowColumnsMatch = claimed.length > 0 && claimed.every(f => f.columnCode && columns.some(c => c.code === f.columnCode));
    rowColumns = rowColumnsMatch ? columns.map(c => claimed.find(f => f.columnCode === c.code)).filter((f): f is ReportFieldDef => !!f) : claimed;
  }
  // groupBy 舊格式為單一分組欄位的字串，新格式為物件；統一成物件
  const groupBy = typeof t.groupBy === 'string' ? { fieldCodes: [t.groupBy] } : t.groupBy?.fieldCodes?.length ? t.groupBy : undefined;
  const groupFields = (groupBy?.fieldCodes ?? []).map(code => defs.find(d => d.key === code)).filter((f): f is ReportFieldDef => !!f);
  return {
    code: t.tableCode,
    title: t.title ?? undefined,
    note: t.note ?? undefined,
    corner: t.corner ? { column: t.corner.column ?? undefined, row: t.corner.row ?? undefined } : undefined,
    columns,
    rows: (t.rows ?? []).map(r => ({ rowNo: r.rowNo, label: r.rowLabel ?? undefined, group: r.rowGroup ?? undefined })),
    repeatable: !!t.rowRepeatable,
    rowNumber: t.rowNumber ? { title: t.rowNumber.title ?? undefined, pad: t.rowNumber.pad } : undefined,
    groupBy: groupBy && { fieldCodes: groupBy.fieldCodes, headerTemplate: groupBy.headerTemplate ?? undefined, subtotalLabel: groupBy.subtotalLabel ?? undefined },
    groupFields,
    cells,
    rowColumns,
    rowColumnsMatch,
  };
}

/** 區塊內建構中的內容：row／input／check 先各自成項，插入表格與段落後才合併成連續的一組 */
type RawItem = { item: ReportSectionItem; anchors: string[] };

/** 依 placeAfter 把 tables／textBlocks 插進區塊內容：TOP＝最前面；某個 code＝接在該項目後面；null＝依序放最後 */
function insertPlaced(base: RawItem[], placed: { code: string; placeAfter?: string | null; item: ReportSectionItem }[]): RawItem[] {
  const result = [...base];
  const pending = placed.filter(p => p.placeAfter && p.placeAfter !== 'TOP');
  const tops = placed.filter(p => p.placeAfter === 'TOP');
  const tails = placed.filter(p => !p.placeAfter);
  result.unshift(...tops.map(p => ({ item: p.item, anchors: [p.code] })));
  // placeAfter 為 null 的先依序放最後；其他項目可能接在它們後面（如段落接在 placeAfter 為 null 的表格後），所以要先放進去才找得到
  result.push(...tails.map(p => ({ item: p.item, anchors: [p.code] })));
  // 被引用的項目可能是另一個剛插入的段落，所以重複掃到沒有進展為止
  let progressed = true;
  while (pending.length > 0 && progressed) {
    progressed = false;
    for (let i = 0; i < pending.length; i++) {
      const p = pending[i];
      const at = result.findIndex(r => r.anchors.includes(p.placeAfter as string));
      if (at < 0) continue;
      result.splice(at + 1, 0, { item: p.item, anchors: [p.code] });
      pending.splice(i, 1);
      progressed = true;
      i--;
    }
  }
  // 找不到被引用項目的，退回放區塊最後，不讓內容消失
  result.push(...pending.map(p => ({ item: p.item, anchors: [p.code] })));
  return result;
}

function mergeRuns(raw: RawItem[]): ReportSectionItem[] {
  const out: ReportSectionItem[] = [];
  for (const { item } of raw) {
    const last = out[out.length - 1];
    if (item.kind === 'amountRows' && last?.kind === 'amountRows') last.rows.push(...item.rows);
    else if (item.kind === 'inputs' && last?.kind === 'inputs') last.fields.push(...item.fields);
    else if (item.kind === 'checks' && last?.kind === 'checks') last.fields.push(...item.fields);
    else out.push(item.kind === 'amountRows' ? { kind: 'amountRows', rows: [...item.rows] } : item.kind === 'inputs' ? { kind: 'inputs', fields: [...item.fields] } : item.kind === 'checks' ? { kind: 'checks', fields: [...item.fields] } : item);
  }
  return out;
}

/**
 * 說明欄（文字欄位、parentFieldCode 指向同區塊的主欄位，如 75「其他」的說明）排在主欄位那一列的下一排，
 * 不管後端 fields[] 把它放在哪；沒標 groupCode 時沿用主欄位的分組，加項／減項折疊時才會一起收起來。
 */
function withNotesAfterParent(fields: ReportFieldDef[]): ReportFieldDef[] {
  const keys = new Set(fields.map(f => f.key));
  const isNote = (f: ReportFieldDef) => !!f.parentKey && keys.has(f.parentKey) && f.type === 'text';
  return fields
    .filter(f => !isNote(f))
    .flatMap(f => [f, ...fields.filter(n => isNote(n) && n.parentKey === f.key).map(n => ({ ...n, groupCode: n.groupCode ?? f.groupCode }))]);
}

/**
 * 依 metadata API 回傳組出畫面渲染用的 ReportPageDef（步驟 3 封面頁、步驟 4 報表核對頁共用）。
 * 區塊標題取 sections[]、同一 rowCode 的 BOOK／ADJ 合成一列、模板引用的欄位不單獨成列、
 * tables／textBlocks 依 placeAfter 插入，版面一律依後端，前端不寫死。
 */
export function buildReportPage(meta: FormMetadata): ReportPageDef {
  const formCode = meta.formCode as SettlementReportId;
  const defs = meta.fields.map(toFieldDef);
  const fieldMap = Object.fromEntries(defs.map(d => [d.key, d]));
  const rowFields = defs.filter(d => d.isRow);
  const fixedFields = defs.filter(d => !d.isRow);

  const groupMap: Record<string, ReportChoiceDef> = {};
  for (const g of meta.choiceGroups) {
    groupMap[g.groupCode] = {
      groupCode: g.groupCode,
      title: g.groupName,
      officialCode: g.officialFieldCode ?? undefined,
      note: g.note ?? undefined,
      columns: g.columns || undefined,
      maxSelect: g.maxSelect,
      fields: g.fieldCodes.map(code => fieldMap[code]).filter((f): f is ReportFieldDef => !!f && f.type === 'boolean'),
    };
  }
  const memberGroup = new Map<string, ReportChoiceDef>();
  for (const g of Object.values(groupMap)) for (const f of g.fields) memberGroup.set(f.key, g);

  const textBlocks = meta.textBlocks ?? [];
  const refs = collectTemplateRefs([...defs.map(d => d.labelTemplate), ...textBlocks.map(b => b.template)]);

  const repeatableCount = (meta.tables ?? []).filter(t => t.rowRepeatable).length;
  const tables = (meta.tables ?? []).map(t => buildTable(t, defs, rowFields, repeatableCount === 1));
  // 分組欄位由表格自己畫在分組標題列，也算被認領，不再退回卡片式明細
  const claimedRowKeys = new Set(tables.flatMap(t => [...t.rowColumns, ...t.groupFields].map(f => f.key)));
  const unclaimed = rowFields.filter(f => !claimedRowKeys.has(f.key));

  // 區塊順序：依 sectionCode 在 fields[] 第一次出現的位置
  const sectionTitles = new Map((meta.sections ?? []).map(s => [s.sectionCode, s]));
  const sectionOrder: string[] = [];
  for (const f of fixedFields) {
    const code = meta.fields.find(m => m.fieldCode === f.key)?.sectionCode ?? DEFAULT_SECTION_CODE;
    if (!sectionOrder.includes(code)) sectionOrder.push(code);
  }
  const sectionOf = (key: string) => meta.fields.find(m => m.fieldCode === key)?.sectionCode ?? DEFAULT_SECTION_CODE;
  // 只有表格沒有固定欄位的區塊也要出現
  for (const t of meta.tables ?? []) if (t.sectionCode && !sectionOrder.includes(t.sectionCode)) sectionOrder.push(t.sectionCode);
  for (const b of textBlocks) if (b.sectionCode && !sectionOrder.includes(b.sectionCode)) sectionOrder.push(b.sectionCode);
  if (sectionOrder.length === 0) sectionOrder.push(DEFAULT_SECTION_CODE);

  // 段落沒標 sectionCode（紙本無標題）時，跟著它引用的欄位走：{{field:}} 取該欄位的區塊，
  // 只引用 {{group:}}（如 124 存貨計價）取勾選組成員的區塊；這些欄位多半也沒標區塊，
  // 就一起落在無標題區塊，不會被塞進第一個有標題的區塊（如營業淨利）
  const blockSection = (b: (typeof textBlocks)[number]) => {
    if (b.sectionCode) return b.sectionCode;
    const refs = Array.from(b.template.matchAll(TEMPLATE_TOKEN));
    const fieldRef = refs.find(m => m[1] !== 'group' && fieldMap[m[2]]);
    if (fieldRef) return sectionOf(fieldRef[2]);
    const groupRef = refs.find(m => m[1] === 'group' && groupMap[m[2]]?.fields[0]);
    return groupRef ? sectionOf(groupMap[groupRef[2]].fields[0].key) : DEFAULT_SECTION_CODE;
  };
  // 無標題區塊沒有任何固定欄位時（段落是它唯一的內容）也要出現
  for (const b of textBlocks) if (!sectionOrder.includes(blockSection(b))) sectionOrder.push(blockSection(b));

  const dateRangeByStart = new Map((meta.dateRanges ?? []).map(r => [r.startFieldCode, r]));
  const dateRangeEnds = new Set((meta.dateRanges ?? []).map(r => r.endFieldCode));

  // 勾選群組整頁只畫一次：成員被後端分到不同區塊（如某個成員 sectionCode 為 null）時，不在後面的區塊重複畫整組
  const renderedGroups = new Set<string>();

  const sections: ReportSectionDef[] = sectionOrder.map(code => {
    const sectionFields = fixedFields.filter(f => sectionOf(f.key) === code && !f.hidden);
    const adjByRow = new Map(sectionFields.filter(f => f.column === 'ADJ' && f.rowCode).map(f => [f.rowCode as string, f]));
    const bookRows = new Set(sectionFields.filter(f => f.column === 'BOOK' && f.rowCode).map(f => f.rowCode as string));
    const usedGroups = new Set<string>();
    const raw: RawItem[] = [];

    for (const f of withNotesAfterParent(sectionFields)) {
      // 表格格子、分組標題欄由 tables[] 畫；被模板引用的欄位嵌在文字裡
      if (f.layout === 'cell' || f.layout === 'group') continue;
      if (refs.fields.has(f.key)) continue;
      if (dateRangeEnds.has(f.key)) continue;

      const range = dateRangeByStart.get(f.key);
      if (range && fieldMap[range.endFieldCode]) {
        raw.push({ item: { kind: 'dateRange', range: { groupCode: range.groupCode, title: range.groupName, start: f, end: fieldMap[range.endFieldCode] } }, anchors: [f.key, range.endFieldCode] });
        continue;
      }

      const group = memberGroup.get(f.key);
      if (group) {
        if (refs.groups.has(group.groupCode)) continue;
        if (!renderedGroups.has(group.groupCode)) {
          renderedGroups.add(group.groupCode);
          usedGroups.add(group.groupCode);
          raw.push({ item: { kind: 'choice', choice: group }, anchors: group.fields.map(m => m.key) });
        }
        // 同組只有一個成員（無法互斥）就退回獨立勾選
        if (group.fields.length > 1) continue;
      }

      // 表頭區塊（名稱、期間、頁次、收件編號等）一律是一般輸入欄，不論型別都不畫成金額列
      if (isAmountType(f.type) && code !== 'HEADER') {
        // 帳載／調整後成對：ADJ 併進同列的 BOOK，沒有 BOOK 的 ADJ 自己成列
        if (f.column === 'ADJ' && f.rowCode && bookRows.has(f.rowCode)) continue;
        const row: ReportRowDef = { main: f, adj: f.column === 'BOOK' && f.rowCode ? adjByRow.get(f.rowCode) : undefined };
        raw.push({ item: { kind: 'amountRows', rows: [row] }, anchors: [f.key, ...(row.adj ? [row.adj.key] : [])] });
      } else if (f.type === 'boolean') {
        raw.push({ item: { kind: 'checks', fields: [f] }, anchors: [f.key] });
      } else {
        raw.push({ item: { kind: 'inputs', fields: [f] }, anchors: [f.key] });
      }
    }

    const placed = [
      ...tables
        .filter(t => (meta.tables ?? []).find(m => m.tableCode === t.code)?.sectionCode === code || (!(meta.tables ?? []).find(m => m.tableCode === t.code)?.sectionCode && code === sectionOrder[0]))
        .map(t => ({ code: t.code, placeAfter: (meta.tables ?? []).find(m => m.tableCode === t.code)?.placeAfter, item: { kind: 'table', table: t } as ReportSectionItem })),
      ...textBlocks
        .filter(b => blockSection(b) === code)
        .map(b => ({ code: b.blockCode, placeAfter: b.placeAfter, item: { kind: 'text', block: { code: b.blockCode, officialCode: b.officialFieldCode ?? undefined, template: b.template } } as ReportSectionItem })),
    ];

    const sectionMeta = sectionTitles.get(code);
    return {
      key: code,
      title: sectionMeta?.title || undefined,
      parentKey: sectionMeta?.parentSectionCode ?? undefined,
      fields: sectionFields,
      choices: Array.from(usedGroups).map(g => groupMap[g]),
      items: mergeRuns(insertPlaced(raw, placed)),
    };
  });

  return {
    id: formCode,
    title: meta.formName,
    sections,
    // 沒有被 tables[] 認領的列欄位（舊格式或後端未標 tableCode）沿用卡片式明細表
    table: unclaimed.length > 0 ? { columns: unclaimed, addRowLabel: `新增一列${meta.formName}明細` } : undefined,
    fieldMap,
    groupMap,
  };
}

/** 拿掉不給使用者輸入的欄位（所屬年度、期別起訖月等自動填入的欄位），同時從 fields 與 items 移除 */
export function omitFields(sections: ReportSectionDef[], keys: string[]): ReportSectionDef[] {
  if (keys.length === 0) return sections;
  const hide = new Set(keys);
  return sections.map(s => ({
    ...s,
    fields: s.fields.filter(f => !hide.has(f.key)),
    items: s.items
      .map((item): ReportSectionItem | null => {
        switch (item.kind) {
          case 'amountRows': {
            const rows = item.rows.filter(r => !hide.has(r.main.key));
            return rows.length > 0 ? { kind: 'amountRows', rows } : null;
          }
          case 'inputs':
          case 'checks': {
            const fields = item.fields.filter(f => !hide.has(f.key));
            return fields.length > 0 ? { ...item, fields } : null;
          }
          case 'choice': {
            const fields = item.choice.fields.filter(f => !hide.has(f.key));
            return fields.length > 0 ? { ...item, choice: { ...item.choice, fields } } : null;
          }
          case 'dateRange':
            return hide.has(item.range.start.key) || hide.has(item.range.end.key) ? null : item;
          default:
            return item;
        }
      })
      .filter((i): i is ReportSectionItem => !!i),
  }));
}
