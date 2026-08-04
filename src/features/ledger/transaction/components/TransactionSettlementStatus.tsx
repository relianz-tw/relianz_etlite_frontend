import type { EntryDetailEntryDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import { fmtCurrency } from '@/lib/utils';
import { CircleDollarSign, Scale, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatusRow {
  icon: typeof Scale;
  label: string;
  value: ReactNode;
}

type BadgeTone = 'success' | 'error' | 'info' | 'neutral';

/** entry.settlementStatus：0平衡 1超沖 2少沖；未知值一律顯示中性樣式，避免畫面出錯 */
const SETTLEMENT_STATUS_BADGE: Record<number, { label: string; tone: BadgeTone }> = {
  0: { label: '平衡', tone: 'success' },
  1: { label: '超沖', tone: 'error' },
  2: { label: '少沖', tone: 'info' },
};

export default function TransactionSettlementStatus({ entry }: { entry: EntryDetailEntryDto }) {
  const statusBadge = SETTLEMENT_STATUS_BADGE[entry.settlementStatus] ?? { label: '未知狀態', tone: 'neutral' as const };

  const rows: StatusRow[] = [
    { icon: CircleDollarSign, label: '已沖金額', value: fmtCurrency(entry.settledAmount) },
    { icon: Wallet, label: '未沖金額', value: fmtCurrency(entry.remainingAmount) },
    {
      icon: Scale,
      label: '沖帳狀態',
      value: (
        <Badge tone={statusBadge.tone} variant="muted">
          {statusBadge.label}
        </Badge>
      ),
    },
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
