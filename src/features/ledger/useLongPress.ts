'use client';

import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const LONG_PRESS_MS = 500;
const MOVE_CANCEL_THRESHOLD = 10; // px，超過視為滑動而非長按，取消觸發

interface UseLongPressOptions {
  onLongPress: () => void;
}

/** 回傳可掛在卡片上的 pointer 事件處理器：達到長按門檻才觸發 onLongPress，移動過大或提早放開則取消 */
export function useLongPress({ onLongPress }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPos.current = null;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      onLongPress();
      clear();
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!startPos.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_THRESHOLD) clear();
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  };
}
