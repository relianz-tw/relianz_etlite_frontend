'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /** 確認內容，可傳字串或含強調文字的 ReactNode（如刪除警語） */
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 一定要選一個時設 false：不給關閉鈕、Escape 與點遮罩都不關（取消仍可按） */
  dismissible?: boolean;
}

/** 通用刪除／危險操作確認彈窗，取代各處各自複製的 AlertDialog 樣式（見 VoidConfirmDialog 的 Modal 包法） */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '確認刪除',
  cancelLabel = '取消',
  dismissible = true,
}: ConfirmDialogProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={title} widthClassName="max-w-[420px]" dismissible={dismissible}>
      <div className="text-sm leading-relaxed text-neutral-dark">{message}</div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
