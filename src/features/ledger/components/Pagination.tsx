'use client';

import Button from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
import { useState } from 'react';
import ExportRangeDialog from './ExportRangeDialog';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function pageList(page: number, totalPages: number): (number | 'ellipsis')[] {
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | 'ellipsis')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('ellipsis');
    result.push(p);
  });
  return result;
}

const pagerBtnClass =
  'grid h-8 w-8 place-items-center rounded-md border border-neutral-blue-gray/40 text-neutral-mid hover:bg-surface-cream disabled:cursor-not-allowed disabled:opacity-40';

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  return (
    <div className="mt-4">
      <ExportRangeDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} onExport={() => setExportDialogOpen(false)} />
      {/* 桌機：頁碼置中 */}
      <div className="hidden grid-cols-3 items-center nav:grid">
        <div />
        <div className="flex items-center justify-self-center gap-1">
          <button className={pagerBtnClass} disabled={page === 1} onClick={() => onPageChange(1)}>
            <ChevronsLeft size={15} />
          </button>
          <button className={pagerBtnClass} disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
            <ChevronLeft size={15} />
          </button>
          {pageList(page, totalPages).map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`e${i}`} className="px-1 text-sm text-neutral-mid">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`h-8 w-8 rounded-md border text-sm font-semibold ${
                  p === page ? 'border-brand-blue bg-brand-blue text-white' : 'border-neutral-blue-gray/40 text-neutral-dark hover:bg-surface-cream'
                }`}
              >
                {p}
              </button>
            ),
          )}
          <button className={pagerBtnClass} disabled={page === totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
            <ChevronRight size={15} />
          </button>
          <button className={pagerBtnClass} disabled={page === totalPages} onClick={() => onPageChange(totalPages)}>
            <ChevronsRight size={15} />
          </button>
        </div>
        <Button variant="ghost" icon={Download} className="justify-self-end" onClick={() => setExportDialogOpen(true)}>
          匯出總表
        </Button>
      </div>
    </div>
  );
}
