'use client';

import StatCard from '@/components/ui/StatCard';
import TrendChart from '@/components/ui/TrendChart';
import { fmtCurrency } from '@/lib/utils';
import { PURCHASE_DAILY, SALES_DAILY } from '../data';
import type { Side } from '../types';

const SALES_TOTALS = { issued: 999462582, settled: 850000000, outstanding: 149462582 };
const PURCHASE_TOTALS = { received: 999462582, paid: 850000000, payable: 149462582 };

// 桌面版卡片有足夠寬度，趨勢圖預設顯示「日」；手機版卡片較窄，預設顯示「週」避免 62 根柱子擠爆
function buildCards(side: Side, chartDefaultView: 'day' | 'week') {
  const dailyData = side === 'sales' ? SALES_DAILY : PURCHASE_DAILY;
  const chart = <TrendChart data={dailyData} defaultView={chartDefaultView} />;

  return side === 'sales'
    ? [
        { label: '已開立發票金額', value: fmtCurrency(SALES_TOTALS.issued), chart },
        { label: '已入帳金額', value: fmtCurrency(SALES_TOTALS.settled), valueClassName: 'text-semantic-success', caption: '平均收款週期 7 天' },
        { label: '應收帳款', value: fmtCurrency(SALES_TOTALS.outstanding), valueClassName: 'text-semantic-error', caption: '平均收款週期 7 天' },
      ]
    : [
        { label: '已收取憑證金額', value: fmtCurrency(PURCHASE_TOTALS.received), chart },
        { label: '已付款金額', value: fmtCurrency(PURCHASE_TOTALS.paid), valueClassName: 'text-semantic-success', caption: '平均付款週期 7 天' },
        { label: '應付金額', value: fmtCurrency(PURCHASE_TOTALS.payable), valueClassName: 'text-semantic-error', caption: '平均付款週期 7 天' },
      ];
}

export default function SummaryCards({ side }: { side: Side }) {
  const desktopCards = buildCards(side, 'day');
  const mobileCards = buildCards(side, 'week');

  return (
    <>
      <div className="hidden gap-3 nav:flex">
        {desktopCards.map(c => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>
      <div className="nav:hidden">
        <StatCard {...mobileCards[0]} />
      </div>
    </>
  );
}
