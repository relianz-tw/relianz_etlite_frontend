'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency } from '@/lib/utils';

interface ReconSurplusModalProps {
  open: boolean;
  groupLabel: string;
  pool: number;
  matched: number;
  surplus: number;
  /** 選擇仍要送出會實際呼叫後端沖帳 API，需顯示送出中狀態與錯誤訊息 */
  submitting?: boolean;
  submitError?: string;
  onBack: () => void;
  onConfirmAnyway: () => void;
}

/**
 * 沖帳金額有餘額且無法完整匹配時的提示：詢問使用者要回去檢查，或僅依目前勾選金額送出
 * （差額不會被記錄，需使用者自行留意帳務對應）。
 */
export default function ReconSurplusModal({ open, groupLabel, pool, matched, surplus, submitting, submitError, onBack, onConfirmAnyway }: ReconSurplusModalProps) {
  if (!open) return null;

  return (
    <Modal open onClose={onBack} title="沖帳金額有餘額" widthClassName="max-w-[460px]">
      <p className="text-sm leading-relaxed text-neutral-dark">
        本次「{groupLabel}」沖帳金額 <span className="font-mono font-semibold tabular-nums">{fmtCurrency(pool)}</span> 元，待沖帳金額{' '}
        <span className="font-mono font-semibold tabular-nums">{fmtCurrency(matched)}</span> 元，仍有{' '}
        <span className="font-mono font-semibold tabular-nums text-semantic-error">{fmtCurrency(surplus)}</span> 元尚未沖入，請問希望：
      </p>
      {submitError && <p className="mt-3 text-sm text-semantic-error">{submitError}</p>}
      <div className="mt-6 flex flex-col gap-3 nav:flex-row nav:justify-end">
        <Button variant="outline" onClick={onBack} disabled={submitting}>
          回去檢查
        </Button>
        <Button variant="primary" onClick={onConfirmAnyway} disabled={submitting}>
          {submitting ? '送出中…' : '仍要送出'}
        </Button>
      </div>
    </Modal>
  );
}
