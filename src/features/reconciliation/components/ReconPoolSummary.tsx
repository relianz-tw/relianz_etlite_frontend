'use client';

import { cn, fmtCurrency } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import type { ReconSettleResult, ReconSide } from '../types';

interface ReconPoolSummaryProps {
  side: ReconSide;
  /** 已有預覽拆帳結果才會渲染本元件；沖帳對象與差額一律以此為準，不再由前端本地累加勾選金額計算 */
  previewResult: ReconSettleResult;
  /** 排列方式：'narrow'（預設，手機 Bottom Sheet 內沿用原上下堆疊）／'wide'（桌機步驟 3 全寬卡，
   *  上方三列改橫排，見 DESIGN.md「Recon Pool Panel — Wide Layout」） */
  layout?: 'narrow' | 'wide';
}

/**
 * 對帳單金額／待付(收)帳總額／實際存入(付出)金額／差額：於匯總沖帳確認階段緊鄰下方交易清單呈現，
 * 方便對照本次沖帳結果（沖帳對象與拆帳結果一律由 settle/preview API 決定，見 ReconciliationView）。
 * 實際存入(付出)金額取自 previewResult.actualAmount：換頁後金額面板不再與本卡同框（見
 * ReconciliationView 步驟 2／3 換頁說明），這是送出前使用者最需要核對的數字，故補在此卡呈現。
 */
export default function ReconPoolSummary({ side, previewResult, layout = 'narrow' }: ReconPoolSummaryProps) {
  // 差額須以後端試算的 appliedSettleAmount（已併入使用餘額）為準，不可直接用 settleAmount 相減，
  // 否則使用者一旦動用餘額，這裡算出的差額會跟下方沖帳列的差額（見 ReconciliationView 的 diffAmount）對不上
  const diff = previewResult.appliedSettleAmount - previewResult.totalBeforeRemaining;
  const isBalanced = diff === 0;

  return (
    <div className="mb-4 flex flex-col gap-1.5 border-b border-neutral-blue-gray/20 pb-4 text-sm">
      <div className={cn('flex flex-col gap-1.5', layout === 'wide' && 'min-[1300px]:grid min-[1300px]:grid-cols-3 min-[1300px]:gap-4')}>
        <div className="flex items-center justify-between text-neutral-mid">
          <span>對帳單金額</span>
          <span className="font-mono tabular-nums">{fmtCurrency(previewResult.settleAmount)}</span>
        </div>
        <div className="flex items-center justify-between text-neutral-mid">
          <span>{side === 'payable' ? '待付帳總額' : '待收帳總額'}</span>
          <span className="font-mono tabular-nums">{fmtCurrency(previewResult.totalBeforeRemaining)}</span>
        </div>
        <div className="flex items-center justify-between text-neutral-mid">
          <span>實際{side === 'payable' ? '付出' : '存入'}金額</span>
          <span className="font-mono tabular-nums">{fmtCurrency(Math.abs(previewResult.actualAmount))}</span>
        </div>
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
      <p className="mt-1 text-neutral-mid">本次沖帳 {previewResult.allocations.length} 筆</p>
    </div>
  );
}
