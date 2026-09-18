import type { BalanceTotals } from '../utils/openingBalance';
import { fmtCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { CircleCheck, TriangleAlert } from 'lucide-react';

interface BalanceCheckBarProps {
  totals: BalanceTotals;
  onApplyAdjustment: () => void;
}

/** 3B 期初表底部固定的借貸平衡即時檢查列 */
export function BalanceCheckBar({ totals, onApplyAdjustment }: BalanceCheckBarProps) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
        totals.isBalanced ? 'border-semantic-success/40 bg-semantic-success/5' : 'border-semantic-error/40 bg-semantic-error/5'
      }`}
    >
      <div className="flex items-center gap-2">
        {totals.isBalanced ? (
          <CircleCheck size={18} className="shrink-0 text-semantic-success" />
        ) : (
          <TriangleAlert size={18} className="shrink-0 text-semantic-error" />
        )}
        <div className="text-sm">
          <span className="text-neutral-dark">
            資產合計 {fmtCurrency(totals.assetsTotal)}　負債＋權益合計 {fmtCurrency(totals.liabilitiesTotal + totals.equityTotal)}
          </span>
          {!totals.isBalanced && <span className="ml-2 font-semibold text-semantic-error">差額 {fmtCurrency(totals.diff)}</span>}
        </div>
      </div>
      {!totals.isBalanced && (
        <Button variant="outline" size="sm" onClick={onApplyAdjustment} className="shrink-0">
          將差額計入業主往來
        </Button>
      )}
    </div>
  );
}
