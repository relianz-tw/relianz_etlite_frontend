'use client';

import type { VatPeriodSummaryDto } from '@/api/types';
import StatCard from '@/components/ui/StatCard';
import { fmtCurrency } from '@/lib/utils';

/** summary 為 null 時（查詢進行中）三張卡皆顯示 $0 佔位，避免殘留上一次查詢的數字 */
function buildCards(summary: VatPeriodSummaryDto | null) {
  return [
    { label: '本期銷項發票金額', value: fmtCurrency(summary?.outputInvoiceAmountTotal ?? 0) },
    { label: '本期進項發票金額', value: fmtCurrency(summary?.inputInvoiceAmountTotal ?? 0), valueClassName: 'text-semantic-success' },
    {
      label: '本期預估營業稅金額',
      value: fmtCurrency(summary?.businessTaxTotal ?? 0),
      valueClassName: 'text-semantic-error',
      caption: '銷項稅額 − 進項稅額（後端計算）',
    },
  ];
}

export default function SummaryCards({ summary }: { summary: VatPeriodSummaryDto | null }) {
  const cards = buildCards(summary);

  return (
    <>
      <div className="hidden gap-3 nav:flex">
        {cards.map(c => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>
      <div className="nav:hidden">
        <StatCard {...cards[0]} />
      </div>
    </>
  );
}
