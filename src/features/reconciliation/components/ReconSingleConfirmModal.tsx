'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { getSettlementStatusBadge } from '@/lib/settlementStatus';
import { fmtCurrency } from '@/lib/utils';
import type { ReconSide, ReconTxnRef } from '../types';

interface ReconSingleConfirmModalProps {
  open: boolean;
  side: ReconSide;
  row: ReconTxnRef;
  settleAmount: number;
  actualAmount: number;
  submitting?: boolean;
  submitError?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** 單筆沖帳前的確認彈窗：送出前列出該筆交易與沖帳金額明細，讓使用者再次確認，避免手滑誤送 */
export default function ReconSingleConfirmModal({ open, side, row, settleAmount, actualAmount, submitting, submitError, onCancel, onConfirm }: ReconSingleConfirmModalProps) {
  if (!open) return null;

  const remaining = row.remainingAmount ?? row.amount;
  // 沖帳金額 vs 待沖金額比較出前端可預先推估的拆帳狀態，實際結果仍以後端回應為準（0平衡 1超沖 2少沖）
  const projectedStatus = settleAmount === remaining ? 0 : settleAmount > remaining ? 1 : 2;
  const statusBadge = getSettlementStatusBadge(projectedStatus);

  const rows: { label: string; value: string }[] = [
    { label: '開立日期', value: row.date },
    { label: '交易編號', value: row.orderCode || '—' },
    { label: '待沖金額', value: fmtCurrency(remaining) },
    { label: '沖帳金額', value: fmtCurrency(settleAmount) },
    { label: side === 'payable' ? '實際付出金額' : '實際存入金額', value: fmtCurrency(actualAmount) },
  ];

  return (
    <Modal open onClose={onCancel} title="確認沖帳內容" widthClassName="max-w-[420px]">
      <div className="flex flex-col gap-2 text-sm">
        {rows.map(row2 => (
          <div key={row2.label} className="flex items-center justify-between">
            <span className="text-neutral-mid">{row2.label}</span>
            <span className="font-mono font-semibold tabular-nums text-neutral-dark">{row2.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <span className="text-neutral-mid">沖帳後狀態</span>
          <Badge tone={statusBadge.tone} variant="muted">
            {statusBadge.label}
          </Badge>
        </div>
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
