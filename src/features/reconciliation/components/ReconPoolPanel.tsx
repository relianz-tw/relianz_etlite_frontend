'use client';

import MoneyInput from '@/components/ui/MoneyInput';
import { cn, fmtCurrency } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface ReconPoolPanelProps {
  statementAmount: number;
  feeAmount: number;
  onStatementChange: (value: number) => void;
  onFeeChange: (value: number) => void;
  carryOverIn: number;
  pool: number;
  matched: number;
  remaining: number;
}

/**
 * 對帳單金額／手續費輸入，並即時顯示可沖銷總額（pool）、已沖銷金額與剩餘餘額。
 * pool = 對帳單金額 + 手續費 + 上次結餘：發票金額為管道預扣手續費前的原始金額，
 * 對帳單只會顯示扣除手續費後匯入的淨額，故需把手續費加回才能對應到待沖帳款金額。
 * 兩個輸入框相鄰擺放並以「+」連結，讓使用者一眼看出是同一組運算；剩餘為最關鍵數字，字級明顯放大。
 */
export default function ReconPoolPanel({ statementAmount, feeAmount, onStatementChange, onFeeChange, carryOverIn, pool, matched, remaining }: ReconPoolPanelProps) {
  const isComplete = pool > 0 && remaining === 0 && matched > 0;
  const isOverdrawn = remaining < 0;

  return (
    <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">對帳單金額</label>
          <MoneyInput widthClassName="w-36" value={statementAmount} onChange={onStatementChange} />
        </div>
        <span className="pb-2.5 text-lg text-neutral-mid">+</span>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">手續費</label>
          <MoneyInput widthClassName="w-36" value={feeAmount} onChange={onFeeChange} />
        </div>
      </div>

      {carryOverIn > 0 && <p className="mt-2 text-xs text-neutral-mid">已含上次結餘 +{fmtCurrency(carryOverIn)}</p>}

      <div className="mt-4 flex flex-col gap-1.5 border-t border-neutral-blue-gray/20 pt-3 text-sm">
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
      </div>

      {pool === 0 && <p className="mt-3 text-sm text-neutral-mid">請先輸入對帳單金額</p>}
    </div>
  );
}
