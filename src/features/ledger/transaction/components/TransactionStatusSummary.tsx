import Badge from '@/components/ui/Badge';
import { fmtCurrency } from '@/lib/utils';
import { Bell, Calendar, CircleDollarSign, Landmark, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Side } from '../../types';
import { PURCHASE_STATUS_SUMMARY, SALES_STATUS_SUMMARY } from '../data';

interface StatusRow {
  icon: typeof Bell;
  label: string;
  value: ReactNode;
}

export default function TransactionStatusSummary({ side }: { side: Side }) {
  const rows: StatusRow[] =
    side === 'sales'
      ? [
          {
            icon: Bell,
            label: '申報狀態',
            value: (
              <Badge tone="neutral" variant="muted">
                {SALES_STATUS_SUMMARY.declareStatus}
              </Badge>
            ),
          },
          { icon: Calendar, label: '申報日期', value: SALES_STATUS_SUMMARY.declareDate },
          { icon: Calendar, label: '入帳日期', value: SALES_STATUS_SUMMARY.postedDate },
          { icon: CircleDollarSign, label: '入帳金額', value: fmtCurrency(SALES_STATUS_SUMMARY.postedAmount) },
          { icon: Landmark, label: '手續費', value: fmtCurrency(SALES_STATUS_SUMMARY.fee) },
        ]
      : [
          {
            icon: Bell,
            label: '申報狀態',
            value: (
              <Badge tone="success" variant="muted">
                {PURCHASE_STATUS_SUMMARY.declareStatus}
              </Badge>
            ),
          },
          { icon: Calendar, label: '申報日期', value: PURCHASE_STATUS_SUMMARY.declareDate },
          { icon: Calendar, label: '付款日期', value: PURCHASE_STATUS_SUMMARY.payDate },
          { icon: Wallet, label: '付款金額', value: fmtCurrency(PURCHASE_STATUS_SUMMARY.payAmount) },
        ];

  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-neutral-blue-gray/30 bg-white p-4">
      {rows.map(row => (
        <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 text-neutral-mid">
            <row.icon size={15} className="shrink-0" />
            {row.label}
          </span>
          <span className="font-mono font-semibold tabular-nums text-neutral-dark">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
