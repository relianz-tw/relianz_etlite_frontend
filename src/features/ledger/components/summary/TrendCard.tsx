'use client';

import type { LedgerDailyAmount } from '@/api/types';
import { parseRocDate } from '@/components/ui/DatePicker';
import { fmtCurrency } from '@/lib/utils';
import { Maximize2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildTrendPoints, type TrendGranularity } from '../../summary';
import type { Side } from '../../types';
import SummaryCardShell from './SummaryCardShell';

/** 低於此寬度換算每日一根長條會過窄擁擠，改採週檢視；對齊 BarTrendChart 日檢視 maxBarSize=6，純 UI 經驗值 */
const MIN_PX_PER_DAY_BAR = 6;

// Recharts 不含 'use client' 且依賴 ResizeObserver，SSR 階段量到的寬度為 0 會造成 hydration 落差，
// 一律以 ssr:false 動態載入；loading 佔位高度需與圖表一致（160px），避免卡片高度跳動
const BarTrendChart = dynamic(() => import('@/components/ui/charts/BarTrendChart'), {
  ssr: false,
  loading: () => <div className="h-40 rounded-md bg-surface-cream" />,
});

interface TrendCardProps {
  side: Side;
  /** 圖表 X 軸涵蓋的區間（ROC YYY/MM/DD），與列表日期篩選解耦，見 LedgerView 的 chartRange 註解 */
  range: { from: string; to: string };
  /** 目前列表套用的日期篩選；用來標示選取態，無篩選時為 null */
  selectedRange: { from: string; to: string } | null;
  dailyAmounts: LedgerDailyAmount[];
  /** 卡片頂部大數字：來自 filter API 的真實彙總（totals.primary），非圖表資料 */
  primaryAmount: number;
  loading: boolean;
  /** 點長條寫回 dateFrom/dateTo；再點同一根傳 null 代表清除 */
  onRangeSelect: (range: { from: string; to: string } | null) => void;
  detailHref: string;
}

const LABEL: Record<Side, string> = { sales: '代收金額', purchase: '代付金額' };

export default function TrendCard({ side, range, selectedRange, dailyAmounts, primaryAmount, loading, onRangeSelect, detailHref }: TrendCardProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [granularity, setGranularity] = useState<TrendGranularity>('day');

  // 不提供日/週手動切換，改依圖表容器的實際寬度自動決定：容器窄到日檢視長條會過密時改採週檢視
  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    const from = parseRocDate(range.from);
    const to = parseRocDate(range.to);
    const daysCount = from && to ? Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1 : 0;

    const decide = (width: number) => setGranularity(daysCount * MIN_PX_PER_DAY_BAR > width ? 'week' : 'day');

    decide(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width != null) decide(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [range.from, range.to]);

  const points = useMemo(
    () => buildTrendPoints(range.from, range.to, granularity, dailyAmounts),
    [range.from, range.to, granularity, dailyAmounts],
  );

  // 選取態：目前套用的日期篩選（selectedRange）剛好等於某一根柱子的起訖時，該柱視為選取
  const selectedKey = useMemo(() => {
    if (!selectedRange) return null;
    return points.find(p => p.from === selectedRange.from && p.to === selectedRange.to)?.key ?? null;
  }, [points, selectedRange]);

  const label = LABEL[side];

  return (
    <SummaryCardShell
      span={6}
      label={label}
      action={
        <Link href={detailHref} aria-label={`查看${label}詳情`} className="text-neutral-mid hover:text-brand-blue">
          <Maximize2 size={16} />
        </Link>
      }
    >
      <div className="whitespace-nowrap font-mono text-2xl font-semibold tabular-nums text-neutral-dark">{fmtCurrency(primaryAmount)}</div>

      <div className="mb-2 mt-3">
        <span className="text-[11px] text-neutral-mid">
          {points[0]?.label} – {points[points.length - 1]?.label}
        </span>
      </div>

      <div ref={chartContainerRef}>
        {loading ? (
          <div className="h-40 rounded-md bg-surface-cream" />
        ) : (
          <BarTrendChart
            data={points.map(p => ({ key: p.key, label: p.label, value: p.value, tooltipLabel: p.tooltipLabel }))}
            height={160}
            selectedKey={selectedKey}
            onSelect={datum => {
              // BarTrendChart 只認識通用的 key/label/value，起訖日期（from/to）需回頭用 key 反查原始 LedgerTrendPoint
              const point = points.find(p => p.key === datum.key);
              if (point) onRangeSelect(selectedKey === point.key ? null : { from: point.from, to: point.to });
            }}
            maxBarSize={granularity === 'day' ? 6 : 18}
            tickInterval={granularity === 'day' ? 'preserveStartEnd' : undefined}
          />
        )}
      </div>
    </SummaryCardShell>
  );
}
