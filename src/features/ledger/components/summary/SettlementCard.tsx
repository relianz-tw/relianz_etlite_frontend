'use client';

import { CHART_COLOR } from '@/components/ui/charts/chartTheme';
import type { DonutSlice } from '@/components/ui/charts/DonutChart';
import { fmtCurrency } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { formatRangeLabel } from '../../summary';
import type { LedgerTotals, Side } from '../../types';
import SummaryCardShell from './SummaryCardShell';

const DonutChart = dynamic(() => import('@/components/ui/charts/DonutChart'), {
  ssr: false,
  loading: () => <div className="h-40 rounded-md bg-surface-cream" />,
});

interface SettlementCardProps {
  side: Side;
  /** 年初至今（ytdRange）的累計狀況，與交易金額卡的 chartRange 區間刻意解耦 */
  totals: LedgerTotals | null;
  /** ytdTotals 涵蓋的區間，供卡片標示資料期間 */
  range: { from: string; to: string };
  loading: boolean;
}

const OUTSTANDING_KEY = 'outstanding';
const SETTLED_KEY = 'settled';
const CARD_TITLE: Record<Side, string> = { sales: '收款狀況', purchase: '付款狀況' };
const OUTSTANDING_LABEL: Record<Side, string> = { sales: '應收帳款', purchase: '應付帳款' };
const SETTLED_LABEL: Record<Side, string> = { sales: '已收款', purchase: '已付款' };

/**
 * 收款／付款狀況：比較年初至今「未結清原單總額」（totals.outstanding）
 * 與「已結清原單總額」（totals.settled）兩個獨立數字，兩者是互斥的兩批單、相加即交易金額，
 * 非同一筆金額拆成的兩半，故不做百分比／扣除運算，直接呈現兩支端點的原始金額。
 * 純呈現卡片，扇形與圖例皆不可點擊。
 */
export default function SettlementCard({ side, totals, range, loading }: SettlementCardProps) {
  const outstanding = totals?.outstanding ?? 0;
  const settled = totals?.settled ?? 0;

  const slices: DonutSlice[] = useMemo(
    () => [
      { key: OUTSTANDING_KEY, label: OUTSTANDING_LABEL[side], value: outstanding, color: CHART_COLOR.semanticError },
      { key: SETTLED_KEY, label: SETTLED_LABEL[side], value: settled, color: CHART_COLOR.semanticSuccess },
    ],
    [side, outstanding, settled],
  );

  return (
    <SummaryCardShell span={3} label={CARD_TITLE[side]} period={formatRangeLabel(range.from, range.to)}>
      {loading ? (
        // 不給固定 height，改由 flex-1 撐滿卡片剩餘高度，避免卡片被同排的 TrendCard 拉高後底部留白
        <div className="min-h-0 flex-1 rounded-md bg-surface-cream" />
      ) : (
        <>
          {/* 手機為 grid-cols-1，卡片各自獨立一列，沒有同排卡片撐高度可繼承，故給固定 h-40（同 loading skeleton）
              避免 DonutChart 的 ResponsiveContainer 量到高度 0 而不渲染；桌機（nav:）維持 flex-1 撐滿同排高度 */}
          <div className="h-40 nav:h-auto nav:min-h-0 nav:flex-1">
            <DonutChart slices={slices} ariaLabel={`${CARD_TITLE[side]}甜甜圈圖`} />
          </div>
          <div className="mt-3 space-y-1.5">
            {slices.map(s => (
              <div key={s.key} className="flex w-full items-center justify-between gap-2 px-1 py-1">
                <span className="flex items-center gap-1.5 text-xs text-neutral-dark">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
                <span className="font-mono text-xs font-semibold tabular-nums text-neutral-dark">{fmtCurrency(s.value)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </SummaryCardShell>
  );
}
