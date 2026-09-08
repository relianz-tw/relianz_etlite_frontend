'use client';

import StatCard from '@/components/ui/StatCard';
import { fmtCurrency } from '@/lib/utils';

interface Props {
  totalCount: number;
  totalOriginalAmount: number;
  totalRemainingAmount: number;
}

export default function FixedAssetsSummaryCards({ totalCount, totalOriginalAmount, totalRemainingAmount }: Props) {
  const cards = [
    { label: '資產總數', value: `${totalCount} 項` },
    { label: '原始總值', value: fmtCurrency(totalOriginalAmount) },
    { label: '剩餘可扣抵總額', value: fmtCurrency(totalRemainingAmount), valueClassName: 'text-brand-blue' },
  ];

  return (
    <>
      <div className="hidden gap-3 nav:flex">
        {cards.map(c => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>
      <div className="nav:hidden">
        <StatCard {...cards[2]} />
      </div>
    </>
  );
}
