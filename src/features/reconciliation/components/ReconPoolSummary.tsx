'use client';

import { cn, fmtCurrency } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import type { ReconSettleResult } from '../types';

interface ReconPoolSummaryProps {
  statementAmount: number;
  /** 已有預覽拆帳結果時傳入；沖帳對象與差額一律以此為準，不再由前端本地累加勾選金額計算 */
  previewResult: ReconSettleResult | null;
}

/**
 * 對帳單金額／待沖帳總額／差額：緊鄰下方交易清單呈現，方便對照本次沖帳結果。
 * 尚未預覽時僅顯示使用者輸入的對帳單金額；預覽後改顯示後端試算的待沖總額與差額
 * （沖帳對象與拆帳結果一律由 settle/preview API 決定，見 ReconciliationView 的 handlePreview）。
 */
export default function ReconPoolSummary({ statementAmount, previewResult }: ReconPoolSummaryProps) {
  if (!previewResult) {
    return (
      <div className="mb-4 flex flex-col gap-1.5 border-b border-neutral-blue-gray/20 pb-4 text-sm">
        <div className="flex items-center justify-between text-neutral-mid">
          <span>對帳單金額</span>
          <span className="font-mono tabular-nums">{fmtCurrency(statementAmount)}</span>
        </div>
        {statementAmount === 0 && <p className="mt-1 text-neutral-mid">請先輸入對帳單金額並預覽拆帳</p>}
      </div>
    );
  }

  const diff = previewResult.settleAmount - previewResult.totalBeforeRemaining;
  const isBalanced = diff === 0;

  return (
    <div className="mb-4 flex flex-col gap-1.5 border-b border-neutral-blue-gray/20 pb-4 text-sm">
      <div className="flex items-center justify-between text-neutral-mid">
        <span>對帳單金額</span>
        <span className="font-mono tabular-nums">{fmtCurrency(previewResult.settleAmount)}</span>
      </div>
      <div className="flex items-center justify-between text-neutral-mid">
        <span>待沖帳總額</span>
        <span className="font-mono tabular-nums">{fmtCurrency(previewResult.totalBeforeRemaining)}</span>
      </div>
      <div
        className={cn('mt-1 flex items-center justify-between border-t pt-2', isBalanced ? 'border-semantic-success/30' : 'border-neutral-blue-gray/30')}
      >
        <span className={cn('text-base font-bold', isBalanced ? 'text-semantic-success' : 'text-neutral-dark')}>{isBalanced ? '已平衡' : '差額'}</span>
        <span className={cn('flex items-center gap-1.5 font-mono text-xl font-bold tabular-nums', isBalanced ? 'text-semantic-success' : 'text-neutral-dark')}>
          {isBalanced && <CheckCircle2 size={20} />}
          {fmtCurrency(Math.abs(diff))}
        </span>
      </div>
      <p className="mt-1 text-neutral-mid">本次沖帳 {previewResult.affectedCount} 筆</p>
    </div>
  );
}
