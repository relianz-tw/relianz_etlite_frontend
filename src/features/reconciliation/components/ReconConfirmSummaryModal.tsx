'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency } from '@/lib/utils';
import ReconAllocationTable from './ReconAllocationTable';
import type { ReconAllocationInfo, ReconSettleResult, ReconSide, ReconTxnRef } from '../types';

interface ReconConfirmSummaryModalProps {
  open: boolean;
  groupLabel: string;
  side: ReconSide;
  result: ReconSettleResult;
  /** 有超沖／少沖差額；true 時顯示差額列與提示文字，不影響是否可送出（差額一律直接沖入最後一筆／留在該筆原單） */
  hasDiff: boolean;
  /** 差額金額，僅 hasDiff 時顯示 */
  diffAmount: number;
  /** 逐筆沖帳勾恰好 1 筆：差額留在該筆原單；其餘（勾多筆／匯總沖帳）：差額沖入最後一筆交易 */
  isSingleSelection: boolean;
  /** ledgerUuid → 買受人／賣方與憑證號碼，供明細表補上沖帳 API 回應本身沒有的欄位 */
  allocationInfoByUuid: Map<string, ReconAllocationInfo>;
  /** 電商平台扣款已選的佐證憑證（僅應收側非 0 時有值），確認送出後會一併沖銷這些憑證 */
  platformFeeVouchers?: ReconTxnRef[];
  submitting?: boolean;
  submitError?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 確認沖帳彈窗：按下「確認沖帳」後直接顯示本次沖帳的逐筆明細（即 preview 拿到的拆帳結果），
 * 僅「取消」與「確認沖帳」兩個動作，沒有其他選項要選——確認即呼叫沖帳 API。
 */
export default function ReconConfirmSummaryModal({
  open,
  groupLabel,
  side,
  result,
  hasDiff,
  diffAmount,
  isSingleSelection,
  allocationInfoByUuid,
  platformFeeVouchers = [],
  submitting,
  submitError,
  onCancel,
  onConfirm,
}: ReconConfirmSummaryModalProps) {
  if (!open) return null;

  const platformFeeVoucherTotal = platformFeeVouchers.reduce((sum, v) => sum + v.amount, 0);

  // 管道／廠商名稱長度不定，允許斷行；其餘皆為固定格式的筆數與金額，維持不換行
  const rows: { label: string; value: string; wrap: 'nowrap' | 'break'; tone?: 'error' }[] = [
    { label: side === 'receivable' ? '銷售管道' : '廠商', value: groupLabel, wrap: 'break' },
    { label: '本次沖帳', value: `${result.allocations.length} 筆`, wrap: 'nowrap' },
    { label: '沖銷金額', value: fmtCurrency(result.appliedSettleAmount), wrap: 'nowrap' },
    { label: '對帳單金額', value: fmtCurrency(result.settleAmount), wrap: 'nowrap' },
    ...(hasDiff ? [{ label: '差額', value: fmtCurrency(diffAmount), wrap: 'nowrap' as const, tone: 'error' as const }] : []),
  ];

  return (
    <Modal open onClose={onCancel} title="確認沖帳內容" widthClassName="max-w-[840px]">
      <div className="flex flex-col gap-2 text-sm">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="shrink-0 text-neutral-mid">{row.label}</span>
            <span
              className={`font-mono font-semibold tabular-nums ${row.tone === 'error' ? 'text-semantic-error' : 'text-neutral-dark'} ${
                row.wrap === 'nowrap' ? 'whitespace-nowrap' : 'break-all text-right'
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
      {hasDiff && (
        <p className="mt-2 text-xs text-neutral-mid">{isSingleSelection ? '本次沖帳有差額，差額將直接留在該筆交易上' : '本次沖帳有差額，差額將沖入最後一筆交易'}</p>
      )}

      <div className="mt-4">
        <ReconAllocationTable allocations={result.allocations} side={side} allocationInfoByUuid={allocationInfoByUuid} />
      </div>

      {platformFeeVouchers.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-neutral-dark">電商平台扣款憑證</p>
          <div className="flex flex-col gap-2 rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3">
            {platformFeeVouchers.map(v => (
              <div key={v.uuid} className="flex items-center justify-between gap-4 text-sm">
                <span className="min-w-0 truncate text-neutral-dark">
                  {v.date} · {v.voucherNumber || '無憑證號碼'} · {v.counterparty}
                </span>
                <span className="flex shrink-0 items-baseline gap-0.5 font-mono tabular-nums text-neutral-dark">
                  <span className="text-neutral-mid">$</span>
                  {v.amount.toLocaleString('en-US')}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 border-t border-neutral-blue-gray/30 pt-2 text-sm font-semibold">
              <span className="text-neutral-mid">合計</span>
              <span className="flex shrink-0 items-baseline gap-0.5 font-mono tabular-nums text-neutral-dark">
                <span className="text-neutral-mid">$</span>
                {platformFeeVoucherTotal.toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>
      )}

      {submitError && <p className="mt-3 text-sm text-semantic-error">{submitError}</p>}
      <div className="mt-6 flex flex-col gap-3 min-[1300px]:flex-row min-[1300px]:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          取消
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={submitting}>
          {submitting ? '送出中…' : '確認沖帳'}
        </Button>
      </div>
    </Modal>
  );
}
