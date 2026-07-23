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
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-neutral-dark/40">
      <div
        className="flex min-h-full items-center justify-center p-4"
        onMouseDown={e => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className={`w-full ${widthClassName} rounded-lg bg-white p-6 shadow-level1`}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-notoSerif text-lg font-semibold text-neutral-dark">{title}</h2>
            <button type="button" onClick={onClose} aria-label="關閉" className="text-neutral-mid hover:text-neutral-dark">
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
