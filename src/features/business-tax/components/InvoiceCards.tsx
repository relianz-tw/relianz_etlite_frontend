'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ExportRangeDialog from '@/components/ui/ExportRangeDialog';
import { fmtCurrency } from '@/lib/utils';
import { Ban, ChevronDown, ChevronRight, CircleCheck, Download } from 'lucide-react';
import { useState } from 'react';
import type { TaxInvoiceRow, TaxSide } from '../types';

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
      <div className="truncate text-[13px] text-neutral-mid">{row.counterparty}</div>
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
}: {
  side: TaxSide;
  rows: TaxInvoiceRow[];
  totalCount: number;
  totalAmount: string;
}) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2.5 nav:hidden">
      <ExportRangeDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} onExport={() => setExportDialogOpen(false)} />

      <div className="sticky top-16 z-40 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-blue-gray/30 bg-white p-4">
        <span className="text-sm text-neutral-mid">
          目前顯示 <span className="font-semibold text-neutral-dark">{totalCount}</span> 筆{' '}
          <span className="font-mono font-semibold tabular-nums text-neutral-dark">{totalAmount}</span>
        </span>
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
