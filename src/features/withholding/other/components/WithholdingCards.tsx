'use client';

import Badge from '@/components/ui/Badge';
import { fmtCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { categoryLabel, nhiDeclareStatusText } from '../data';
import type { WithholdingAmountTotals } from '../useWithholdingList';
import type { WithholdingRecord } from '../types';

function rocDate(year: number, month: number, day: number): string {
  return `${year - 1911}/${month}/${day}`;
}

function WithholdingCard({ row, onClick }: { row: WithholdingRecord; onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex cursor-pointer flex-col gap-2 rounded-lg border border-neutral-blue-gray/30 bg-white p-4 hover:border-brand-blue/40">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[15px] font-semibold text-neutral-dark">{row.withholdingId}</span>
          <Badge tone="info">{categoryLabel(row.categoryCode)}</Badge>
        </div>
        <span className="whitespace-nowrap font-mono text-xs text-neutral-mid">{rocDate(row.paymentYear, row.paymentMonth, row.paymentDay)}</span>
      </div>
      <div className="truncate text-[13px] text-neutral-mid">{row.recipientName || '-'}</div>
      <span className="font-mono text-lg font-semibold tabular-nums text-neutral-dark">{fmtCurrency(row.netPayment)}</span>
      <div className="flex justify-between text-xs text-neutral-mid">
        <span>所得金額 {fmtCurrency(row.grossIncome)}</span>
        <span>扣繳稅額 {fmtCurrency(row.withholdingAmount)}</span>
      </div>
      <div className="flex justify-end gap-1.5">
        <Badge tone={row.withholdingPaid ? 'success' : 'neutral'}>{row.withholdingPaid ? '扣繳已繳納' : '扣繳未繳納'}</Badge>
        {row.nhiAmount > 0 && (
          <Badge tone={row.isNhiDeclared ? 'info' : row.nhiPaid ? 'success' : 'neutral'}>
            {row.isNhiDeclared ? nhiDeclareStatusText(row.nhiDeclareStatus) : row.nhiPaid ? '健保已繳納' : '健保未繳納'}
          </Badge>
        )}
      </div>
    </div>
  );
}

interface WithholdingCardsProps {
  rows: WithholdingRecord[];
  loading: boolean;
  yearlyTotalCount: number;
  searchTotals: WithholdingAmountTotals;
  yearlyTotals: WithholdingAmountTotals;
}

export default function WithholdingCards({ rows, loading, yearlyTotalCount, searchTotals, yearlyTotals }: WithholdingCardsProps) {
  const router = useRouter();

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
        rows.map(row => <WithholdingCard key={row.uuid} row={row} onClick={() => router.push(`/withholding/other/${row.uuid}?ic=${row.categoryCode}`)} />)
      )}
    </div>
  );
}
