'use client';

import Badge from '@/components/ui/Badge';
import { fmtCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { categoryLabel, nhiDeclareStatusText } from '../data';
import type { WithholdingAmountTotals } from '../useWithholdingList';
import type { WithholdingRecord } from '../types';

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark';
const COLS = 11;

function rocDate(year: number, month: number, day: number): string {
  return `${year - 1911}/${month}/${day}`;
}

interface WithholdingTableProps {
  rows: WithholdingRecord[];
  loading: boolean;
  yearlyTotalCount: number;
  searchTotals: WithholdingAmountTotals;
  yearlyTotals: WithholdingAmountTotals;
}

export default function WithholdingTable({ rows, loading, yearlyTotalCount, searchTotals, yearlyTotals }: WithholdingTableProps) {
  const router = useRouter();

  return (
    <div className="hidden overflow-x-auto rounded-md border border-neutral-blue-gray/30 bg-white nav:block">
      <table className="w-full min-w-[1080px] border-collapse">
        <thead className="bg-surface-off-white">
          <tr className="border-b border-neutral-blue-gray/40">
            <th className={thClass}>編號</th>
            <th className={thClass}>類別</th>
            <th className={thClass}>所得人</th>
            <th className={thClass}>所得所屬</th>
            <th className={thClass}>支付日期</th>
            <th className={`${thClass} text-right`}>所得金額</th>
            <th className={`${thClass} text-right`}>扣繳稅額</th>
            <th className={`${thClass} text-right`}>二代健保</th>
            <th className={`${thClass} text-right`}>支付金額</th>
            <th className={thClass}>繳款狀態</th>
            <th className={thClass}>二代健保狀態</th>
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
                key={row.uuid}
                onClick={() => router.push(`/withholding/other/${row.uuid}?ic=${row.categoryCode}`)}
                className={`cursor-pointer border-b border-neutral-blue-gray/20 last:border-0 hover:bg-brand-blue/5 ${
                  i % 2 === 1 ? 'bg-surface-warm/30' : ''
                }`}
              >
                <td className={`${tdClass} font-mono`}>{row.withholdingId}</td>
                <td className={tdClass}>
                  <Badge tone="info">{categoryLabel(row.categoryCode)}</Badge>
                </td>
                <td className={`${tdClass} truncate`}>{row.recipientName || '-'}</td>
                <td className={`${tdClass} font-mono`}>{row.incomeYear - 1911}/{row.incomeMonth}</td>
                <td className={`${tdClass} font-mono`}>{rocDate(row.paymentYear, row.paymentMonth, row.paymentDay)}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>{fmtCurrency(row.grossIncome)}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>{fmtCurrency(row.withholdingAmount)}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>{row.nhiAmount > 0 ? fmtCurrency(row.nhiAmount) : '-'}</td>
                <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(row.netPayment)}</td>
                <td className={tdClass} onClick={e => e.stopPropagation()}>
                  <Badge tone={row.withholdingPaid ? 'success' : 'neutral'}>{row.withholdingPaid ? '已繳納' : '未繳納'}</Badge>
                </td>
                <td className={tdClass} onClick={e => e.stopPropagation()}>
                  {row.nhiAmount <= 0 ? (
                    <span className="text-neutral-mid">-</span>
                  ) : row.isNhiDeclared ? (
                    <Badge tone="info">{nhiDeclareStatusText(row.nhiDeclareStatus)}</Badge>
                  ) : (
                    <Badge tone={row.nhiPaid ? 'success' : 'neutral'}>{row.nhiPaid ? '已繳納' : '未繳納'}</Badge>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-neutral-blue-gray/40 bg-surface-off-white">
            <td className={`${tdClass} text-neutral-mid`} colSpan={5}>本次搜尋加總</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(searchTotals.incomeAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(searchTotals.withholdingAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(searchTotals.nhiAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(searchTotals.netPayment)}</td>
            <td className={tdClass} />
            <td className={tdClass} />
          </tr>
          <tr className="border-t border-neutral-blue-gray/20 bg-surface-off-white">
            <td className={`${tdClass} text-neutral-mid`} colSpan={5}>
              年度加總 <span className="font-semibold text-neutral-dark">{yearlyTotalCount}</span> 筆
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(yearlyTotals.incomeAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(yearlyTotals.withholdingAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(yearlyTotals.nhiAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(yearlyTotals.netPayment)}</td>
            <td className={tdClass} />
            <td className={tdClass} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
