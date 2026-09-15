'use client';

import { CHART_COLOR } from '@/components/ui/charts/chartTheme';
import DatePicker, { formatRocDate, parseRocDate } from '@/components/ui/DatePicker';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { fmtCurrency } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { buildTrendPoints, defaultChartRange, type TrendGranularity } from '../summary';
import type { Side } from '../types';
import { useLedgerTrendDetail } from '../useLedgerTrendDetail';
import { resolveLedgerBackHref } from '../urlState';

// Recharts 不含 'use client' 且依賴 ResizeObserver，SSR 階段量到的寬度為 0 會造成 hydration 落差，
// 一律以 ssr:false 動態載入；loading 佔位高度需與圖表一致（224px，DESIGN.md §11.5 詳情頁完整圖規格）
const BarTrendChart = dynamic(() => import('@/components/ui/charts/BarTrendChart'), {
  ssr: false,
  loading: () => <div className="h-56 rounded-md bg-surface-cream" />,
});

const TITLE = '交易金額趨勢';
const OUTSTANDING_LABEL: Record<Side, string> = { sales: '未收', purchase: '未付' };
const SETTLED_LABEL: Record<Side, string> = { sales: '已收', purchase: '已付' };

const GRANULARITY_OPTIONS: { value: TrendGranularity; label: string }[] = [
  { value: 'day', label: '日' },
  { value: 'week', label: '週' },
  { value: 'month', label: '月' },
];

const MAX_BAR_SIZE: Record<TrendGranularity, number> = { day: 6, week: 18, month: 32 };

/** 表格「日期」欄點擊目的地：帶入該桶起訖日期到帳簿列表，並保留原本從帳簿帶進來的其餘篩選條件 */
function buildLedgerRowHref(side: Side, returnQuery: string | undefined, from: string, to: string): string {
  const params = new URLSearchParams(returnQuery);
  params.set('side', side);
  params.set('dateFrom', from);
  params.set('dateTo', to);
  params.delete('page'); // 換日期篩選時重置分頁，避免停在超出新篩選範圍的頁碼
  return `/ledger?${params.toString()}`;
}

interface TrendDetailPageViewProps {
  side: Side;
  /** 帳簿總覽卡片目前的 chartRange（ROC YYY/MM/DD）；缺值時（如直接輸入網址、舊連結）回退預設區間。
   *  預設區間計算需要 formatRocDate，只能在 client component 內呼叫，故不在 page.tsx（Server Component）算好再傳入 */
  range?: { from: string; to: string };
  returnQuery?: string;
}

