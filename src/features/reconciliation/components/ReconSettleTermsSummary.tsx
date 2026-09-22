'use client';

import { fmtCurrency } from '@/lib/utils';
import { computeAllocation } from '../targets';
import type { ReconAllocationRow, ReconTarget } from '../targets';
import type { ReconSide } from '../types';

interface ReconSettleTermsSummaryProps {
  /** 已依反向沖帳（isReversed）換算過的實際方向，收款日／付款日文案依此決定 */
  side: ReconSide;
  paymentDate: Date | undefined;
  options: ReconTarget[];
  primaryTargetKey: string;
  allocationRows: ReconAllocationRow[];
  /** 實際存入/付出金額（絕對值），供試算主對象自動補足的金額 */
  depositAmount: number;
}

/** Date 物件轉民國年 YYY/MM/DD，格式比照全站其餘頁面（見 lib/utils formatYyyymmddRoc） */
function formatDateRoc(date: Date): string {
  const year = date.getFullYear() - 1911;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * 步驟 3（本次沖帳明細）用的唯讀小字摘要：把留在步驟 2 輸入的收款日／付款日與沖帳對象分配帶出來，
 * 讓使用者送出前不必切回步驟 2 也能核對這兩項；不可編輯，要改就按「返回修改」回步驟 2
 * （見 ReconciliationView、DESIGN.md「Step Page Switch」）。金額試算與 ReconTargetAllocation／
 * targets.ts buildSettleChannels 共用同一套 computeAllocation，不在此另外重算一份。
 */
export default function ReconSettleTermsSummary({ side, paymentDate, options, primaryTargetKey, allocationRows, depositAmount }: ReconSettleTermsSummaryProps) {
  const dateLabel = side === 'payable' ? '付款日' : '收款日';
  const { primaryAmount } = computeAllocation(depositAmount, allocationRows);
  const primaryTarget = options.find(o => o.key === primaryTargetKey);

  const targetItems = [
    primaryTarget && primaryAmount > 0 ? { target: primaryTarget, amount: primaryAmount } : null,
    ...allocationRows.map(row => {
      const target = options.find(o => o.key === row.targetKey);
      return target && row.amount > 0 ? { target, amount: row.amount } : null;
    }),
  ].filter((item): item is { target: ReconTarget; amount: number } => item !== null);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-surface-cream px-3 py-2 text-xs text-neutral-mid">
      <span>
        {dateLabel} {paymentDate ? formatDateRoc(paymentDate) : '—'}
      </span>
      {targetItems.map(({ target, amount }) => (
        <span key={target.key} className="flex items-center gap-2">
          <span className="text-neutral-blue-gray">·</span>
          {target.name}（{target.subLabel}）{fmtCurrency(amount)}
        </span>
      ))}
    </div>
  );
}
