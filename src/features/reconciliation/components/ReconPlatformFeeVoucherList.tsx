'use client';

import { fmtCurrency } from '@/lib/utils';
import type { ReconTxnRef } from '../types';

interface ReconPlatformFeeVoucherListProps {
  /** 電商平台扣款已選的佐證憑證（僅應收側非 0 時有值） */
  vouchers: ReconTxnRef[];
}

/**
 * 電商平台扣款憑證清單：確認沖帳彈窗（ReconConfirmSummaryModal）與匯總沖帳明細卡
 * （ReconciliationView 階段 2）共用，避免同一段 markup 兩處各維護一份。
 */
export default function ReconPlatformFeeVoucherList({ vouchers }: ReconPlatformFeeVoucherListProps) {
  if (vouchers.length === 0) return null;

  const total = vouchers.reduce((sum, v) => sum + v.amount, 0);

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-neutral-dark">電商平台扣款憑證</p>
      <div className="flex flex-col gap-2 rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3">
        {vouchers.map(v => (
          <div key={v.uuid} className="flex items-center justify-between gap-4 text-sm">
            <span className="min-w-0 truncate text-neutral-dark">
              {v.date} · {v.voucherNumber || '無憑證號碼'} · {v.counterparty}
            </span>
            <span className="flex shrink-0 items-baseline gap-0.5 font-mono tabular-nums text-neutral-dark">{fmtCurrency(v.amount)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 border-t border-neutral-blue-gray/30 pt-2 text-sm font-semibold">
          <span className="text-neutral-mid">合計</span>
          <span className="flex shrink-0 items-baseline gap-0.5 font-mono tabular-nums text-neutral-dark">{fmtCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
