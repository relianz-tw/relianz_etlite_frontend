'use client';

import type { EntryDetailSettleEventDto } from '@/api/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency, formatYyyymmdd } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface SettlementReverseConfirmModalProps {
  open: boolean;
  event: EntryDetailSettleEventDto | null;
  submitting?: boolean;
  submitError?: string;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * 恢復沖帳紀錄前的確認彈窗。匯總沖帳（reconMethod=2）撤銷時，後端會一併恢復當初同批沖帳的所有交易，
 * 故額外加上警示文字，避免使用者誤以為只會影響當前這筆交易。
 */
export default function SettlementReverseConfirmModal({ open, event, submitting, submitError, onClose, onConfirm }: SettlementReverseConfirmModalProps) {
  if (!open || !event) return null;

  const isSummary = event.reconMethod === 2;

  return (
    <Modal open onClose={onClose} title="恢復沖帳紀錄" widthClassName="max-w-[420px]">
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-neutral-mid">沖帳日期</span>
          <span className="font-mono font-semibold tabular-nums text-neutral-dark">{formatYyyymmdd(event.paymentDate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-mid">沖帳金額</span>
          <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(event.settleAmount)}</span>
        </div>
      </div>

      {isSummary ? (
        <div className="mt-4 flex items-start gap-2 rounded-md bg-semantic-error/10 p-3 text-sm text-semantic-error">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>此筆為匯總沖帳，恢復後系統會一併恢復當初同批沖帳的所有交易，確定要恢復嗎？</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-neutral-mid">恢復後此筆沖帳紀錄將被撤銷，交易會回到未沖帳金額。</p>
      )}

      {submitError && <p className="mt-3 text-sm text-semantic-error">{submitError}</p>}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          取消
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={submitting}>
          {submitting ? '處理中…' : '確定恢復'}
        </Button>
      </div>
    </Modal>
  );
}
