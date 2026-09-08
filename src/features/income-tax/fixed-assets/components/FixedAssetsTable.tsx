'use client';

import Badge from '@/components/ui/Badge';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import type { FixedAssetRow, SortKey, SortState } from '../types';

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdBase = 'whitespace-nowrap px-4 py-3.5 text-sm';
const tdClass = `${tdBase} text-neutral-dark`;
const tdDimClass = `${tdBase} text-neutral-mid`;

/** 可排序表頭：三態循環 none → asc → desc → none */
function SortHeader({ label, sortKey, sort, onToggle }: { label: string; sortKey: SortKey; sort: SortState; onToggle: (key: SortKey) => void }) {
  const active = sort.key === sortKey;
  const Icon = active ? (sort.dir === 'asc' ? ChevronUp : sort.dir === 'desc' ? ChevronDown : ChevronsUpDown) : ChevronsUpDown;
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

interface Props {
  rows: FixedAssetRow[];
  totalCount: number;
  sort: SortState;
  onSortToggle: (key: SortKey) => void;
}

export default function FixedAssetsTable({ rows, totalCount, sort, onSortToggle }: Props) {
  return (
    <div className="hidden overflow-hidden rounded-md border border-neutral-blue-gray/30 bg-white nav:block">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col />
          <col className="w-[120px]" />
          <col className="w-[130px]" />
          <col className="w-[90px]" />
          <col className="w-[150px]" />
          <col className="w-[160px]" />
          <col className="w-[100px]" />
        </colgroup>
        <thead className="bg-surface-off-white">
          <tr className="border-b border-neutral-blue-gray/40">
            <th className={thClass}>
              <SortHeader label="名稱" sortKey="name" sort={sort} onToggle={onSortToggle} />
            </th>
            <th className={thClass}>科目</th>
            <th className={thClass}>
              <SortHeader label="購入日期" sortKey="acquiredDate" sort={sort} onToggle={onSortToggle} />
            </th>
            <th className={thClass}>使用年限</th>
            <th className={`${thClass} text-right`}>
              <SortHeader label="原始金額" sortKey="originalAmount" sort={sort} onToggle={onSortToggle} />
            </th>
            <th className={`${thClass} text-right`}>
              <SortHeader label="剩餘可扣抵餘額" sortKey="remainingAmount" sort={sort} onToggle={onSortToggle} />
            </th>
            <th className={thClass}>狀態</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const dim = row.status === 'completed';
            const cell = dim ? tdDimClass : tdClass;
            return (
              <tr
                key={row.id}
                className={`border-b border-neutral-blue-gray/20 last:border-0 ${i % 2 === 1 ? 'bg-surface-warm/30' : ''}`}
              >
                <td className={`${cell} font-medium`}>{row.name}</td>
                <td className={`${cell} text-sm`}>{row.subject}</td>
                <td className={`${cell} font-mono`}>{formatYyyymmddRoc(row.acquiredDate)}</td>
                <td className={cell}>{row.usefulLifeYears} 年</td>
                <td className={`${cell} text-right font-mono tabular-nums`}>{fmtCurrency(row.originalAmount)}</td>
                <td className={`px-4 py-3.5 text-right font-mono text-sm tabular-nums ${dim ? 'text-neutral-mid' : 'font-semibold text-brand-blue'}`}>
                  {fmtCurrency(row.remainingAmount)}
                </td>
                <td className={cell}>
                  <Badge tone={row.status === 'active' ? 'info' : 'neutral'}>
                    {row.status === 'active' ? '使用中' : '已折舊完畢'}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-neutral-blue-gray/40 bg-surface-off-white">
            <td className={`${tdClass} text-neutral-mid`}>
              共 <span className="font-semibold text-neutral-dark">{totalCount}</span> 筆
            </td>
            <td className={tdClass} />
            <td className={tdClass} />
            <td className={tdClass} />
            <td className={tdClass} />
            <td className={tdClass} />
            <td className={tdClass} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
