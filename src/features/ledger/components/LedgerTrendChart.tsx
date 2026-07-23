'use client';

import { useMemo, useState } from 'react';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { fmtCurrency, type DailyPoint } from '../data';

type ChartView = 'day' | 'week';

interface TrendPoint {
  label: string;
  rangeLabel: string;
  value: number;
}

// 以 7 天為一組，將每日資料聚合成週資料（最後一組可能不足 7 天）
function toWeekly(daily: DailyPoint[]): TrendPoint[] {
  const weeks: TrendPoint[] = [];
  for (let i = 0; i < daily.length; i += 7) {
    const slice = daily.slice(i, i + 7);
    const value = slice.reduce((sum, p) => sum + p.value, 0);
    const rangeLabel = slice.length > 1 ? `${slice[0].date}–${slice[slice.length - 1].date}` : slice[0].date;
    weeks.push({ label: slice[0].date, rangeLabel, value });
  }
  return weeks;
}

export default function LedgerTrendChart({ data, defaultView }: { data: DailyPoint[]; defaultView: ChartView }) {
  const [view, setView] = useState<ChartView>(defaultView);
  const weekly = useMemo(() => toWeekly(data), [data]);

  const points: TrendPoint[] =
    view === 'day' ? data.map(p => ({ label: p.date, rangeLabel: p.date, value: p.value })) : weekly;
  const max = Math.max(...points.map(p => p.value));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-neutral-mid">
          {data[0].date} – {data[data.length - 1].date}
        </span>
        <SegmentedControl
          options={[
            { value: 'day', label: '日' },
            { value: 'week', label: '週' },
          ]}
          value={view}
          onChange={setView}
          size="sm"
          className="w-[100px]"
        />
      </div>
      <div className={`flex h-10 items-end overflow-x-auto ${view === 'day' ? 'gap-[2px]' : 'gap-1.5'}`}>
        {points.map((p, i) => {
          const ratio = max ? p.value / max : 0;
          return (
            <div
              key={i}
              title={`${p.rangeLabel}：${fmtCurrency(p.value)}`}
              className={`shrink-0 rounded-t-sm bg-brand-blue ${view === 'day' ? 'w-1' : 'w-4 flex-1'}`}
              style={{ height: `${Math.max(ratio * 100, 8)}%`, opacity: 0.28 + ratio * 0.62 }}
            />
          );
        })}
      </div>
    </div>
  );
}
