import Badge from '@/components/ui/Badge';
import { Bell, Calendar, CircleDollarSign, Landmark } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Side } from '../../types';

interface StatusRow {
  icon: typeof Bell;
  label: string;
  value: ReactNode;
}

/** 交易明細 API 目前只提供 invoice 區塊，entry 的入帳/付款金額等無對應資料，先標記尚未串接 */
const NOT_WIRED_BADGE = (
  <Badge tone="neutral" variant="muted">
    尚未串接
  </Badge>
);

/** 申報狀態對應 API declared（1 已申報、2 未申報），已於 mapInvoiceDetailToForm 解碼為 boolean */
function declaredBadge(declared: boolean) {
  return declared ? (
    <Badge tone="success" variant="muted">
      已申報
    </Badge>
  ) : (
    <Badge tone="neutral" variant="muted">
      未申報
    </Badge>
  );
}

export default function TransactionStatusSummary({
  side,
  declarePeriod,
  declared,
}: {
  side: Side;
  declarePeriod: string;
  declared: boolean;
}) {
  const rows: StatusRow[] =
    side === 'sales'
      ? [
          { icon: Bell, label: '申報狀態', value: declaredBadge(declared) },
          { icon: Calendar, label: '申報期間', value: declarePeriod },
          { icon: Calendar, label: '入帳日期', value: NOT_WIRED_BADGE },
          { icon: CircleDollarSign, label: '入帳金額', value: NOT_WIRED_BADGE },
          { icon: Landmark, label: '手續費', value: NOT_WIRED_BADGE },
        ]
      : [
          { icon: Bell, label: '申報狀態', value: declaredBadge(declared) },
          { icon: Calendar, label: '申報期間', value: declarePeriod },
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
