'use client';

import StatCard from '@/components/ui/StatCard';
import TrendChart from '@/components/ui/TrendChart';
import { fmtCurrency } from '@/lib/utils';
import { ESTIMATED_TAX_TOTAL, PURCHASE_INVOICE_TOTAL, SALES_INVOICE_TOTAL, TAX_TREND } from '../data';

// 桌機版卡片有足夠寬度，趨勢圖預設顯示「日」；手機版僅顯示第一張卡（比照帳簿），趨勢圖顯示「週」
function buildCards(chartDefaultView: 'day' | 'week') {
  return [
    {
      label: '本期銷項發票金額',
      value: fmtCurrency(SALES_INVOICE_TOTAL),
      chart: <TrendChart data={TAX_TREND} defaultView={chartDefaultView} />,
      detailHref: '/business-tax/trend',
    },
    { label: '本期進項發票金額', value: fmtCurrency(PURCHASE_INVOICE_TOTAL), valueClassName: 'text-semantic-success', caption: '銷售額 / 1.05' },
    {
      label: '本期預估營業稅金額',
      value: fmtCurrency(ESTIMATED_TAX_TOTAL),
      valueClassName: 'text-semantic-error',
      caption: '銷項營業稅額 - 進項營業稅額 = 預估營業稅額',
    },
  ];
}

export default function SummaryCards() {
  const desktopCards = buildCards('day');
  const mobileCards = buildCards('week');

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
