'use client';

import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import { fmtCurrency } from '@/lib/utils';
import { Ban, ChevronDown, ChevronRight, CircleCheck } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { TaxInvoiceRow, TaxSide } from '../types';

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark';

function SortHeader({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <ChevronDown size={12} className="text-neutral-blue-gray" />
    </span>
  );
}

function ExpandToggle({ hasChildren, expanded, onToggle }: { hasChildren: boolean; expanded: boolean; onToggle: () => void }) {
  if (!hasChildren) return null;
  return (
    <button type="button" onClick={onToggle} className="text-neutral-mid">
      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    </button>
  );
}

function StatusBadge({ status }: { status: TaxInvoiceRow['status'] }) {
  if (status === 'voided') {
    return (
      <Badge tone="neutral" className="gap-1">
        <Ban size={12} />
        已作廢
      </Badge>
    );
  }
  return (
    <Badge tone="info" className="gap-1">
      <CircleCheck size={12} />
      待申報
    </Badge>
  );
}

export default function InvoiceTable({
  side,
  rows,
  totalCount,
  totalAmount,
}: {
  side: TaxSide;
  rows: TaxInvoiceRow[];
  totalCount: number;
  totalAmount: string;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const counterpartyLabel = side === 'sales' ? '買受人' : '賣方';

  return (
    <div className="hidden overflow-hidden rounded-md border border-neutral-blue-gray/30 bg-white nav:block">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-8" />
          <col className="w-[110px]" />
          <col className="w-[140px]" />
          <col className="w-[140px]" />
          <col className="w-[140px]" />
          <col className="w-[140px]" />
          <col />
          <col className="w-[110px]" />
        </colgroup>
        <thead className="bg-surface-off-white">
          <tr className="border-b border-neutral-blue-gray/40">
            <th className={thClass} />
            <th className={thClass}>
              <SortHeader label="開立日期" />
            </th>
            <th className={thClass}>
              <SortHeader label="發票號碼" />
            </th>
            <th className={`${thClass} text-right`}>未稅金額</th>
            <th className={`${thClass} text-right`}>營業稅額</th>
            <th className={`${thClass} text-right`}>總金額</th>
            <th className={thClass}>{counterpartyLabel}</th>
            <th className={thClass}>狀態</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <Fragment key={row.id}>
              <tr
                className={`border-b border-neutral-blue-gray/20 last:border-0 hover:bg-brand-blue/5 ${
                  row.status === 'voided' ? 'opacity-60' : i % 2 === 1 ? 'bg-surface-warm/30' : ''
                }`}
              >
                <td className={tdClass}>
                  <ExpandToggle hasChildren={!!row.children} expanded={!!expanded[row.id]} onToggle={() => toggleExpand(row.id)} />
                </td>
                <td className={`${tdClass} font-mono`}>{row.date}</td>
                <td className={`${tdClass} font-mono text-[13px] font-semibold`}>{row.id}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>{fmtCurrency(row.untaxed)}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>{fmtCurrency(row.tax)}</td>
                <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(row.total)}</td>
                <td className={`${tdClass} truncate`}>{row.counterparty}</td>
                <td className={tdClass}>
                  <StatusBadge status={row.status} />
                </td>
              </tr>
              {expanded[row.id] &&
                row.children?.map(child => (
                  <tr key={child.id} className="border-b border-neutral-blue-gray/20 bg-surface-off-white/60 last:border-0">
                    <td className={tdClass} />
                    <td className={`${tdClass} font-mono text-[13px] text-neutral-mid`}>{child.date ?? ''}</td>
                    <td className={`${tdClass} pl-2 font-mono text-[13px] text-neutral-mid`}>{child.label ?? child.id}</td>
                    <td className={`${tdClass} text-right font-mono text-neutral-mid tabular-nums`}>{fmtCurrency(child.untaxed)}</td>
                    <td className={`${tdClass} text-right font-mono text-neutral-mid tabular-nums`}>{fmtCurrency(child.tax)}</td>
                    <td className={`${tdClass} text-right font-mono text-neutral-mid tabular-nums`}>{fmtCurrency(child.total)}</td>
                    <td className={tdClass} colSpan={2} />
                  </tr>
                ))}
            </Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-neutral-blue-gray/40 bg-surface-off-white">
            <td colSpan={3} className={`${tdClass} text-neutral-mid`}>
              目前顯示 <span className="font-semibold text-neutral-dark">{totalCount}</span> 筆
            </td>
            <td colSpan={2} className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>
              {totalAmount}
            </td>
            <td colSpan={3} className={tdClass}>
              <div className="flex items-center justify-end gap-2 text-sm text-neutral-mid">
                每頁顯示：
                <Select widthClassName="w-20" defaultValue="10">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </Select>
                筆
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
