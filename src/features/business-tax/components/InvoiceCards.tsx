'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ExportRangeDialog from '@/components/ui/ExportRangeDialog';
import Select from '@/components/ui/Select';
import { fmtCurrency } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowUpDown, Ban, ChevronDown, ChevronRight, CircleCheck, Download } from 'lucide-react';
import { useState } from 'react';
import type { SortKey, SortState, TaxInvoiceRow, TaxSide } from '../types';

const SORT_KEY_LABELS: Record<SortKey, string> = { date: '開立日期', id: '發票號碼' };
const SORT_KEYS: SortKey[] = ['date', 'id'];

/** 手機排序入口：下拉選欄位（預設 asc）＋方向鈕（僅切換 asc/desc），與桌機表格共用同一份排序資料 */
function MobileSortControl({
  sort,
  onFieldChange,
  onDirToggle,
}: {
  sort: SortState;
  onFieldChange: (key: SortKey | null) => void;
  onDirToggle: () => void;
}) {
  const DirIcon = sort.dir === 'asc' ? ArrowUp : sort.dir === 'desc' ? ArrowDown : ArrowUpDown;
  return (
    <div className="flex items-center gap-1.5">
      <Select widthClassName="w-32" value={sort.key ?? ''} onValueChange={v => onFieldChange(v ? (v as SortKey) : null)}>
        <option value="">不排序</option>
        {SORT_KEYS.map(key => (
          <option key={key} value={key}>
            {SORT_KEY_LABELS[key]}
          </option>
        ))}
      </Select>
      <Button variant="ghost" size="sm" icon={DirIcon} disabled={!sort.key} onClick={onDirToggle} aria-label="切換排序方向" />
    </div>
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

function InvoiceCard({ side, row }: { side: TaxSide; row: TaxInvoiceRow }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`flex flex-col gap-2 rounded-lg border border-neutral-blue-gray/30 bg-white p-4 ${row.status === 'voided' ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {row.children && (
            <button type="button" onClick={() => setExpanded(e => !e)} className="text-neutral-mid">
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
          <span className="font-mono text-[15px] font-semibold text-neutral-dark">{row.id}</span>
        </div>
        <span className="whitespace-nowrap font-mono text-xs text-neutral-mid">{row.date}</span>
      </div>
      <div className="truncate text-[13px] text-neutral-mid" title={row.counterparty}>{row.counterparty}</div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-lg font-semibold tabular-nums text-neutral-dark">{fmtCurrency(row.total)}</span>
        <StatusBadge status={row.status} />
      </div>
      <div className="flex justify-between text-xs text-neutral-mid">
        <span>未稅金額 {fmtCurrency(row.untaxed)}</span>
        <span>營業稅額 {fmtCurrency(row.tax)}</span>
      </div>
      {expanded && row.children && (
        <div className="mt-1 flex flex-col gap-1.5 border-t border-neutral-blue-gray/20 pt-2">
          {row.children.map(child => (
            <div key={child.id} className="flex items-center justify-between text-xs text-neutral-mid">
              <span className="font-mono">{child.label ?? child.id}</span>
              <span className="font-mono tabular-nums">{fmtCurrency(child.total)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InvoiceCards({
  side,
  rows,
  totalCount,
  totalAmount,
  sort,
  onSortFieldChange,
  onSortDirToggle,
}: {
  side: TaxSide;
  rows: TaxInvoiceRow[];
  totalCount: number;
  totalAmount: string;
  sort: SortState;
  onSortFieldChange: (key: SortKey | null) => void;
  onSortDirToggle: () => void;
}) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2.5 nav:hidden">
      <ExportRangeDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} onExport={() => setExportDialogOpen(false)} />

      <div className="sticky top-16 z-40 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-blue-gray/30 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="whitespace-nowrap text-sm text-neutral-mid">
            目前顯示 <span className="font-semibold text-neutral-dark">{totalCount}</span> 筆{' '}
            <span className="font-mono font-semibold tabular-nums text-neutral-dark">{totalAmount}</span>
          </span>
          <MobileSortControl sort={sort} onFieldChange={onSortFieldChange} onDirToggle={onSortDirToggle} />
        </div>
        <Button variant="warm" size="sm" icon={Download} onClick={() => setExportDialogOpen(true)}>
          匯出總表
        </Button>
      </div>

      {rows.map(row => (
        <InvoiceCard key={row.id} side={side} row={row} />
      ))}
    </div>
  );
}
