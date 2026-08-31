'use client';

import type { DonutSlice } from '@/components/ui/charts/DonutChart';
import { fmtCurrency } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { ChannelShareDatum } from '../../summary';
import type { Side } from '../../types';
import SummaryCardShell from './SummaryCardShell';

const DonutChart = dynamic(() => import('@/components/ui/charts/DonutChart'), {
  ssr: false,
  loading: () => <div className="h-40 rounded-md bg-surface-cream" />,
});

interface ChannelShareCardProps {
  side: Side;
  /** 已經 Top4 + 其他、已配色的最終資料（見 src/features/ledger/summary.ts buildTopShares） */
  shares: ChannelShareDatum[];
  loading: boolean;
  selectedUuid: string | null;
  /** 點「其他」不觸發（見 ChannelShareDatum.selectable）；再點同一項傳 null 清除 */
  onSelect: (uuid: string | null) => void;
}

const LABEL: Record<Side, string> = { sales: '銷售管道佔比', purchase: '廠商佔比' };

export default function ChannelShareCard({ side, shares, loading, selectedUuid, onSelect }: ChannelShareCardProps) {
  const slices: DonutSlice[] = useMemo(() => shares.map(s => ({ key: s.uuid, label: s.label, value: s.value, color: s.color })), [shares]);

  const handleSelect = (slice: DonutSlice) => {
    const share = shares.find(s => s.uuid === slice.key);
    if (!share?.selectable) return;
    onSelect(share.uuid === selectedUuid ? null : share.uuid);
  };

  return (
    <SummaryCardShell span={3} label={LABEL[side]}>
      {loading ? (
        // 不給固定 height，改由 flex-1 撐滿卡片剩餘高度，避免卡片被同排的 TrendCard 拉高後底部留白
        <div className="min-h-0 flex-1 rounded-md bg-surface-cream" />
      ) : (
        <>
          {/* 手機為 grid-cols-1，卡片各自獨立一列，沒有同排卡片撐高度可繼承，故給固定 h-40（同 loading skeleton）
              避免 DonutChart 的 ResponsiveContainer 量到高度 0 而不渲染；桌機（nav:）維持 flex-1 撐滿同排高度 */}
          <div className="h-40 nav:h-auto nav:min-h-0 nav:flex-1">
            <DonutChart slices={slices} selectedKey={selectedUuid} onSelect={handleSelect} ariaLabel={`${LABEL[side]}甜甜圈圖，可點擊扇形套用篩選`} />
          </div>
          {/* 文字圖例即互動入口（DESIGN.md §11.8/§11.11）：扇形無法 tab focus，<button> 提供鍵盤可及的等效操作 */}
          <div className="mt-3 space-y-1.5">
            {shares.map(s => {
              const selected = selectedUuid === s.uuid;
              return (
                <button
                  key={s.uuid}
                  type="button"
                  disabled={!s.selectable}
                  onClick={() => handleSelect({ key: s.uuid, label: s.label, value: s.value, color: s.color })}
                  className={`flex w-full items-center justify-between gap-2 rounded-sm px-1 py-1 text-left transition-opacity ${
                    s.selectable ? 'hover:bg-surface-cream' : 'cursor-default'
                  } ${selectedUuid !== null && !selected ? 'opacity-40' : ''}`}
                >
                  <span className="flex min-w-0 items-center gap-1.5 text-xs text-neutral-dark">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="truncate">{s.label}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-neutral-dark">{fmtCurrency(s.value)}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </SummaryCardShell>
  );
}
