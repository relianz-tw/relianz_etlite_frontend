'use client';

import Badge from '@/components/ui/Badge';
import { fmtCurrency } from '@/lib/utils';
import Link from 'next/link';
import type { LaborRecord } from '../types';

function rocDate(year: number, month: number, day: number): string {
  return `${year - 1911}/${month}/${day}`;
}

export default function LaborCards({ rows }: { rows: LaborRecord[] }) {
  if (rows.length === 0) {
    return <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid nav:hidden">此期間沒有更多的資料了</div>;
  }

  return (
    <div className="flex flex-col gap-3 nav:hidden">
      {rows.map(row => (
        <Link key={row.uuid} href={`/withholding/labor/${row.uuid}?ic=${row.serviceType}`} className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="font-semibold text-neutral-dark">{row.name}</span>
            <Badge tone={row.signStatus === 1 ? 'success' : 'neutral'}>{row.signStatus === 1 ? '已簽署' : '未簽署'}</Badge>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
            <span className="text-neutral-mid">專案名稱</span>
            <span className="truncate text-right font-medium text-neutral-dark">{row.serviceName}</span>
            <span className="text-neutral-mid">總金額</span>
            <span className="text-right font-mono tabular-nums text-neutral-dark">{fmtCurrency(row.payableAmount)}</span>
            <span className="text-neutral-mid">扣繳稅金</span>
            <span className="text-right font-mono tabular-nums text-neutral-dark">{fmtCurrency(row.withholdingTax)}</span>
            <span className="text-neutral-mid">勞務付款日期</span>
            <span className="text-right font-mono text-neutral-dark">{rocDate(row.paymentYear, row.paymentMonth, row.paymentDay)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
