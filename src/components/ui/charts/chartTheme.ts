/**
 * 圖表色票與常數，供 src/components/ui/charts/ 底下所有 Recharts 圖表共用（見 DESIGN.md §11）。
 * Recharts 的 fill/stroke 是 SVG presentation attribute，不吃 Tailwind className，
 * 故以 CSS 變數字串集中管理；新增顏色請先在 globals.css / DESIGN.md 定義，勿在此寫死 hex。
 * 注意 globals.css 的變數名與 tailwind.config.js 的 token 名不完全一致
 * （--color-success ↔ semantic-success、--color-light-blue-gray ↔ neutral-blue-gray），
 * 本檔以 Tailwind 命名為準做一層對照，呼叫端只需記這裡的名字。
 */
export const CHART_COLOR = {
  brandBlue: 'var(--color-brand-blue)',
  brandBlueLight: 'var(--color-brand-blue-light)',
  brandTan: 'var(--color-brand-tan)',
  brandTanDark: 'var(--color-brand-tan-dark)',
  semanticSuccess: 'var(--color-success)',
  semanticError: 'var(--color-error)',
  semanticInfo: 'var(--color-info)',
  neutralDark: 'var(--color-dark)',
  neutralMid: 'var(--color-mid)',
  neutralBlueGray: 'var(--color-light-blue-gray)',
  surfaceCream: 'var(--color-surface-cream)',
  white: 'var(--color-white)',
} as const;

/**
 * 類別型序列配色順序（DESIGN.md §11.3）：藍系為主 → teal → 棕系 accent → 中性灰收尾。
 * 單一圖表最多 5 段，符合 DESIGN.md §9「Don't mix too many accent colors」。
 */
export const CATEGORICAL_SERIES: readonly string[] = [
  CHART_COLOR.brandBlue,
  CHART_COLOR.brandBlueLight,
  CHART_COLOR.semanticInfo,
  CHART_COLOR.brandTan,
  CHART_COLOR.brandTanDark,
];

/** 「其他」／「未指定」彙總項專用色，永遠不參與 CATEGORICAL_SERIES 輪替 */
export const OTHER_SERIES_COLOR = CHART_COLOR.neutralBlueGray;

export const AXIS_TICK_STYLE = { fill: CHART_COLOR.neutralMid, fontSize: 11 } as const;
export const GRID_STROKE = CHART_COLOR.surfaceCream;

/** 有選取項時，未選取項降至此不透明度（DESIGN.md §11.9） */
export const DIMMED_OPACITY = 0.3;

/** 所有圖表統一關閉進場動畫（DESIGN.md §11.12）：篩選條件變動頻繁，重播動畫會顯得雜亂 */
export const CHART_ANIMATION = false;
