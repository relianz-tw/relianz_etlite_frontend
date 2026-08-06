'use client';

import StatCard from '@/components/ui/StatCard';
import TrendChart from '@/components/ui/TrendChart';
import { fmtCurrency } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { PURCHASE_DAILY, SALES_DAILY } from '../data';
import type { LedgerTotals, Side } from '../types';
import { withReturnParam } from '../urlState';

// 桌面版卡片有足夠寬度，趨勢圖預設顯示「日」；手機版卡片較窄，預設顯示「週」避免 62 根柱子擠爆
// 趨勢圖（SALES_DAILY／PURCHASE_DAILY）目前無對應後端 API，暫維持既有假資料，僅頂部 KPI 數字改為真實彙總值
function buildCards(side: Side, totals: LedgerTotals | null, chartDefaultView: 'day' | 'week', searchParams: ReturnType<typeof useSearchParams>) {
  const dailyData = side === 'sales' ? SALES_DAILY : PURCHASE_DAILY;
  const chart = <TrendChart data={dailyData} defaultView={chartDefaultView} />;
  const primary = totals?.primary ?? 0;
  const settled = totals?.settled ?? 0;
  const outstanding = totals?.outstanding ?? 0;

  return side === 'sales'
    ? [
        {
          label: '已開立發票金額',
          value: fmtCurrency(primary),
          chart,
          detailHref: withReturnParam('/ledger/trend?side=sales', searchParams),
        },
        { label: '已入帳金額', value: fmtCurrency(settled), valueClassName: 'text-semantic-success', caption: '平均收款週期 7 天' },
        { label: '應收帳款', value: fmtCurrency(outstanding), valueClassName: 'text-semantic-error', caption: '平均收款週期 7 天' },
      ]
    : [
        {
          label: '已收取憑證金額',
          value: fmtCurrency(primary),
          chart,
          detailHref: withReturnParam('/ledger/trend?side=purchase', searchParams),
        },
        { label: '已付款金額', value: fmtCurrency(settled), valueClassName: 'text-semantic-success', caption: '平均付款週期 7 天' },
        { label: '應付金額', value: fmtCurrency(outstanding), valueClassName: 'text-semantic-error', caption: '平均付款週期 7 天' },
      ];
}

export default function SummaryCards({ side, totals }: { side: Side; totals: LedgerTotals | null }) {
  const searchParams = useSearchParams();
  const desktopCards = buildCards(side, totals, 'day', searchParams);
  const mobileCards = buildCards(side, totals, 'week', searchParams);

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
