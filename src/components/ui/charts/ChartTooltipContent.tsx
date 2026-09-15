'use client';

import { fmtCurrency } from '@/lib/utils';

/**
 * Recharts <Tooltip content={...}> 的自訂內容，取代預設樣式以符合 DESIGN.md §11.7。
 * Recharts 依滑鼠位置注入 active/payload/label，型別對第三方庫寬鬆處理（CLAUDE.md 允許公用底層適度使用 any）。
 * 多數圖表為單一數值序列，只取 payload 第一筆；堆疊長條圖（BarTrendChart 的 series 模式）
 * payload 會有多筆，改列出各序列＋加總（DESIGN.md §11.2 堆疊長條圖）。
 */
interface ChartTooltipContentProps {
  active?: boolean;
  /** payload[0].payload 是 Recharts 回傳的原始資料點，各圖表資料型別皆帶 label，
   *  部分（如趨勢圖的週檢視）另帶 tooltipLabel 表示完整區間敘述，優先顯示。
   *  name/color 由 <Bar name={...} fill={...}> 帶出，僅堆疊模式會用到 */
  payload?: { value?: number; name?: string; color?: string; payload?: { label?: string; tooltipLabel?: string } }[];
  label?: string | number;
  formatValue?: (value: number) => string;
}

export default function ChartTooltipContent({ active, payload, label, formatValue = fmtCurrency }: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;
  const title = payload[0]?.payload?.tooltipLabel ?? payload[0]?.payload?.label ?? label;

  if (payload.length === 1) {
    return (
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white px-3 py-2 shadow-level1">
        <div className="text-[11px] text-neutral-mid">{title}</div>
        <div className="font-mono text-[13px] font-semibold tabular-nums text-neutral-dark">{formatValue(payload[0]?.value ?? 0)}</div>
      </div>
    );
  }

  const total = payload.reduce((sum, p) => sum + (p.value ?? 0), 0);
  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white px-3 py-2 shadow-level1">
      <div className="mb-1 text-[11px] text-neutral-mid">{title}</div>
      <div className="space-y-0.5">
        {payload.map(p => (
          <div key={p.name} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-1.5 text-neutral-dark">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </span>
            <span className="font-mono font-semibold tabular-nums text-neutral-dark">{formatValue(p.value ?? 0)}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 border-t border-neutral-blue-gray/20 pt-1 text-[13px]">
        <span className="text-neutral-mid">交易金額</span>
        <span className="font-mono font-semibold tabular-nums text-neutral-dark">{formatValue(total)}</span>
      </div>
    </div>
  );
}
