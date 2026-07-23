'use client';

import TrendDetailView from '@/components/ui/TrendDetailView';
import { fmtCurrency } from '@/lib/utils';
import { PURCHASE_TREND, TAX_TREND } from '../data';

export default function TrendDetailPageView() {
  const rows = TAX_TREND.map((point, i) => {
    const purchase = PURCHASE_TREND[i].value;
    return {
      date: point.date,
      sales: fmtCurrency(point.value),
      purchase: fmtCurrency(purchase),
      estimated: fmtCurrency(point.value - purchase),
    };
  });

  return (
    <TrendDetailView
      title="銷項發票金額趨勢"
      subtitle="營業稅中心"
      backHref="/business-tax"
      series={[
        { key: 'sales', label: '本期銷項發票金額', color: 'blue', data: TAX_TREND },
        { key: 'purchase', label: '本期進項發票金額', color: 'tan', data: PURCHASE_TREND },
      ]}
      table={{
        columns: [
          { key: 'date', label: '日期' },
          { key: 'sales', label: '銷項金額', align: 'right' },
          { key: 'purchase', label: '進項金額', align: 'right' },
          { key: 'estimated', label: '預估營業稅額', align: 'right' },
        ],
        rows,
      }}
    />
  );
}
