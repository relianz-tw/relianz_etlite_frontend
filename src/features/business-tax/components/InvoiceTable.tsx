'use client';

import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import { fmtCurrency } from '@/lib/utils';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import type { SortKey, SortState, TaxInvoiceRow, TaxSide } from '../types';

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdBase = 'whitespace-nowrap px-4 py-3.5 text-sm';
const tdClass = `${tdBase} text-neutral-dark`;
// 作廢列：文字降階為 neutral-mid，金額另加刪除線（見 DESIGN.md「Voided Row」）
const tdVoidClass = `${tdBase} text-neutral-mid`;

/** 可排序表頭：三態循環 none → asc → desc → none；active 時文字與圖示轉城信藍（見 DESIGN.md「Sortable Table Header」） */
function SortHeader({ label, sortKey, sort, onToggle }: { label: string; sortKey: SortKey; sort: SortState; onToggle: (key: SortKey) => void }) {
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

export default function InvoiceTable({
  side,
  rows,
  totalCount,
  totalSales,
  totalBusinessTax,
  totalAmount,
  pageSales,
  pageBusinessTax,
  pageAmount,
  limit,
  onLimitChange,
  sort,
  onSortToggle,
}: {
  side: TaxSide;
  rows: TaxInvoiceRow[];
  totalCount: number;
  totalSales: string;
  totalBusinessTax: string;
  totalAmount: string;
  pageSales: string;
  pageBusinessTax: string;
  pageAmount: string;
  limit: number;
  onLimitChange: (limit: number) => void;
  sort: SortState;
  onSortToggle: (key: SortKey) => void;
}) {
  const counterpartyLabel = side === 'sales' ? '買受人' : '賣方';
  // 進項僅顯示可否扣抵；作廢狀態僅在銷項呈現（進項作廢不特別標示，避免刪除線卻無說明文字）
  const statusLabel = side === 'sales' ? '作廢狀態' : '可否扣抵';

  return (
    <div className="hidden overflow-hidden rounded-md border border-neutral-blue-gray/30 bg-white nav:block">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-[100px]" />
          <col className="w-[180px]" />
          <col className="w-[120px]" />
          <col className="w-[120px]" />
          <col className="w-[130px]" />
          <col />
          <col className="w-[100px]" />
          <col className="w-[110px]" />
        </colgroup>
        <thead className="bg-surface-off-white">
          <tr className="border-b border-neutral-blue-gray/40">
            <th className={thClass}>
              <SortHeader label="開立日期" sortKey="date" sort={sort} onToggle={onSortToggle} />
            </th>
            <th className={thClass}>
              <SortHeader label="發票號碼" sortKey="id" sort={sort} onToggle={onSortToggle} />
            </th>
            <th className={`${thClass} text-right`}>未稅金額</th>
            <th className={`${thClass} text-right`}>營業稅額</th>
            <th className={`${thClass} text-right`}>總金額</th>
            <th className={thClass}>{counterpartyLabel}</th>
            <th className={thClass}>申報狀態</th>
            <th className={thClass}>{statusLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            // 進項不特別呈現作廢視覺，只有銷項作廢列降階＋刪除線
            const isVoidRow = side === 'sales' && row.isVoid;
            const cell = isVoidRow ? tdVoidClass : tdClass;
            const amountStrike = isVoidRow ? 'line-through' : '';
            return (
              <tr
                key={row.uuid}
                className={`border-b border-neutral-blue-gray/20 last:border-0 hover:bg-brand-blue/5 ${i % 2 === 1 ? 'bg-surface-warm/30' : ''}`}
              >
                <td className={`${cell} font-mono`}>{row.date}</td>
                <td className={`${cell} font-mono text-[13px] font-semibold`}>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/business-tax/${row.ledgerUuid}?side=${side}${row.isVoid ? '&void=1' : ''}`}
                      className={`hover:text-brand-blue hover:underline ${amountStrike}`}
                    >
                      {row.id}
                    </Link>
                    {row.isAllowance && <Badge tone="info">折讓</Badge>}
                  </div>
                </td>
                <td className={`${cell} text-right font-mono tabular-nums ${amountStrike}`}>{fmtCurrency(row.untaxed)}</td>
                <td className={`${cell} text-right font-mono tabular-nums ${amountStrike}`}>{fmtCurrency(row.tax)}</td>
                <td className={`${cell} text-right font-mono font-semibold tabular-nums ${amountStrike}`}>{fmtCurrency(row.total)}</td>
                <td className={`${cell} truncate`} title={row.counterparty}>{row.counterparty}</td>
                <td className={cell}>
                  <Badge tone={row.declared ? 'success' : 'neutral'}>{row.declared ? '已申報' : '未申報'}</Badge>
                </td>
                <td className={cell}>
                  {side === 'sales' ? (
                    <Badge tone={row.isVoid ? 'error' : 'neutral'}>{row.isVoid ? '已作廢' : '正常'}</Badge>
                  ) : (
                    <Badge tone={row.deductible ? 'success' : 'neutral'}>{row.deductible ? '可扣抵' : '不可扣抵'}</Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-neutral-blue-gray/40 bg-surface-off-white">
            <td className={`${tdClass} text-neutral-mid`}>本頁加總</td>
            <td className={tdClass} />
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{pageSales}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{pageBusinessTax}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{pageAmount}</td>
            <td className={tdClass} />
            <td className={tdClass} />
            <td className={tdClass} />
          </tr>
          <tr className="border-t border-neutral-blue-gray/20 bg-surface-off-white">
            <td className={`${tdClass} text-neutral-mid`}>
              全部加總 <span className="font-semibold text-neutral-dark">{totalCount}</span> 筆
            </td>
            <td className={tdClass} />
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{totalSales}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{totalBusinessTax}</td>
            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{totalAmount}</td>
            <td className={tdClass}>
              <div className="flex items-center justify-end gap-2 text-sm text-neutral-mid">
                每頁顯示：
                <Select widthClassName="w-20" value={String(limit)} onValueChange={v => onLimitChange(Number(v))}>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </Select>
                筆
              </div>
            </td>
            <td className={tdClass} />
            <td className={tdClass} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
