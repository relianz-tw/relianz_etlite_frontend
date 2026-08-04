'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency } from '@/lib/utils';

interface ReconConfirmSummaryModalProps {
  open: boolean;
  groupLabel: string;
  side: 'receivable' | 'payable';
  matchedCount: number;
  matchedAmount: number;
  pool: number;
  remaining: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/** 確認沖帳前的摘要覆核：送出前讓使用者再次確認勾選內容與金額，避免手滑誤送 */
export default function ReconConfirmSummaryModal({
  open,
  groupLabel,
  side,
  matchedCount,
  matchedAmount,
  pool,
  remaining,
  onCancel,
  onConfirm,
}: ReconConfirmSummaryModalProps) {
  if (!open) return null;

  const rows: { label: string; value: string }[] = [
    { label: side === 'receivable' ? '銷售管道' : '廠商', value: groupLabel },
    { label: '已勾選', value: `${matchedCount} 筆` },
    { label: '沖銷金額', value: fmtCurrency(matchedAmount) },
    { label: '可沖銷總額', value: fmtCurrency(pool) },
  ];
  if (remaining > 0) rows.push({ label: '差額', value: fmtCurrency(remaining) });

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
      <div className="mt-6 flex flex-col gap-3 nav:flex-row nav:justify-end">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          確認送出
        </Button>
      </div>
    </Modal>
  );
}
