'use client';

import { cn } from '@/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ResizableSplitPaneProps {
  /** 左側面板內容（如側邊欄） */
  left: React.ReactNode;
  /** 右側面板內容 */
  children: React.ReactNode;
  /** 左側面板初始寬度（px） */
  defaultLeftWidth: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  className?: string;
}

const ARROW_STEP = 16;

/**
 * 兩欄版面，中間分隔線可左右拖曳調整左側面板寬度；僅桌機（nav 斷點以上）顯示分隔線與可拖曳，
 * 手機維持原本堆疊版面（flex-col），與呼叫端既有響應式行為一致。
 */
export default function ResizableSplitPane({ left, children, defaultLeftWidth, minLeftWidth = 160, maxLeftWidth = 480, className }: ResizableSplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(defaultLeftWidth);

  const clamp = useCallback((value: number) => Math.min(maxLeftWidth, Math.max(minLeftWidth, value)), [minLeftWidth, maxLeftWidth]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingRef.current) return;
      setLeftWidth(clamp(startWidthRef.current + (e.clientX - startXRef.current)));
    },
    [clamp],
  );

  const stopDragging = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
    };
  }, [handleMouseMove, stopDragging]);

  const startDragging = (e: React.MouseEvent) => {
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setLeftWidth(w => clamp(w - ARROW_STEP));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setLeftWidth(w => clamp(w + ARROW_STEP));
    }
  };

  return (
    <div className={cn('flex flex-col gap-4 nav:flex-row nav:items-start nav:gap-0', className)}>
      <div className="w-full nav:w-[var(--split-left-width)] nav:shrink-0" style={{ ['--split-left-width' as string]: `${leftWidth}px` }}>
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="調整側欄寬度"
        tabIndex={0}
        onMouseDown={startDragging}
        onKeyDown={handleKeyDown}
        className="hidden shrink-0 nav:mx-2 nav:flex nav:w-2 nav:cursor-col-resize nav:items-stretch nav:justify-center nav:self-stretch focus:outline-none"
      >
        <div className="w-px bg-neutral-blue-gray/30 transition-colors hover:bg-brand-blue" />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