export default function TrendDetailPageView({ side, range: initialRange, returnQuery }: TrendDetailPageViewProps) {
  const backHref = resolveLedgerBackHref(returnQuery);
  const [range, setRange] = useState(() => initialRange ?? defaultChartRange());
  // 從卡片重新點入（side／區間變動）時同步本地可編輯區間；使用者手動調整後的值不受其他 render 影響
  useEffect(() => {
    if (initialRange) setRange(initialRange);
  }, [side, initialRange?.from, initialRange?.to]);

  const [granularity, setGranularity] = useState<TrendGranularity>('day');

  const { outstandingDaily, settledDaily, loading, error } = useLedgerTrendDetail(side, range);

  const outstandingPoints = useMemo(
    () => buildTrendPoints(range.from, range.to, granularity, outstandingDaily),
    [range.from, range.to, granularity, outstandingDaily],
  );
  const settledPoints = useMemo(
    () => buildTrendPoints(range.from, range.to, granularity, settledDaily),
    [range.from, range.to, granularity, settledDaily],
  );

  // outstandingPoints／settledPoints 由同一組 range/granularity 展開，桶的數量與起訖恆一致，可安全依索引配對
  const rows = useMemo(
    () =>
      outstandingPoints.map((point, i) => {
        const settled = settledPoints[i];
        return {
          key: point.key,
          dateLabel: point.tooltipLabel,
          count: point.count + (settled?.count ?? 0),
          outstanding: point.value,
          settled: settled?.value ?? 0,
          total: point.value + (settled?.value ?? 0),
          from: point.from,
          to: point.to,
        };
      }),
    [outstandingPoints, settledPoints],
  );

  const chartData = useMemo(
    () =>
      outstandingPoints.map((point, i) => ({
        key: point.key,
        label: point.label,
        tooltipLabel: point.tooltipLabel,
        values: { outstanding: point.value, settled: settledPoints[i]?.value ?? 0 },
      })),
    [outstandingPoints, settledPoints],
  );

  const series = [
    { key: 'outstanding', label: OUTSTANDING_LABEL[side], color: CHART_COLOR.semanticError },
    { key: 'settled', label: SETTLED_LABEL[side], color: CHART_COLOR.semanticSuccess },
  ];

  // 圖例／頂部大數字用的區間合計：outstandingDaily／settledDaily 本身已是該 range 的彙總（API body 帶同一區間），直接加總即可
  const outstandingTotal = outstandingDaily.reduce((sum, d) => sum + d.issuedAmount, 0);
  const settledTotal = settledDaily.reduce((sum, d) => sum + d.issuedAmount, 0);
  const transactionTotal = outstandingTotal + settledTotal;

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-mid hover:text-brand-blue">
          <ArrowLeft size={15} />
          返回帳簿
        </Link>

        <div className="mb-5">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">{TITLE}</h1>
        </div>

        <div className="mb-5 flex flex-col gap-3 nav:flex-row nav:items-center nav:justify-between">
          <div className="flex items-center gap-2">
            <DatePicker value={parseRocDate(range.from)} onChange={date => date && setRange(r => ({ ...r, from: formatRocDate(date) }))} placeholder="起" />
            <span className="shrink-0 text-sm text-neutral-mid">–</span>
            <DatePicker value={parseRocDate(range.to)} onChange={date => date && setRange(r => ({ ...r, to: formatRocDate(date) }))} placeholder="迄" />
          </div>
          <div className="w-[200px]">
            <SegmentedControl options={GRANULARITY_OPTIONS} value={granularity} onChange={setGranularity} size="sm" />
          </div>
        </div>

        {error && <div className="mb-5 rounded-md bg-surface-cream p-4 text-center text-sm text-semantic-error">{error}</div>}

        <div className="mb-5 rounded-lg border border-neutral-blue-gray/30 bg-white p-6">
          <div className="mb-1 text-xs font-medium text-neutral-mid">交易金額</div>
          <div className="mb-4 whitespace-nowrap font-mono text-2xl font-semibold tabular-nums text-neutral-dark">{fmtCurrency(transactionTotal)}</div>

          <div className="mb-4 flex flex-wrap items-center gap-4">
            {series.map(s => (
              <span key={s.key} className="inline-flex items-center gap-1.5 text-sm text-neutral-dark">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}：{fmtCurrency(s.key === 'outstanding' ? outstandingTotal : settledTotal)}
              </span>
            ))}
          </div>

          {loading ? (
            <div className="h-56 rounded-md bg-surface-cream" />
          ) : (
            <BarTrendChart
              data={chartData}
              series={series}
              height={224}
              maxBarSize={MAX_BAR_SIZE[granularity]}
              tickInterval={granularity === 'day' ? 'preserveStartEnd' : undefined}
              ariaLabel={`交易金額趨勢堆疊長條圖，依${OUTSTANDING_LABEL[side]}／${SETTLED_LABEL[side]}分段`}
            />
          )}
        </div>

        <div className="max-h-[480px] overflow-y-auto rounded-md border border-neutral-blue-gray/30 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead className="sticky top-0 bg-surface-off-white">
                <tr className="border-b border-neutral-blue-gray/40">
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid">日期</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-neutral-mid">筆數</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-neutral-mid">{OUTSTANDING_LABEL[side]}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-neutral-mid">{SETTLED_LABEL[side]}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-neutral-mid">交易金額</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.key} className="border-b border-neutral-blue-gray/20 last:border-0 hover:bg-brand-blue/5">
                    <td className="whitespace-nowrap px-4 py-2.5 text-sm text-neutral-dark">
                      <Link href={buildLedgerRowHref(side, returnQuery, row.from, row.to)} className="hover:text-brand-blue hover:underline">
                        {row.dateLabel}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm tabular-nums text-neutral-dark">
                      {row.count.toLocaleString('en-US')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm tabular-nums text-neutral-dark">{fmtCurrency(row.outstanding)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm tabular-nums text-neutral-dark">{fmtCurrency(row.settled)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm font-semibold tabular-nums text-neutral-dark">{fmtCurrency(row.total)}</td>
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
