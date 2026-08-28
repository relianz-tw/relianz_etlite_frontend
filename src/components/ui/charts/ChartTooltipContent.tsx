'use client';

import { fmtCurrency } from '@/lib/utils';

/**
 * Recharts <Tooltip content={...}> 的自訂內容，取代預設樣式以符合 DESIGN.md §11.7。
 * Recharts 依滑鼠位置注入 active/payload/label，型別對第三方庫寬鬆處理（CLAUDE.md 允許公用底層適度使用 any）。
 * 本專案圖表皆為單一數值序列，故只取 payload 第一筆。
 */
interface ChartTooltipContentProps {
  active?: boolean;
  /** payload[0].payload 是 Recharts 回傳的原始資料點，各圖表資料型別皆帶 label，
   *  部分（如趨勢圖的週檢視）另帶 tooltipLabel 表示完整區間敘述，優先顯示 */
  payload?: { value?: number; payload?: { label?: string; tooltipLabel?: string } }[];
  label?: string | number;
  formatValue?: (value: number) => string;
}

export default function ChartTooltipContent({ active, payload, label, formatValue = fmtCurrency }: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const value = entry?.value ?? 0;
  const title = entry?.payload?.tooltipLabel ?? entry?.payload?.label ?? label;

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white px-3 py-2 shadow-level1">
      <div className="text-[11px] text-neutral-mid">{title}</div>
      <div className="font-mono text-[13px] font-semibold tabular-nums text-neutral-dark">{formatValue(value)}</div>
    </div>
  );
}
