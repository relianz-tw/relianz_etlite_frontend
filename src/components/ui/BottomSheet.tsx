'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

// 下拉關閉判定：握把區向下拖曳超過此位移（px）即視為使用者要關閉面板
const DRAG_CLOSE_THRESHOLD = 80;

/**
 * 行動版底部面板（Bottom Sheet）：手機（< nav 1000px）下把表單疊在當前畫面下方，可下拉／點遮罩／
 * Esc 關閉回到原畫面且狀態不流失（見 DESIGN.md「Bottom Sheet（行動版底部面板）」）。桌機（nav:hidden）
 * 不掛載，呼叫端在桌機改用原本的並排／sticky 面板呈現（見 ReconciliationView 的雙掛載用法）。
 * Portal／Escape 監聽／鎖背景捲動邏輯比照 Modal.tsx，僅版面（貼底、可下拉關閉）不同，不共用同一元件
 * 是因為兩者的定位與關閉手勢差異夠大，硬共用反而讓 Modal.tsx 條件分支變多。
 */
export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  // 每次開啟重置拖曳位移，避免上次關閉時的殘留位移影響下次開啟的初始位置
  useEffect(() => {
    if (open) setDragY(0);
  }, [open]);

  if (!open) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    setDragY(Math.max(0, delta));
  };
  const handlePointerUp = () => {
    if (dragY > DRAG_CLOSE_THRESHOLD) onClose();
    else setDragY(0);
    dragStartY.current = null;
  };

  return createPortal(
    <div className="fixed inset-0 z-[55] nav:hidden">
      <div
        className="absolute inset-0 bg-neutral-dark/40"
        onMouseDown={e => {
          if (e.target === e.currentTarget) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[80vh] flex-col rounded-t-lg bg-white shadow-level1"
        style={{ transform: `translateY(${dragY}px)`, transition: dragStartY.current === null ? 'transform 200ms ease' : 'none' }}
      >
        <button
          type="button"
          onClick={onClose}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          aria-label="關閉面板"
          className="flex min-h-11 w-full shrink-0 items-center justify-center"
        >
          <span className="h-1 w-10 rounded-full bg-neutral-blue-gray/40" />
        </button>
        {title && (
          <h2 id="bottom-sheet-title" className="shrink-0 px-4 pb-2 font-notoSerif text-base font-semibold text-neutral-dark">
            {title}
          </h2>
        )}
        <div className="overflow-y-auto overscroll-contain px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
