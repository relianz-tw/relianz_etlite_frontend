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
  /** 未提供 series 時（單一序列）讀取此欄位 */
  value?: number;
  /** 提供 series 時，各序列的值依 series.key 對應存於此 */
  values?: Record<string, number>;
  /** tooltip 標題用的完整敘述（如「115/03/21 – 115/03/27」）；未提供時 tooltip 退回顯示 label */
  tooltipLabel?: string;
}

/** 堆疊長條圖的單一序列定義（DESIGN.md §11.2 堆疊長條圖），上限 2 段（見 §11.4 語意色使用規則） */
export interface BarTrendSeries {
  key: string;
  label: string;
  color: string;
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
  /** 單一序列（不給 series 時）的顏色 */
  color?: string;
  /** 提供時改為堆疊長條圖，data 需改讀 values[series.key]，不再讀 value */
  series?: BarTrendSeries[];
  /** 長條最大寬度：日檢視建議較小、週檢視建議較大 */
  maxBarSize?: number;
  formatValue?: (value: number) => string;
  /** X 軸刻度密度；日檢視資料點多時建議 'preserveStartEnd'，不給則全部標示 */
  tickInterval?: number | 'preserveStartEnd';
  emptyText?: string;
  ariaLabel?: string;
}

export default function BarTrendChart({
  data,
  height = 160,
  selectedKey = null,
  onSelect,
  color = CHART_COLOR.brandBlue,
  series,
  maxBarSize = 10,
  formatValue = fmtCurrency,
  tickInterval,
  emptyText = '此區間尚無資料',
  ariaLabel = '趨勢長條圖，可點擊柱狀套用該日或該週的日期篩選',
}: BarTrendChartProps) {
  if (data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-[13px] text-neutral-mid">
        {emptyText}
      </div>
    );
  }

  const hasSelection = selectedKey != null;
  // 堆疊模式：<BarChart> 讀不到巢狀的 values，攤平成 chartData[series.key] = 數值，供各 <Bar dataKey> 對應
  const chartData = series ? data.map(d => ({ ...d, ...d.values })) : data;

  return (
    <div style={{ height }} className="min-w-0" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} interval={tickInterval} />
          <Tooltip cursor={{ fill: CHART_COLOR.surfaceCream }} content={<ChartTooltipContent formatValue={formatValue} />} />
          {series ? (
            series.map((s, seriesIndex) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="stack"
                fill={s.color}
                maxBarSize={maxBarSize}
                radius={seriesIndex === series.length - 1 ? [2, 2, 0, 0] : undefined}
                isAnimationActive={CHART_ANIMATION}
                cursor={onSelect ? 'pointer' : undefined}
                background={seriesIndex === 0 && onSelect ? { fill: 'transparent' } : undefined}
                onClick={
                  onSelect &&
                  ((_, index) => {
                    if (data[index]) onSelect(data[index], index);
                  })
                }
              >
                {data.map(d => (
                  <Cell key={d.key} fillOpacity={hasSelection && d.key !== selectedKey ? DIMMED_OPACITY : 1} />
                ))}
              </Bar>
            ))
          ) : (
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
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
