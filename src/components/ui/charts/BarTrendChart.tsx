'use client';

import { fmtCurrency } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import ChartTooltipContent from './ChartTooltipContent';
import { AXIS_TICK_STYLE, CHART_ANIMATION, CHART_COLOR, DIMMED_OPACITY, GRID_STROKE } from './chartTheme';

export interface BarTrendDatum {
  /** 唯一值，同時作為 selectedKey 比對與 React key；元件不解讀其內容 */
  key: string;
  /** X 軸顯示文字（呼叫端已格式化完成，元件不做日期轉換） */
  label: string;
  value: number;
  /** tooltip 標題用的完整敘述（如「115/03/21 – 115/03/27」）；未提供時 tooltip 退回顯示 label */
  tooltipLabel?: string;
}

interface BarTrendChartProps {
  data: BarTrendDatum[];
  /** 容器高度（px）。ResponsiveContainer 需要祖先有確定高度，故一律由呼叫端指定數值，不使用 h-full */
  height?: number;
  /** 被選取的 key；有值時其餘長條降至 DIMMED_OPACITY */
  selectedKey?: string | null;
  /** 點擊回呼。熱區為整個類別欄位（<Bar background> 產生的透明全高矩形），而非細長條本身，
   *  避免日檢視下出現過窄的點擊目標（DESIGN.md §11.11 熱區需求）。
   *  ⚠️ 刻意不用 <BarChart onClick> 讀 activeIndex：recharts 原始碼有已知未修復問題
   *  （mouseEventsMiddleware.js 註解 "there's a bug here when you click the chart the
   *  activeIndex resets to zero"），點擊時序不穩會固定選到第一筆。改用 <Bar onClick>
   *  直接從被點擊的圖形元素取得 index，不受此限制。 */
  onSelect?: (datum: BarTrendDatum, index: number) => void;
  color?: string;
  /** 長條最大寬度：日檢視建議較小、週檢視建議較大 */
  maxBarSize?: number;
  formatValue?: (value: number) => string;
  /** X 軸刻度密度；日檢視資料點多時建議 'preserveStartEnd'，不給則全部標示 */
  tickInterval?: number | 'preserveStartEnd';
  emptyText?: string;
}

export default function BarTrendChart({
  data,
  height = 160,
  selectedKey = null,
  onSelect,
  color = CHART_COLOR.brandBlue,
  maxBarSize = 10,
  formatValue = fmtCurrency,
  tickInterval,
  emptyText = '此區間尚無資料',
}: BarTrendChartProps) {
  if (data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-[13px] text-neutral-mid">
        {emptyText}
      </div>
    );
  }

  const hasSelection = selectedKey != null;

  return (
    <div style={{ height }} className="min-w-0" role="img" aria-label="趨勢長條圖，可點擊柱狀套用該日或該週的日期篩選">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} interval={tickInterval} />
          <Tooltip cursor={{ fill: CHART_COLOR.surfaceCream }} content={<ChartTooltipContent formatValue={formatValue} />} />
          <Bar
            dataKey="value"
            maxBarSize={maxBarSize}
            radius={[2, 2, 0, 0]}
            isAnimationActive={CHART_ANIMATION}
            cursor={onSelect ? 'pointer' : undefined}
            background={onSelect ? { fill: 'transparent' } : undefined}
            onClick={
              onSelect &&
              ((_, index) => {
                if (data[index]) onSelect(data[index], index);
              })
            }
          >
            {data.map(d => (
              <Cell key={d.key} fill={color} fillOpacity={hasSelection && d.key !== selectedKey ? DIMMED_OPACITY : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
