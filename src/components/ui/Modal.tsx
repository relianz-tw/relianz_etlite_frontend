'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  widthClassName?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, widthClassName = 'max-w-[480px]', children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    // 鎖住背景捲動：手機上內容較短的彈窗（overlay 本身無可捲空間）touchmove 會直接捲動背景頁面，
    // 使用者容易失去位置感，關閉後還原原本的 overflow 設定
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-neutral-dark/40">
      <div
        className="flex min-h-full items-center justify-center p-4"
        onMouseDown={e => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`w-full ${widthClassName} rounded-lg bg-white p-4 shadow-level1 nav:p-6`}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 id="modal-title" className="font-notoSerif text-lg font-semibold text-neutral-dark">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉"
              className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center text-neutral-mid hover:text-neutral-dark"
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
