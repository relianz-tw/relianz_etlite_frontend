import type { ReportFieldDef } from './types';

/** 金額欄 → 稅額欄的配對規則：銷售額／金額欄名尾端換成 _TAX（小計列同理 _SUM 前面換） */
const PAIR_RULES: [RegExp, string][] = [
  [/_SALES$/, '_TAX'],
  [/_AMT$/, '_TAX'],
  [/_SALES_SUM$/, '_TAX_SUM'],
  [/_AMT_SUM$/, '_TAX_SUM'],
];

/** 圈號 ①–⑳，紙本用來在公式裡指稱合計欄（如 ⑨＋⑩） */
export const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';

/** 欄位名稱尾端的「(1)」「(12)」是圈號標記；「(1)+(3)」這類公式說明不是，不處理 */
function splitMarker(label: string): { text: string; marker?: string } {
  const match = /\((\d{1,2})\)$/.exec(label);
  if (!match || label.includes(')+(')) return { text: label };
  const n = Number(match[1]);
  return { text: label.slice(0, match.index), marker: n >= 1 && n <= CIRCLED.length ? CIRCLED[n - 1] : `(${n})` };
}

/** 「統一發票扣抵聯－進貨及費用金額」→ 群組「統一發票扣抵聯」、項目「進貨及費用」；沒有「－」則無群組 */
function splitLabel(label: string): { group?: string; leaf: string; fullLeaf: string; marker?: string } {
  const { text, marker } = splitMarker(label);
  const dash = text.search(/[－]/);
  const group = dash > 0 ? text.slice(0, dash) : undefined;
  const fullLeaf = dash > 0 ? text.slice(dash + 1) : text;
  return { group, leaf: fullLeaf.replace(/(銷售額|金額|稅額)$/, '') || fullLeaf, fullLeaf, marker };
}

export interface VatRow {
  main: ReportFieldDef;
  /** 同一列的稅額欄 */
  tax?: ReportFieldDef;
  group?: string;
  leaf: string;
  markers: [string | undefined, string | undefined];
}

/** 把區塊欄位配成「金額｜稅額」列，並解析群組與圈號 */
export function buildRows(fields: ReportFieldDef[]): { rows: VatRow[]; hasPairs: boolean } {
  const byKey = new Map(fields.map(f => [f.key, f]));
  const consumed = new Set<string>();
  const rows: VatRow[] = [];
  for (const field of fields) {
    if (consumed.has(field.key)) continue;
    let tax: ReportFieldDef | undefined;
    for (const [pattern, replacement] of PAIR_RULES) {
      if (!pattern.test(field.key)) continue;
      tax = byKey.get(field.key.replace(pattern, replacement));
      if (tax && tax !== field) break;
      tax = undefined;
    }
    if (tax) consumed.add(tax.key);
    const { group, leaf, fullLeaf, marker } = splitLabel(field.label);
    // 欄名後綴（金額／稅額）只在成對或群組列去掉，由欄標題表示；單獨的欄位（如「已納稅額」）保留完整名稱
    rows.push({ main: field, tax, group, leaf: tax || group ? leaf : fullLeaf, markers: [marker, tax ? splitLabel(tax.label).marker : undefined] });
  }
  return { rows, hasPairs: rows.some(r => r.tax) };
}

/** 成對欄位的欄標題：金額欄名以 _AMT 結尾（進項）為「金額」，其餘（銷項）為「銷售額」 */
export function pairHeads(rows: VatRow[]): [string, string] {
  return rows.find(r => r.tax)?.main.key.endsWith('_AMT') ? ['金額', '稅額'] : ['銷售額', '稅額'];
}
