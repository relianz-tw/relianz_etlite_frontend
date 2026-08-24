'use client';

import { X } from 'lucide-react';
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode, RefObject } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  widthClassName?: string;
  children: ReactNode;
}

interface ModalSurface {
  /** Modal 卡片本身的 DOM 節點，供卡片內覆蓋層（如科目選擇器的左滑面板）用 portal 掛載 */
  cardRef: RefObject<HTMLDivElement>;
  /** 是否有卡片內覆蓋層開啟中；開啟時卡片會長高、且點擊遮罩不關閉 Modal，交由覆蓋層自行處理 */
  overlayOpen: boolean;
  setOverlayOpen: (v: boolean) => void;
}

/** 讓 Modal 內部元件（如 SubjectPicker 的 inDialog 模式）取得卡片掛載點與覆蓋層開關狀態 */
export const ModalSurfaceContext = createContext<ModalSurface | null>(null);

export default function Modal({ open, onClose, title, widthClassName = 'max-w-[480px]', children }: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const surface = useMemo(() => ({ cardRef, overlayOpen, setOverlayOpen }), [overlayOpen]);

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

  // 關閉後歸零覆蓋層狀態，避免下次開啟殘留卡片長高／遮罩不可關閉的狀態
  useEffect(() => {
    if (!open) setOverlayOpen(false);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-neutral-dark/40">
      <div
        className="flex min-h-full items-center justify-center p-4"
        onMouseDown={e => {
          if (overlayOpen) return;
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={`relative w-full overflow-hidden ${widthClassName} rounded-lg bg-white p-4 shadow-level1 nav:p-6 ${
            overlayOpen ? 'min-h-[min(560px,70vh)] transition-[min-height] duration-200' : ''
          }`}
        >
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
          <ModalSurfaceContext.Provider value={surface}>{children}</ModalSurfaceContext.Provider>
        </div>
      </div>
    </div>,
    document.body,
  );
}
