'use client';

import Badge from '@/components/ui/Badge';
import { fmtCurrency } from '@/lib/utils';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { categoryLabel } from '../data';
import type { WithholdingGroupRow } from '../types';
import { buildGroupHref } from '../urlState';
import type { WithholdingAmountTotals } from '../useWithholdingList';

function periodLabel(first: number, last: number): string {
  return first === last ? `${first} 月` : `${first}-${last} 月`;
}

function WithholdingSummaryCard({ row, onClick }: { row: WithholdingGroupRow; onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex cursor-pointer flex-col gap-2 rounded-lg border border-neutral-blue-gray/30 bg-white p-4 hover:border-brand-blue/40">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[15px] font-semibold text-neutral-dark">{row.recipientName || '-'}</span>
          <Badge tone="info">{categoryLabel(row.categoryCode)}</Badge>
        </div>
        <span className="whitespace-nowrap font-mono text-xs text-neutral-mid">{periodLabel(row.firstPaymentMonth, row.lastPaymentMonth)}</span>
      </div>
      <div className="text-[13px] text-neutral-mid">共 {row.recordCount} 筆</div>
      <span className="font-mono text-lg font-semibold tabular-nums text-neutral-dark">{fmtCurrency(row.netPayment)}</span>
      <div className="flex justify-between text-xs text-neutral-mid">
        <span>所得金額 {fmtCurrency(row.grossIncome)}</span>
        <span>扣繳稅額 {fmtCurrency(row.withholdingAmount)}</span>
      </div>
      <div className="flex justify-end">
        <Badge tone={row.unremitWithholdingCount > 0 ? 'neutral' : 'success'}>
          {row.unremitWithholdingCount > 0 ? `${row.unremitWithholdingCount} 筆未繳納` : '已繳納'}
        </Badge>
      </div>
    </div>
  );
}

interface WithholdingSummaryCardsProps {
  rows: WithholdingGroupRow[];
  loading: boolean;
  yearlyTotalCount: number;
  searchTotals: WithholdingAmountTotals;
  yearlyTotals: WithholdingAmountTotals;
}

export default function WithholdingSummaryCards({ rows, loading, yearlyTotalCount, searchTotals, yearlyTotals }: WithholdingSummaryCardsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToGroup = (row: WithholdingGroupRow) => router.push(buildGroupHref(row.groupKey, row.categoryCode, pathname, searchParams));

  return (
    <div className="flex flex-col gap-2.5 nav:hidden">
      <div className="sticky top-16 z-40 flex flex-col gap-0.5 rounded-md border border-neutral-blue-gray/30 bg-white p-4 text-sm text-neutral-mid">
        <span className="whitespace-nowrap">
          本次搜尋加總 <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(searchTotals.netPayment)}</span>
        </span>
        <span className="whitespace-nowrap">
          年度加總 <span className="font-semibold text-neutral-dark">{yearlyTotalCount}</span> 筆{' '}
          <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(yearlyTotals.netPayment)}</span>
        </span>
      </div>

      {loading ? (
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中...</div>
      ) : rows.length === 0 ? (
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">此期間沒有更多的資料了</div>
      ) : (
        rows.map(row => <WithholdingSummaryCard key={`${row.categoryCode}-${row.groupKey}`} row={row} onClick={() => goToGroup(row)} />)
      )}
    </div>
  );
}
