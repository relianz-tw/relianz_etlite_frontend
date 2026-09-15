'use client';

import { useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { useLedgerSummary } from '../useLedgerSummary';
import type { Side } from '../types';
import { withReturnParam } from '../urlState';
import ChannelShareCard from './summary/ChannelShareCard';
import SettlementCard from './summary/SettlementCard';
import TrendCard from './summary/TrendCard';

const CARD_COUNT = 3;

interface SummaryCardsProps {
  side: Side;
  /** 圖表 X 軸涵蓋的區間（ROC YYY/MM/DD），與列表日期篩選解耦，見 LedgerView 的 chartRange 註解 */
  chartRange: { from: string; to: string };
  /** 收款／付款狀況卡涵蓋的區間（年初至今，恆定），見 LedgerView 的 ytdRange 註解 */
  ytdRange: { from: string; to: string };
  /** 目前列表套用的日期篩選；用來標示卡片 A 的選取態，無篩選時為 null */
  selectedRange: { from: string; to: string } | null;
  channelUuid: string | null;
  onRangeSelect: (range: { from: string; to: string } | null) => void;
  onChannelSelect: (uuid: string | null) => void;
}

/**
 * 桌機三卡並列（12 欄 grid：6/3/3），手機單欄堆疊（DESIGN.md §11.5）。
 * 三張卡的數字（交易金額趨勢／管道佔比／收款·付款狀況）皆由 useLedgerSummary 統一抓取，僅隨
 * side + chartRange + ytdRange 變動，不吃列表子分頁／篩選；收款·付款狀況卡本身不可點擊篩選，
 * 不需要 onSubTabSelect。
 */
export default function SummaryCards({ side, chartRange, ytdRange, selectedRange, channelUuid, onRangeSelect, onChannelSelect }: SummaryCardsProps) {
  const searchParams = useSearchParams();
  const { dailyAmounts, shares, totals, ytdTotals, loading } = useLedgerSummary(side, chartRange, ytdRange);
  // rangeFrom/rangeTo 帶入目前卡片的 chartRange：chartRange 不一定存在於網址上（如點長條圖選取時
  // 會跳過同步，見 LedgerView 的 skipChartRangeSyncRef 註解），故詳情頁的區間須由此明確傳遞，不可依賴 URL 重新推導
  const detailQuery = new URLSearchParams({ side, rangeFrom: chartRange.from, rangeTo: chartRange.to });
  const detailHref = withReturnParam(`/ledger/trend?${detailQuery.toString()}`, searchParams);

  // 行動版三卡改橫向 snap 捲動，一次一張；用捲動位置換算目前頁碼，供下方指示點顯示與跳頁（DESIGN.md §11.13）
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none px-4 nav:mx-0 nav:grid nav:grid-cols-12 nav:overflow-visible nav:px-0"
      >
        <TrendCard
          side={side}
          range={chartRange}
          selectedRange={selectedRange}
          dailyAmounts={dailyAmounts}
          primaryAmount={totals?.transaction ?? 0}
          loading={loading}
          onRangeSelect={onRangeSelect}
          detailHref={detailHref}
        />
        <ChannelShareCard side={side} shares={shares} range={chartRange} loading={loading} selectedUuid={channelUuid} onSelect={onChannelSelect} />
        <SettlementCard side={side} totals={ytdTotals} range={ytdRange} loading={loading} />
      </div>

      {/* 頁面指示點：僅行動版顯示，桌機為 12 欄並列不需要 */}
      <div className="mt-2 flex justify-center gap-1.5 nav:hidden">
        {Array.from({ length: CARD_COUNT }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`第 ${i + 1} 張圖表`}
            onClick={() => scrollToIndex(i)}
            className="relative h-6 w-6 before:absolute before:inset-0"
          >
            <span
              className={`absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                activeIndex === i ? 'bg-brand-blue' : 'bg-neutral-blue-gray'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
