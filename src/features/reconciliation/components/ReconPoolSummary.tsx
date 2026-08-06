'use client';

import { cn, fmtCurrency } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface ReconPoolSummaryProps {
  pool: number;
  matched: number;
  remaining: number;
}

/**
 * 可沖銷總額／已沖銷／剩餘：緊鄰下方逐筆勾選清單呈現，方便對照目前勾選金額與差額。
 * pool = 對帳單金額（手續費／額外金額為對帳單金額的減項，不計入可沖銷總額，見 ReconPoolPanel）。
 */
export default function ReconPoolSummary({ pool, matched, remaining }: ReconPoolSummaryProps) {
  const isComplete = pool > 0 && remaining === 0 && matched > 0;
  const isOverdrawn = remaining < 0;

  return (
    <div className="mb-4 flex flex-col gap-1.5 border-b border-neutral-blue-gray/20 pb-4 text-sm">
      <div className="flex items-center justify-between text-neutral-mid">
        <span>可沖銷總額</span>
        <span className="font-mono tabular-nums">{fmtCurrency(pool)}</span>
      </div>
      <div className="flex items-center justify-between text-neutral-mid">
        <span>− 已沖銷</span>
        <span className="font-mono tabular-nums">{fmtCurrency(matched)}</span>
      </div>
      <div
        className={cn(
          'mt-1 flex items-center justify-between border-t pt-2',
          isOverdrawn ? 'border-semantic-error/30' : isComplete ? 'border-semantic-success/30' : 'border-neutral-blue-gray/30',
        )}
      >
        <span className={cn('text-base font-bold', isOverdrawn ? 'text-semantic-error' : isComplete ? 'text-semantic-success' : 'text-neutral-dark')}>
          剩餘
        </span>
        <span
          className={cn(
            'flex items-center gap-1.5 font-mono text-xl font-bold tabular-nums',
            isOverdrawn ? 'text-semantic-error' : isComplete ? 'text-semantic-success' : 'text-neutral-dark',
          )}
        >
          {isComplete && <CheckCircle2 size={20} />}
          {fmtCurrency(remaining)}
        </span>
      </div>
      {pool === 0 && <p className="mt-1 text-neutral-mid">請先輸入對帳單金額</p>}
    </div>
  );
}
