'use client';

import { fmtCurrency } from '@/lib/utils';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartTooltipContent from './ChartTooltipContent';
import { CHART_ANIMATION, DIMMED_OPACITY } from './chartTheme';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  /** 固定高度（px）；不給則以 h-full 撐滿外層容器高度（外層需為有明確高度的 flex 容器） */
  height?: number;
  /** 甜甜圈中央文字：上為 label、下為 value；不給則中央留白 */
  centerLabel?: string;
  centerValue?: string;
  selectedKey?: string | null;
  onSelect?: (slice: DonutSlice, index: number) => void;
  formatValue?: (value: number) => string;
  /** slices 為空或總和為 0 時顯示；Recharts 在總和為 0 時畫不出任何扇形，故元件自行判斷 */
  emptyText?: string;
  className?: string;
  /** role="img" 的簡述文字，依呼叫端實際資料內容客製（如「入帳狀況」「銷售管道佔比」） */
  ariaLabel?: string;
}

export default function DonutChart({
  slices,
  height,
  centerLabel,
  centerValue,
  selectedKey = null,
  onSelect,
  formatValue = fmtCurrency,
  emptyText = '尚無資料',
  className = '',
  ariaLabel = '甜甜圈圖，可點擊扇形套用篩選',
}: DonutChartProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const sizeStyle = height != null ? { height } : undefined;
  const sizeClass = height != null ? '' : 'h-full';

  if (slices.length === 0 || total <= 0) {
    return (
      <div style={sizeStyle} className={`flex items-center justify-center text-[13px] text-neutral-mid ${sizeClass} ${className}`}>
        {emptyText}
      </div>
    );
  }

  const hasSelection = selectedKey != null;

  return (
    <div style={sizeStyle} className={`relative min-w-0 ${sizeClass} ${className}`} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltipContent formatValue={formatValue} />} />
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="100%"
            paddingAngle={slices.length > 1 ? 2 : 0}
            isAnimationActive={CHART_ANIMATION}
            cursor={onSelect ? 'pointer' : undefined}
            onClick={(_, index) => {
              const slice = slices[index];
              if (onSelect && slice) onSelect(slice, index);
            }}
          >
            {slices.map(s => (
              <Cell key={s.key} fill={s.color} fillOpacity={hasSelection && s.key !== selectedKey ? DIMMED_OPACITY : 1} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerLabel && <span className="text-[11px] text-neutral-mid">{centerLabel}</span>}
          {centerValue && <span className="font-mono text-sm font-semibold tabular-nums text-neutral-dark">{centerValue}</span>}
        </div>
      )}
    </div>
  );
}
