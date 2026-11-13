import { EXEMPT_COLLAPSE, EXEMPT_FLAG_KEYS, EXEMPT_KEEP_SECTION } from './exemptRules';
import { loadFormMetadata } from '../hooks/useFormMetadata';
import { FORM_LIST, getCurrentOpenYear, getDefaultFormYear, isFormApplicable, resolveToday } from './formList';
import { isPageFilled, resolveReportPage } from './reportPages';
import type { ConfirmField, ConfirmForm, ConfirmRow, MetadataField, MetadataSection, MetadataTable } from '@/api/peit';
import type { InitializationState, ReportField, SettlementReportId } from '../state/initializationReducer';

/** 欄位值是否已填（空字串與未設定視為空，0 與 false 是有意義的值） */
function isFilled(field: ReportField | undefined): field is ReportField {
  return field !== undefined && field.value !== '';
}

/** 依 metadata dataType 把畫面值（字串或數字）轉成 confirm 要的 value* 欄位；無法轉換回傳 null */
function toConfirmField(meta: MetadataField, field: ReportField): ConfirmField | null {
  // 辨識帶入後沒被改過的值為 false，使用者手填或修改過的值為 true（後端據此記錄資料來源）
  const base = { fieldCode: meta.fieldCode, isManualAdjusted: !field.aiFilled };
  switch (meta.dataType) {
    case 0:
      return { ...base, valueText: String(field.value) };
    case 1: // 金額元
    case 5: { // 純整數
      const n = Number(field.value);
      return Number.isFinite(n) ? { ...base, valueInt: Math.round(n) } : null;
    }
    case 2:
    case 6: { // 小數；百分比為顯示值（79.28＝79.28%），同樣放在 valueDecimal
      const n = Number(field.value);
      return Number.isFinite(n) ? { ...base, valueDecimal: n } : null;
    }
    case 3:
      return { ...base, valueDate: String(field.value) };
    case 4: // 布林畫面以 1／0 存放（見 ReportFieldRow）
      return { ...base, valueBoolean: Number(field.value) === 1 };
    default:
      return null;
  }
}

/**
 * @param negateDeductions 資產負債表：減項科目（累計折舊、備抵呆帳等，紙本以（）表示負值）一律存負值，
 *   畫面上輸入的是正數，辨識帶入的值也可能是正數，這裡統一轉成負數；其他表的減項（如損益表 02）仍是正數
 */
function toConfirmFields(metaByCode: Map<string, MetadataField>, fields: Record<string, ReportField>, wantRow: boolean, negateDeductions = false, skipSections?: Set<string>): ConfirmField[] {
  const result: ConfirmField[] = [];
  for (const [code, field] of Object.entries(fields)) {
    const meta = metaByCode.get(code);
    // 欄位須存在於該年 metadata；可重複列欄位只出現在 rows，不能當純量欄送
    if (!meta || meta.isRow !== wantRow || !isFilled(field)) continue;
    // 被「免填」勾選收起來的區塊：畫面上看不到，使用者先前填過的舊值也不送
    if (meta.sectionCode && skipSections?.has(meta.sectionCode)) continue;
    // 帶算式的小計只送有值的（辨識帶入或使用者輸入）；只是畫面試算出來的不存進欄位，沒送的由後端計算
    const confirmField = toConfirmField(meta, negateDeductions && meta.isDeduction && meta.dataType === 1 ? { ...field, value: -Math.abs(Number(field.value) || 0) } : field);
    if (confirmField) result.push(confirmField);
  }
  return result;
}

/**
 * 免填勾選收起來的區塊（含其子區塊），與畫面（PaperForm）同一套規則：
 * - EXEMPT_COLLAPSE：勾了免填，指定的區塊收起（表四關係人負債、關係人交易）
 * - EXEMPT_FLAG_KEYS：整份免填，除了勾選所在區塊與表頭，其餘區塊全部收起（未分配盈餘申報書）
 */
