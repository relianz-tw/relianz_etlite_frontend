'use client';

import Badge from '@/components/ui/Badge';
import { Ban, CalendarDays, Scale } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatusRow {
  icon: typeof Scale;
  label: string;
  value: ReactNode;
}

interface InvoiceDeclareStatusCardProps {
  /** 申報期間顯示字串，如 "115 年 01 - 02 月份" */
  declarePeriod: string;
  declared: boolean;
  isVoid: boolean;
}

/** 營業稅中心憑證細節頁的「申報狀態」卡片：取代帳簿交易細節頁的沖帳狀態卡，
 *  版型比照 TransactionSettlementStatus 上半部（icon/label 左、值右），無可展開區塊。 */
export default function InvoiceDeclareStatusCard({ declarePeriod, declared, isVoid }: InvoiceDeclareStatusCardProps) {
  const rows: StatusRow[] = [
    { icon: CalendarDays, label: '申報期別', value: declarePeriod || '—' },
    {
      icon: Scale,
      label: '申報狀態',
      value: (
        <Badge tone={declared ? 'success' : 'neutral'} variant="muted">
          {declared ? '已申報' : '未申報'}
        </Badge>
      ),
    },
    {
      icon: Ban,
      label: '是否作廢',
      value: (
        <Badge tone={isVoid ? 'error' : 'success'} variant="muted">
          {isVoid ? '已作廢' : '無'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-4">
      <div className="flex flex-col gap-2.5">
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
    </div>
  );
}
