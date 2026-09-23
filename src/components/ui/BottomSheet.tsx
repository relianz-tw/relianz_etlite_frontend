'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** 桌機不掛載的斷點：'nav'（預設，全站唯一斷點 1000px）／'wide'（沖帳中心專用 1300px，
   *  見 DESIGN.md §8 響應式斷點例外） */
  breakpoint?: 'nav' | 'wide';
  /** 面板內容區高度上限：'auto'（預設 80vh）／'tall'（92vh，內容較多如完整明細表時使用） */
  size?: 'auto' | 'tall';
}

// 下拉關閉判定：握把區向下拖曳超過此位移（px）即視為使用者要關閉面板
const DRAG_CLOSE_THRESHOLD = 80;

// 斷點／高度上限一律查表取完整靜態 class 字串，避免字串拼接讓 Tailwind JIT 掃不到
const BREAKPOINT_CLASS: Record<NonNullable<BottomSheetProps['breakpoint']>, string> = {
  nav: 'nav:hidden',
  wide: 'min-[1300px]:hidden',
};
const SIZE_CLASS: Record<NonNullable<BottomSheetProps['size']>, string> = {
  auto: 'max-h-[80vh]',
  tall: 'max-h-[92vh]',
};
// 對應 BREAKPOINT_CLASS 的 CSS 斷點寬度（px），供下方 JS 端判斷「桌機是否已把面板 CSS 隱藏掉」使用，
// 兩邊斷點值須同步：nav 比照 tailwind.config.js 的 theme.screens.nav；wide 比照沖帳中心專用斷點
const BREAKPOINT_PX: Record<NonNullable<BottomSheetProps['breakpoint']>, number> = {
  nav: 1000,
  wide: 1300,
};

/** 目前視窗寬度是否已達到指定斷點（桌機版），用 useSyncExternalStore 而非 useEffect + useState，
 *  避免多一次 render 造成的閃爍；SSR 快照固定回傳桌機，真正的值在 hydration 後由 matchMedia 重新計算。 */
function useIsAboveBreakpoint(px: number): boolean {
  const query = `(min-width: ${px}px)`;
  return useSyncExternalStore(
    callback => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    () => window.matchMedia(query).matches,
    () => true,
  );
}

/**
 * 行動版底部面板（Bottom Sheet）：手機（< nav 1000px，或 breakpoint="wide" 時 < 1300px）下把表單疊在
 * 當前畫面下方，可下拉／點遮罩／Esc 關閉回到原畫面且狀態不流失（見 DESIGN.md「Bottom Sheet（行動版底部
 * 面板）」）。桌機不掛載，呼叫端在桌機改用原本的並排／sticky 面板呈現（見 ReconciliationView 的雙掛載
 * 用法）；桌機是否掛載一律以本元件內部的 useIsAboveBreakpoint 為準，不能只靠呼叫端的 `open` 值——
 * 呼叫端可能在任何寬度都讓 `open` 維持 true（如同一個 previewResult 旗標桌機／行動版共用），
 * 面板必須自己判斷寬度是否已經到達桌機斷點，避免桌機版背景捲動被行動版的鎖定邏輯誤鎖住。
 * Portal／Escape 監聽／鎖背景捲動邏輯比照 Modal.tsx，僅版面（貼底、可下拉關閉）不同，不共用同一元件
 * 是因為兩者的定位與關閉手勢差異夠大，硬共用反而讓 Modal.tsx 條件分支變多。
 */
export default function BottomSheet({ open, onClose, title, children, breakpoint = 'nav', size = 'auto' }: BottomSheetProps) {
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);
  // 呼叫端可能在桌機寬度也讓 open 維持 true（如 ReconciliationView 匯總沖帳步驟 3 桌機／行動版共用同一個
  // previewResult 旗標），此時面板本身只靠 CSS 斷點（BREAKPOINT_CLASS）視覺隱藏、DOM 仍掛著——若照樣鎖背景
  // 捲動／監聽 Escape，會讓桌機版頁面整個卡死無法捲動。故以 visible 取代 open 作為實際「有沒有顯示」的判斷，
  // 寬度不到斷點才真正視為開啟；跨過斷點時 useEffect 的 cleanup 會自動解除已鎖的 overflow。
  const isAboveBreakpoint = useIsAboveBreakpoint(BREAKPOINT_PX[breakpoint]);
  const visible = open && !isAboveBreakpoint;

  useEffect(() => {
    if (!visible) return;
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
  }, [visible, onClose]);

  // 每次開啟重置拖曳位移，避免上次關閉時的殘留位移影響下次開啟的初始位置
  useEffect(() => {
    if (visible) setDragY(0);
  }, [visible]);

  if (!visible) return null;

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
    <div className={`fixed inset-0 z-[55] ${BREAKPOINT_CLASS[breakpoint]}`}>
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
        className={`fixed inset-x-0 bottom-0 z-[60] flex ${SIZE_CLASS[size]} flex-col rounded-t-lg bg-white shadow-level1`}
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
