'use client';

import { useSearchParams } from 'next/navigation';
import { useLedgerSummary } from '../useLedgerSummary';
import type { Side } from '../types';
import { withReturnParam } from '../urlState';
import ChannelShareCard from './summary/ChannelShareCard';
import SettlementCard from './summary/SettlementCard';
import TrendCard from './summary/TrendCard';

interface SummaryCardsProps {
  side: Side;
  /** 圖表 X 軸涵蓋的區間（ROC YYY/MM/DD），與列表日期篩選解耦，見 LedgerView 的 chartRange 註解 */
  chartRange: { from: string; to: string };
  /** 目前列表套用的日期篩選；用來標示卡片 A 的選取態，無篩選時為 null */
  selectedRange: { from: string; to: string } | null;
  channelUuid: string | null;
  onRangeSelect: (range: { from: string; to: string } | null) => void;
  onChannelSelect: (uuid: string | null) => void;
}

/**
 * 桌機三卡並列（12 欄 grid：6/3/3），手機單欄堆疊（DESIGN.md §11.5）。
 * 三張卡的數字（趨勢大數字／入帳狀況／管道佔比）皆由 useLedgerSummary 統一抓取一次，僅隨
 * side + chartRange 變動，不吃列表子分頁／篩選；入帳狀況卡本身不可點擊篩選，不需要 onSubTabSelect。
 */
export default function SummaryCards({ side, chartRange, selectedRange, channelUuid, onRangeSelect, onChannelSelect }: SummaryCardsProps) {
  const searchParams = useSearchParams();
  const { dailyAmounts, shares, totals, loading } = useLedgerSummary(side, chartRange);
  const detailHref = withReturnParam(`/ledger/trend?side=${side}`, searchParams);

  return (
    <div className="grid grid-cols-1 gap-3 nav:grid-cols-12">
      <TrendCard
        side={side}
        range={chartRange}
        selectedRange={selectedRange}
        dailyAmounts={dailyAmounts}
        primaryAmount={totals?.primary ?? 0}
        loading={loading}
        onRangeSelect={onRangeSelect}
        detailHref={detailHref}
      />
      <SettlementCard side={side} totals={totals} loading={loading} />
      <ChannelShareCard side={side} shares={shares} loading={loading} selectedUuid={channelUuid} onSelect={onChannelSelect} />
    </div>
  );
}
