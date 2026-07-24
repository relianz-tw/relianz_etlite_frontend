'use client';

import TrendDetailView from '@/components/ui/TrendDetailView';
import { fmtCurrency } from '@/lib/utils';
import { PURCHASE_DAILY, SALES_DAILY } from '../data';
import type { Side } from '../types';

const SIDE_CONFIG: Record<Side, { title: string; label: string }> = {
  sales: { title: '已開立發票金額趨勢', label: '已開立發票金額' },
  purchase: { title: '已收取憑證金額趨勢', label: '已收取憑證金額' },
};

export default function TrendDetailPageView({ side }: { side: Side }) {
  const { title, label } = SIDE_CONFIG[side];
  const data = side === 'sales' ? SALES_DAILY : PURCHASE_DAILY;
  const rows = data.map(point => ({ date: point.date, amount: fmtCurrency(point.value) }));

  return (
    <TrendDetailView
      title={title}
      subtitle="帳簿"
      backHref="/ledger"
      series={[{ key: 'amount', label, color: 'blue', data }]}
      table={{
        columns: [
          { key: 'date', label: '日期' },
          { key: 'amount', label, align: 'right' },
        ],
        rows,
      }}
    />
  );
}
