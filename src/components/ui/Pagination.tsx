'use client';

import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 右側插槽，通常放各頁自己的「匯出總表」按鈕（含其對話框） */
  rightSlot?: ReactNode;
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

/** 頁碼限制在 1～totalPages 區間內 */
function clampPage(value: number, totalPages: number): number {
  return Math.min(Math.max(1, value), totalPages);
}

export default function Pagination({ page, totalPages, onPageChange, rightSlot }: PaginationProps) {
  const [jumpValue, setJumpValue] = useState('');

  const handleJump = () => {
    const target = Number(jumpValue);
    if (jumpValue && Number.isFinite(target)) onPageChange(clampPage(target, totalPages));
    setJumpValue('');
  };

  return (
    <div className="mt-4">
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
        <div className="flex items-center justify-self-end gap-2">{rightSlot}</div>
      </div>

      {/* 手機：維持與桌機相同的上下頁切換，另補上跳至特定頁與每頁筆數選單 */}
      <div className="flex flex-col gap-3 nav:hidden">
        <div className="flex items-center justify-center gap-1">
          <button className={pagerBtnClass} disabled={page === 1} onClick={() => onPageChange(1)}>
            <ChevronsLeft size={15} />
          </button>
          <button className={pagerBtnClass} disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
            <ChevronLeft size={15} />
          </button>
          <span className="px-2 text-sm font-semibold text-neutral-dark">
            {page} / {totalPages}
          </span>
          <button className={pagerBtnClass} disabled={page === totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
            <ChevronRight size={15} />
          </button>
          <button className={pagerBtnClass} disabled={page === totalPages} onClick={() => onPageChange(totalPages)}>
            <ChevronsRight size={15} />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-neutral-mid">
            跳至
            <TextInput
              type="number"
              widthClassName="w-16"
              value={jumpValue}
              onChange={e => setJumpValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJump()}
              onBlur={handleJump}
            />
            頁
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-mid">
            每頁顯示：
            <Select widthClassName="w-20" defaultValue="10">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </Select>
            筆
          </div>
        </div>
      </div>
    </div>
  );
}
