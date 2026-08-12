'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency } from '@/lib/utils';
import type { ReconSettleResult, ReconSide } from '../types';

interface ReconConfirmSummaryModalProps {
  open: boolean;
  groupLabel: string;
  side: ReconSide;
  /** 僅在預覽結果完全平衡（settleAmount === totalBeforeRemaining）時才會開啟此彈窗，見 ReconciliationView */
  result: ReconSettleResult;
  submitting?: boolean;
  submitError?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** 確認沖帳前的摘要覆核：送出前讓使用者再次確認預覽結果與金額，避免手滑誤送 */
export default function ReconConfirmSummaryModal({ open, groupLabel, side, result, submitting, submitError, onCancel, onConfirm }: ReconConfirmSummaryModalProps) {
  if (!open) return null;

  const rows: { label: string; value: string }[] = [
    { label: side === 'receivable' ? '銷售管道' : '廠商', value: groupLabel },
    { label: '本次沖帳', value: `${result.allocations.length} 筆` },
    { label: '沖銷金額', value: fmtCurrency(result.appliedSettleAmount) },
    { label: '對帳單金額', value: fmtCurrency(result.settleAmount) },
  ];

  return (
    <Modal open onClose={onCancel} title="確認沖帳內容" widthClassName="max-w-[420px]">
      <div className="flex flex-col gap-2 text-sm">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-neutral-mid">{row.label}</span>
            <span className="font-mono font-semibold tabular-nums text-neutral-dark">{row.value}</span>
          </div>
        ))}
      </div>
      {submitError && <p className="mt-3 text-sm text-semantic-error">{submitError}</p>}
      <div className="mt-6 flex flex-col gap-3 nav:flex-row nav:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          取消
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={submitting}>
          {submitting ? '送出中…' : '確認送出'}
        </Button>
      </div>
    </Modal>
  );
}