function collapsedSections(sections: MetadataSection[], metaByCode: Map<string, MetadataField>, fields: Record<string, ReportField>): Set<string> {
  const isChecked = (key: string) => Number(fields[key]?.value) === 1;
  const roots = new Set<string>();
  for (const [flag, codes] of Object.entries(EXEMPT_COLLAPSE)) if (isChecked(flag)) codes.forEach(c => roots.add(c));
  const wholeFormFlag = EXEMPT_FLAG_KEYS.find(k => metaByCode.has(k) && isChecked(k));
  if (wholeFormFlag) {
    const keep = new Set([metaByCode.get(wholeFormFlag)?.sectionCode, EXEMPT_KEEP_SECTION]);
    sections.filter(s => !s.parentSectionCode && !keep.has(s.sectionCode)).forEach(s => roots.add(s.sectionCode));
  }
  // 收起的區塊底下的子區塊一併收起（可能多層）
  const result = new Set(roots);
  let grew = true;
  while (grew) {
    grew = false;
    for (const s of sections) {
      if (s.parentSectionCode && result.has(s.parentSectionCode) && !result.has(s.sectionCode)) {
        result.add(s.sectionCode);
        grew = true;
      }
    }
  }
  return result;
}

type StateRow = Record<string, ReportField>;

/** 一般可重複列（投資人、股東、未攤銷）：整列都沒填的空白列不送；列序保留畫面順序，從 0 起（規格 rowIndex ≥ 0） */
function buildPlainRows(stateRows: StateRow[], metaByCode: Map<string, MetadataField>): ConfirmRow[] {
  const rows: ConfirmRow[] = [];
  stateRows.forEach((row, index) => {
    const fields = toConfirmFields(metaByCode, row, true);
    if (fields.length > 0) rows.push({ rowIndex: index, fields });
  });
  return rows;
}

const textField = (value: string): ReportField => ({ value, aiFilled: false });

/**
 * 財產目錄的列有三種（ROW_LINE_TYPE，與辨識回傳同一格式）：
 * category 類別標題列（類別編號、名稱，groupKey＝類別編號）、item 明細列、subtotal 小計列（rowKind=SUBTOTAL）。
 * 畫面每一列自己帶類別編號、名稱，送出時依類別（依畫面順序）整理成「類別列 → 明細列… → 小計列」。
 * 沒填的空白明細列、沒有小計金額的小計列不送。
 */
function buildLineTypedRows(stateRows: StateRow[], metaByCode: Map<string, MetadataField>, meta: { tables?: MetadataTable[] }): ConfirmRow[] {
  const groupBy = meta.tables?.find(t => t.rowRepeatable)?.groupBy;
  const groupKeys = typeof groupBy === 'string' ? [groupBy] : (groupBy?.fieldCodes ?? []);
  const keyOf = (row: StateRow) => groupKeys.map(k => String(row[k]?.value ?? '')).join('\u0000');
  const withoutGroup = (row: StateRow) => Object.fromEntries(Object.entries(row).filter(([k]) => !groupKeys.includes(k)));

  // 依分組鍵保持第一次出現的順序：分組欄位空白的明細列（還沒填類別）沿用畫面上的 __group 標記區分
  const groups = new Map<string, { head: StateRow; items: StateRow[]; subtotal?: StateRow }>();
  for (const row of stateRows) {
    const empty = groupKeys.every(k => String(row[k]?.value ?? '') === '');
    const key = empty ? `\u0001${String(row.__group?.value ?? '')}` : keyOf(row);
    const group = groups.get(key) ?? { head: row, items: [] };
    if (row.__kind?.value === 'SUBTOTAL') group.subtotal = row;
    else group.items.push(row);
    groups.set(key, group);
  }

  const rows: ConfirmRow[] = [];
  const push = (row: Omit<ConfirmRow, 'rowIndex'>) => rows.push({ rowIndex: rows.length, ...row });
  for (const group of groups.values()) {
    const categoryFields = toConfirmFields(metaByCode, { ROW_LINE_TYPE: textField('category'), ...Object.fromEntries(groupKeys.map(k => [k, group.head[k]]).filter(([, v]) => v)) }, true);
    const items = group.items.map(row => toConfirmFields(metaByCode, { ROW_LINE_TYPE: textField('item'), ...withoutGroup(row) }, true)).filter(fields => fields.length > 1);
    const subtotalFields = group.subtotal ? toConfirmFields(metaByCode, { ROW_LINE_TYPE: textField('subtotal'), ...withoutGroup(group.subtotal) }, true) : [];
    const hasSubtotal = subtotalFields.some(f => metaByCode.get(f.fieldCode)?.rowKind === 'SUBTOTAL');
    if (categoryFields.length <= 1 && items.length === 0 && !hasSubtotal) continue;
    if (categoryFields.length > 1) push({ groupKey: String(group.head[groupKeys[0]]?.value ?? ''), fields: categoryFields });
    for (const fields of items) push({ fields });
    if (hasSubtotal) push({ rowKind: 'SUBTOTAL', fields: subtotalFields });
  }
  return rows;
}

