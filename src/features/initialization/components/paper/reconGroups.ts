import type { ReportSectionItem } from '../../reports/types';

/**
 * 營業收入調節說明的加項／減項分組（metadata 只有 groupCode，沒有標題文字，所以標題寫在這裡）。
 * 69（相差）＝ 01 － 68：大於 0 只需要加項、小於 0 只需要減項，用不到的那組預設折疊，使用者仍可展開填寫；
 * 兩組的欄位一律顯示，不依 visibleWhen 隱藏。
 */
export const RECON_DIFF_FIELD = 'INC_69';

export const RECON_GROUPS: Record<string, { label: string; collapseWhen: (diff: number) => boolean }> = {
  RECON_ADD: { label: '加項', collapseWhen: diff => diff < 0 },
  RECON_SUB: { label: '減項', collapseWhen: diff => diff > 0 },
};

/** 一個內容項目所屬的分組代碼（只有金額列、輸入欄、勾選欄看得出分組） */
export function itemGroupCode(item: ReportSectionItem): string | undefined {
  switch (item.kind) {
    case 'amountRows':
      return item.rows[0]?.main.groupCode;
    case 'inputs':
    case 'checks':
      return item.fields[0]?.groupCode;
    default:
      return undefined;
  }
}

/** 金額列內混了不同分組時拆開，讓每個項目只屬於一個分組 */
export function splitItemsByGroup(items: ReportSectionItem[]): ReportSectionItem[] {
  return items.flatMap(item => {
    if (item.kind !== 'amountRows') return [item];
    const runs: ReportSectionItem[] = [];
    for (const row of item.rows) {
      const last = runs[runs.length - 1];
      if (last?.kind === 'amountRows' && last.rows[0].main.groupCode === row.main.groupCode) last.rows.push(row);
      else runs.push({ kind: 'amountRows', rows: [row] });
    }
    return runs;
  });
}
