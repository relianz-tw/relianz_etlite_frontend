'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

/** 共用刪除確認對話框：供設定頁各分頁（標籤與專案／發票簿／營業狀態紀錄）刪除項目前二次確認 */
export default function ConfirmDeleteDialog({ open, onClose, onConfirm, title, message }: ConfirmDeleteDialogProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={title} widthClassName="max-w-[400px]">
      <p className="text-sm leading-relaxed text-neutral-dark">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button variant="danger" onClick={handleConfirm}>
          確定刪除
        </Button>
      </div>
    </Modal>
  );
}
