'use client';

import Badge from '@/components/ui/Badge';
import { fmtCurrency } from '@/lib/utils';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { categoryLabel } from '../data';
import type { WithholdingGroupRow } from '../types';
import { buildGroupHref } from '../urlState';
import type { WithholdingAmountTotals } from '../useWithholdingList';

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark';
const COLS = 9;

/** 期間顯示：同一月份只顯示一個月，跨月顯示「first-last月」 */
function periodLabel(first: number, last: number): string {
  return first === last ? `${first} 月` : `${first}-${last} 月`;
}

interface WithholdingSummaryTableProps {
  rows: WithholdingGroupRow[];
  loading: boolean;
  yearlyTotalCount: number;
  searchTotals: WithholdingAmountTotals;
  yearlyTotals: WithholdingAmountTotals;
}

export default function WithholdingSummaryTable({ rows, loading, yearlyTotalCount, searchTotals, yearlyTotals }: WithholdingSummaryTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="hidden overflow-x-auto rounded-md border border-neutral-blue-gray/30 bg-white nav:block">
      <table className="w-full min-w-[960px] border-collapse">
        <thead className="bg-surface-off-white">
          <tr className="border-b border-neutral-blue-gray/40">
            <th className={thClass}>所得人</th>
            <th className={thClass}>類別</th>
            <th className={thClass}>期間</th>
            <th className={`${thClass} text-right`}>筆數</th>
            <th className={`${thClass} text-right`}>所得金額</th>
            <th className={`${thClass} text-right`}>扣繳稅額</th>
            <th className={`${thClass} text-right`}>二代健保</th>
            <th className={`${thClass} text-right`}>支付金額</th>
            <th className={thClass}>繳款狀態</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={COLS} className="px-4 py-10 text-center text-sm text-neutral-mid">
                載入中...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COLS} className="px-4 py-10 text-center text-sm text-neutral-mid">
                此期間沒有更多的資料了
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={`${row.categoryCode}-${row.groupKey}`}
                onClick={() => router.push(buildGroupHref(row.groupKey, row.categoryCode, pathname, searchParams))}
                className={`cursor-pointer border-b border-neutral-blue-gray/20 last:border-0 hover:bg-brand-blue/5 ${
                  i % 2 === 1 ? 'bg-surface-warm/30' : ''
                }`}
              >
                <td className={`${tdClass} truncate`}>{row.recipientName || '-'}</td>
                <td className={tdClass}>
                  <Badge tone="info">{categoryLabel(row.categoryCode)}</Badge>
                </td>
                <td className={`${tdClass} font-mono`}>{periodLabel(row.firstPaymentMonth, row.lastPaymentMonth)}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>{row.recordCount}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>{fmtCurrency(row.grossIncome)}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>{fmtCurrency(row.withholdingAmount)}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>{row.nhiAmount > 0 ? fmtCurrency(row.nhiAmount) : '-'}</td>
                <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(row.netPayment)}</td>
                <td className={tdClass}>
                  <Badge tone={row.unremitWithholdingCount > 0 ? 'neutral' : 'success'}>
                    {row.unremitWithholdingCount > 0 ? `${row.unremitWithholdingCount} 筆未繳納` : '已繳納'}
                  </Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-neutral-blue-gray/40 bg-surface-off-white">
            <td className={`${tdClass} text-neutral-mid`} colSpan={4}>
              本次搜尋加總
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(searchTotals.incomeAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(searchTotals.withholdingAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(searchTotals.nhiAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(searchTotals.netPayment)}</td>
            <td className={tdClass} />
          </tr>
          <tr className="border-t border-neutral-blue-gray/20 bg-surface-off-white">
            <td className={`${tdClass} text-neutral-mid`} colSpan={4}>
              年度加總 <span className="font-semibold text-neutral-dark">{yearlyTotalCount}</span> 筆
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(yearlyTotals.incomeAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(yearlyTotals.withholdingAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(yearlyTotals.nhiAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(yearlyTotals.netPayment)}</td>
            <td className={tdClass} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