interface FormSource {
  formCode: SettlementReportId;
  /** state.reports 實際存放資料的 key */
  reportKey: string;
  taxYear: number;
  periodStartMonth?: number;
}

/** 列出需要送出的表：營所稅各表（依組織型態）＋營業稅各期實際使用的 401／403；登記文件與負責人頁不在此 API 範圍 */
function listFormSources(state: InitializationState): FormSource[] {
  // 營運未滿一年沒有申報書：公司資料走 saveInitializationCompany，不送 confirm；
  // 使用者先填過各表再改選「未滿一年」時，殘留的資料也不能送出
  if (state.operatingStatus !== 'over_one_year') return [];

  const openYear = state.openYear ?? getCurrentOpenYear(resolveToday(state.simulatedDate));

  const cit: FormSource[] = FORM_LIST.filter(form => form.taxType === 'cit' && isFormApplicable(form.formCode, state.orgType, { openYear, establishYear: state.establishYear })).map(form => ({
    formCode: form.formCode,
    reportKey: form.formCode,
    taxYear: state.reportYears[form.formCode] ?? getDefaultFormYear(form.formCode, openYear),
  }));

  const vat: FormSource[] = state.reportPages
    .filter(page => page.period)
    .map(page => {
      const { formCode, reportKey } = resolveReportPage(page, state.vatChoices);
      return { formCode, reportKey, taxYear: page.period!.rocYear, periodStartMonth: page.period!.phase };
    });

  return [...cit, ...vat];
}

/**
 * 由畫面狀態組出 POST /ael/peit/cit/confirm 的 forms[]。
 * 欄位型別（valueInt／valueText…）依各表 metadata 的 dataType 決定，所以送出前會取得（或沿用快取的）metadata。
 * 只送有填資料的表；封面一律視為有資料（公司基本資料），其餘表沿用逐頁核對的「有資料」判斷（見 isPageFilled）。
 */
export async function buildConfirmForms(state: InitializationState): Promise<ConfirmForm[]> {
  const sources = listFormSources(state).filter(source => {
    if (source.formCode === 'CIT_COVER') return Object.values(state.reports.CIT_COVER?.fields ?? {}).some(isFilled);
    return isPageFilled(state.reports, source.reportKey);
  });

  return Promise.all(
    sources.map(async source => {
      const formNo = FORM_LIST.find(f => f.formCode === source.formCode)!.formNo;
      const meta = await loadFormMetadata(formNo, source.taxYear);
      const metaByCode = new Map(meta.fields.map(f => [f.fieldCode, f]));
      const report = state.reports[source.reportKey];

      const rows: ConfirmRow[] = metaByCode.has('ROW_LINE_TYPE') ? buildLineTypedRows(report?.rows ?? [], metaByCode, meta) : buildPlainRows(report?.rows ?? [], metaByCode);

      return {
        formCode: source.formCode,
        present: true,
        taxYear: source.taxYear,
        // 營業稅期別 1／3／5…＝所屬起月
        ...(source.periodStartMonth !== undefined && { periodStartMonth: source.periodStartMonth, cmsPhase: source.periodStartMonth }),
        fields: toConfirmFields(metaByCode, report?.fields ?? {}, false, source.formCode === 'CIT_BALANCE_SHEET', collapsedSections(meta.sections ?? [], metaByCode, report?.fields ?? {})),
        rows,
      };
    })
  );
}
