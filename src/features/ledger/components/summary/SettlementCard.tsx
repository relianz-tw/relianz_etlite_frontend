'use client';

import { CHART_COLOR } from '@/components/ui/charts/chartTheme';
import type { DonutSlice } from '@/components/ui/charts/DonutChart';
import { fmtCurrency } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { LedgerTotals, Side } from '../../types';
import SummaryCardShell from './SummaryCardShell';

const DonutChart = dynamic(() => import('@/components/ui/charts/DonutChart'), {
  ssr: false,
  loading: () => <div className="h-40 rounded-md bg-surface-cream" />,
});

interface SettlementCardProps {
  side: Side;
  totals: LedgerTotals | null;
  loading: boolean;
}

const PRIMARY_KEY = 'primary';
const COLLECTED_KEY = 'collected';
/** 對齊 TrendCard 大數字的標籤（同一 totals.primary 欄位），讓兩張卡的數字語意一致 */
const PRIMARY_LABEL: Record<Side, string> = { sales: '已開立發票金額', purchase: '已收取憑證金額' };
const COLLECTED_LABEL: Record<Side, string> = { sales: '已收款金額', purchase: '已付款金額' };

/**
 * 入帳狀況：比較同一區間內「開立／收到憑證總額」（totals.primary，transaction_date 口徑）
 * 與「已收／已付總額」（totals.collected，entry_date 口徑）兩個獨立數字，非同一筆金額拆成的兩半，
 * 故不做百分比／扣除運算，直接呈現兩支端點的原始金額。純呈現卡片，扇形與圖例皆不可點擊。
 */
export default function SettlementCard({ side, totals, loading }: SettlementCardProps) {
  const primary = totals?.primary ?? 0;
  const collected = totals?.collected ?? 0;

  const slices: DonutSlice[] = useMemo(
    () => [
      { key: PRIMARY_KEY, label: PRIMARY_LABEL[side], value: primary, color: CHART_COLOR.semanticError },
      { key: COLLECTED_KEY, label: COLLECTED_LABEL[side], value: collected, color: CHART_COLOR.semanticSuccess },
    ],
    [side, primary, collected],
  );

  return (
    <SummaryCardShell span={3} label="入帳狀況">
      {loading ? (
        // 不給固定 height，改由 flex-1 撐滿卡片剩餘高度，避免卡片被同排的 TrendCard 拉高後底部留白
        <div className="min-h-0 flex-1 rounded-md bg-surface-cream" />
      ) : (
        <>
          {/* 手機為 grid-cols-1，卡片各自獨立一列，沒有同排卡片撐高度可繼承，故給固定 h-40（同 loading skeleton）
              避免 DonutChart 的 ResponsiveContainer 量到高度 0 而不渲染；桌機（nav:）維持 flex-1 撐滿同排高度 */}
          <div className="h-40 nav:h-auto nav:min-h-0 nav:flex-1">
            <DonutChart slices={slices} ariaLabel="入帳狀況甜甜圈圖" />
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
