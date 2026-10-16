import { BALANCE_BLOCKS } from './balanceSheetLayout';
import type { ReportPageDef } from './types';
import type { ReportField } from '../state/initializationReducer';

/** 資產負債表區塊（sectionCode）→ /ael/initialization/openbook 期初餘額 API 分組 */
const SECTION_GROUP: Record<string, 'assets' | 'liabilities' | 'equity'> = {
  [BALANCE_BLOCKS.currentAssets.sectionKey]: 'assets',
  [BALANCE_BLOCKS.nonCurrentAssets.sectionKey]: 'assets',
  [BALANCE_BLOCKS.currentLiabilities.sectionKey]: 'liabilities',
  [BALANCE_BLOCKS.nonCurrentLiabilities.sectionKey]: 'liabilities',
  [BALANCE_BLOCKS.equity.sectionKey]: 'equity',
};

/**
 * 由資產負債表 metadata（GET /ael/peit/form/metadata）產生期初餘額 payload，供 Step5Confirm 送出。
 * 只送明細科目：排除小計／合計、區塊小計欄位，以及底下還有子科目的父科目，避免與明細重複計入。
 * 科目清單全部來自 metadata，後端增減科目時不需改前端。
 */
export function toOpeningBalancePayload(balanceSheetFields: Record<string, ReportField>, page: ReportPageDef | null) {
  const payload = { assets: {} as Record<string, number>, liabilities: {} as Record<string, number>, equity: {} as Record<string, number> };
  if (!page) return payload;

  const subtotalKeys = new Set<string>(Object.values(BALANCE_BLOCKS).map(block => block.subtotalKey));
  const allFields = page.sections.flatMap(section => section.fields);
  const parentKeys = new Set(allFields.flatMap(field => (field.parentKey ? [field.parentKey] : [])));

  for (const section of page.sections) {
    const group = SECTION_GROUP[section.key];
    if (!group) continue;
    for (const field of section.fields) {
      if (field.type !== 'money' || field.isSubtotal || subtotalKeys.has(field.key) || parentKeys.has(field.key)) continue;
      payload[group][field.key] = Number(balanceSheetFields[field.key]?.value) || 0;
    }
  }
  return payload;
}
