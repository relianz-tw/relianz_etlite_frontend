import { useInitialization } from '../state/InitializationContext';
import type { SettlementReportId } from '../state/initializationReducer';
import type { ReportPageDef } from '../reports/types';
import { fmtCurrency } from '@/lib/utils';
import { CircleCheck, TriangleAlert } from 'lucide-react';

interface ReportBalanceBarProps {
  reportId: SettlementReportId;
  page: Pick<ReportPageDef, 'left' | 'right' | 'balanceCheck'>;
}

/** 報表頁左右欄合計比對列（如資產負債表：資產總計 vs 負債及業主權益總計），取代 3B 舊版 BalanceCheckBar */
export function ReportBalanceBar({ reportId, page }: ReportBalanceBarProps) {
  const { state } = useInitialization();
  if (!page.balanceCheck || !page.left?.totalFieldKey || !page.right?.totalFieldKey) return null;

  const fields = state.reports[reportId].fields;
  const leftValue = Number(fields[page.left.totalFieldKey]?.value) || 0;
  const rightValue = Number(fields[page.right.totalFieldKey]?.value) || 0;
  const diff = leftValue - rightValue;
  const isBalanced = diff === 0;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border p-4 ${
        isBalanced ? 'border-semantic-success/40 bg-semantic-success/5' : 'border-semantic-error/40 bg-semantic-error/5'
      }`}
    >
      {isBalanced ? (
        <CircleCheck size={18} className='shrink-0 text-semantic-success' />
      ) : (
        <TriangleAlert size={18} className='shrink-0 text-semantic-error' />
      )}
      <div className='text-sm'>
        <span className='text-neutral-dark'>
          {page.balanceCheck.leftLabel} {fmtCurrency(leftValue)}　{page.balanceCheck.rightLabel} {fmtCurrency(rightValue)}
        </span>
        {!isBalanced && <span className='ml-2 font-semibold text-semantic-error'>差額 {fmtCurrency(diff)}</span>}
      </div>
    </div>
  );
}
