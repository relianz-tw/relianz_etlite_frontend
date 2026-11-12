/** 欄位標籤字級：名稱太長時縮小一級，換行後仍整齊 */
export function fieldLabelClass(label: string): string {
  return label.length > 14 ? 'text-xs' : 'text-[13px]';
}

/** 欄位標籤的共用寬度與換行樣式：手機標籤獨佔一行（輸入框在下方全寬），桌機與輸入框同一行並共用寬度 */
export const FIELD_LABEL_BASE = 'w-full break-words nav:w-[var(--label-w,max(12%,5.5rem))] nav:shrink-0 font-medium leading-snug text-neutral-dark';

/**
 * 一個區塊內所有標籤的共同寬度：依最長標籤的字數決定（中文一字約一個字級寬），
 * 標籤不換行、輸入框左緣又能上下切齊；區塊裡沒有標籤時回 undefined 沿用預設寬度。
 */
export function labelWidthFor(labels: string[]): string | undefined {
  if (labels.length === 0) return undefined;
  const em = Math.max(...labels.map(l => [...l].reduce((sum, ch) => sum + (ch.charCodeAt(0) > 255 ? 1 : 0.6), 0)));
  return `${Math.ceil(em * 13) + 4}px`;
}
