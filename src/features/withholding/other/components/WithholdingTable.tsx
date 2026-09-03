'use client';

import Badge from '@/components/ui/Badge';
import { fmtCurrency } from '@/lib/utils';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { categoryLabel, nhiDeclareStatusText } from '../data';
import type { WithholdingSortKey, WithholdingSortState } from '../urlState';
import type { WithholdingRecord } from '../types';

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark';

function rocDate(year: number, month: number, day: number): string {
  return `${year - 1911}/${month}/${day}`;
}

/** 可排序表頭：三態循環 none → asc → desc → none（比照營業稅中心表格） */
function SortHeader({
  label,
  sortKey,
  sort,
  onToggle,
}: {
  label: string;
  sortKey: WithholdingSortKey;
  sort: WithholdingSortState;
  onToggle: (key: WithholdingSortKey) => void;
}) {
  const active = sort.key === sortKey;
  const Icon = active ? (sort.dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <button
      type="button"
      onClick={() => onToggle(sortKey)}
      className={`inline-flex items-center gap-1 hover:text-brand-blue ${active ? 'text-brand-blue' : 'text-neutral-mid'}`}
    >
      {label}
      <Icon size={12} className={active ? 'text-brand-blue' : 'text-neutral-blue-gray'} />
    </button>
  );
}

interface WithholdingTableProps {
  rows: WithholdingRecord[];
  totalCount: number;
  pageTotals: { grossIncome: number; withholdingAmount: number; nhiAmount: number; netPayment: number };
  allTotals: { grossIncome: number; withholdingAmount: number; nhiAmount: number; netPayment: number };
  sort: WithholdingSortState;
  onSortToggle: (key: WithholdingSortKey) => void;
}

export default function WithholdingTable({ rows, totalCount, pageTotals, allTotals, sort, onSortToggle }: WithholdingTableProps) {
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
            <th className={thClass}>
              <SortHeader label="支付日期" sortKey="paymentDate" sort={sort} onToggle={onSortToggle} />
            </th>
            <th className={`${thClass} text-right`}>
              <SortHeader label="所得金額" sortKey="grossIncome" sort={sort} onToggle={onSortToggle} />
            </th>
            <th className={`${thClass} text-right`}>扣繳稅額</th>
            <th className={`${thClass} text-right`}>二代健保</th>
            <th className={`${thClass} text-right`}>支付金額</th>
            <th className={thClass}>繳款狀態</th>
            <th className={thClass}>健保狀態</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-4 py-10 text-center text-sm text-neutral-mid">
                此期間沒有更多的資料了
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.uuid}
                onClick={() => router.push(`/withholding/other/${row.uuid}`)}
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
            <td className={`${tdClass} text-neutral-mid`} colSpan={5}>本頁加總</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(pageTotals.grossIncome)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(pageTotals.withholdingAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(pageTotals.nhiAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(pageTotals.netPayment)}</td>
            <td className={tdClass} />
            <td className={tdClass} />
          </tr>
          <tr className="border-t border-neutral-blue-gray/20 bg-surface-off-white">
            <td className={`${tdClass} text-neutral-mid`} colSpan={5}>
              全部加總 <span className="font-semibold text-neutral-dark">{totalCount}</span> 筆
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(allTotals.grossIncome)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(allTotals.withholdingAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(allTotals.nhiAmount)}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(allTotals.netPayment)}</td>
            <td className={tdClass} />
            <td className={tdClass} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
