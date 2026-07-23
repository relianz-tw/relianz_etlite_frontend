'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency } from '@/lib/utils';

interface VoidConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionId: string;
  amount: number;
}

export default function VoidConfirmDialog({ open, onClose, onConfirm, transactionId, amount }: VoidConfirmDialogProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="作廢交易" widthClassName="max-w-[400px]">
      <p className="text-sm leading-relaxed text-neutral-dark">
        確定要作廢交易 <span className="font-mono font-semibold">{transactionId}</span>
        （金額 <span className="font-mono font-semibold">{fmtCurrency(amount)}</span>）嗎？此動作無法復原。
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button variant="danger" onClick={handleConfirm}>
          確定作廢
        </Button>
      </div>
    </Modal>
  );
}
