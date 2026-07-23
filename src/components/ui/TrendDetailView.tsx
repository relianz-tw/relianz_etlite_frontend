'use client';

import SegmentedControl from '@/components/ui/SegmentedControl';
import { fmtCurrency, type DailyPoint } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type Granularity = 'day' | 'week' | 'month';
type SeriesColor = 'blue' | 'tan';

interface AggPoint {
  label: string;
  rangeLabel: string;
  value: number;
}

interface TrendSeries {
  key: string;
  label: string;
  color: SeriesColor;
  data: DailyPoint[];
}

interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
}

interface TrendDetailViewProps {
  title: string;
  subtitle: string;
  backHref: string;
  series: TrendSeries[];
  table: {
    columns: TableColumn[];
    rows: Record<string, ReactNode>[];
  };
}

const COLOR_CLASS: Record<SeriesColor, string> = {
  blue: 'bg-brand-blue',
  tan: 'bg-brand-tan',
};
const LEGEND_DOT_CLASS: Record<SeriesColor, string> = {
  blue: 'bg-brand-blue',
  tan: 'bg-brand-tan',
};

// 週：每 7 天一組加總；月：依日期字串（M/D）的月份分組加總 —— 資料集不跨年度，故不處理跨年
function aggregate(daily: DailyPoint[], granularity: Granularity): AggPoint[] {
  if (granularity === 'day') return daily.map(p => ({ label: p.date, rangeLabel: p.date, value: p.value }));

  if (granularity === 'week') {
    const weeks: AggPoint[] = [];
    for (let i = 0; i < daily.length; i += 7) {
      const slice = daily.slice(i, i + 7);
      const value = slice.reduce((sum, p) => sum + p.value, 0);
      const rangeLabel = slice.length > 1 ? `${slice[0].date}–${slice[slice.length - 1].date}` : slice[0].date;
      weeks.push({ label: slice[0].date, rangeLabel, value });
    }
    return weeks;
  }

  const byMonth = new Map<string, DailyPoint[]>();
  daily.forEach(p => {
    const month = p.date.split('/')[0];
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(p);
  });
  return [...byMonth.entries()].map(([month, points]) => ({
    label: `${month}月`,
    rangeLabel: `${points[0].date}–${points[points.length - 1].date}`,
    value: points.reduce((sum, p) => sum + p.value, 0),
  }));
}

function TrendBars({ series, granularity }: { series: TrendSeries[]; granularity: Granularity }) {
  const aggregated = useMemo(() => series.map(s => ({ ...s, points: aggregate(s.data, granularity) })), [series, granularity]);
  const max = Math.max(...aggregated.flatMap(s => s.points.map(p => p.value)));
  const bucketCount = aggregated[0]?.points.length ?? 0;

  return (
    <div className="flex h-56 items-end gap-2 overflow-x-auto pb-1">
      {Array.from({ length: bucketCount }).map((_, i) => (
        <div key={i} className="flex h-full shrink-0 items-end gap-0.5">
          {aggregated.map(s => {
            const p = s.points[i];
            const ratio = max ? p.value / max : 0;
            return (
              <div
                key={s.key}
                title={`${s.label} ${p.rangeLabel}：${fmtCurrency(p.value)}`}
                className={`w-3 rounded-t-sm ${COLOR_CLASS[s.color]}`}
                style={{ height: `${Math.max(ratio * 100, 4)}%`, opacity: 0.35 + ratio * 0.65 }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function TrendDetailView({ title, subtitle, backHref, series, table }: TrendDetailViewProps) {
  const [granularity, setGranularity] = useState<Granularity>('day');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 py-7 nav:px-7">
        <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-mid hover:text-brand-blue">
          <ArrowLeft size={15} />
          返回{subtitle}
        </Link>

        <div className="mb-6">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">{title}</h1>
        </div>

        <div className="mb-5 rounded-lg border border-neutral-blue-gray/30 bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              {series.map(s => (
                <span key={s.key} className="inline-flex items-center gap-1.5 text-sm text-neutral-dark">
                  <span className={`h-2.5 w-2.5 rounded-full ${LEGEND_DOT_CLASS[s.color]}`} />
                  {s.label}
                </span>
              ))}
            </div>
            <div className="w-[180px]">
              <SegmentedControl
                options={[
                  { value: 'day', label: '日' },
                  { value: 'week', label: '週' },
                  { value: 'month', label: '月' },
                ]}
                value={granularity}
                onChange={setGranularity}
                size="sm"
              />
            </div>
          </div>
          <TrendBars series={series} granularity={granularity} />
        </div>

        <div className="max-h-[480px] overflow-y-auto rounded-md border border-neutral-blue-gray/30 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse">
            <thead className="sticky top-0 bg-surface-off-white">
              <tr className="border-b border-neutral-blue-gray/40">
                {table.columns.map(c => (
                  <th
                    key={c.key}
                    className={`whitespace-nowrap px-4 py-3 text-xs font-semibold text-neutral-mid ${c.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i} className="border-b border-neutral-blue-gray/20 last:border-0">
                  {table.columns.map(c => (
                    <td
                      key={c.key}
                      className={`whitespace-nowrap px-4 py-2.5 font-mono text-sm text-neutral-dark tabular-nums ${c.align === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      {row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}
