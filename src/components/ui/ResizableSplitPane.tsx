'use client';

import { cn } from '@/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ResizableSplitPaneProps {
  /** 固定寬度面板內容（如側邊欄／金額面板） */
  panel: React.ReactNode;
  /** 彈性寬度面板內容 */
  children: React.ReactNode;
  /** 固定寬度面板初始寬度（px） */
  defaultPanelWidth: number;
  minPanelWidth?: number;
  maxPanelWidth?: number;
  /** 固定寬度面板要排在哪一側，預設左側；手機（<nav 斷點）一律 panel 在下、children 在上，
   * 與桌機的閱讀順序（先看 children 內容、panel 提供輸入）保持一致 */
  panelSide?: 'left' | 'right';
  className?: string;
}

const ARROW_STEP = 16;

/**
 * 兩欄版面，中間分隔線可左右拖曳調整固定寬度面板的寬度；僅桌機（nav 斷點以上）顯示分隔線與可拖曳，
 * 手機維持原本堆疊版面（flex-col）。panelSide='right' 時拖曳方向與方向鍵皆反向
 * （固定欄在右側時，滑鼠往左拖／按左鍵是把面板變寬）。
 */
export default function ResizableSplitPane({
  panel,
  children,
  defaultPanelWidth,
  minPanelWidth = 160,
  maxPanelWidth = 480,
  panelSide = 'left',
  className,
}: ResizableSplitPaneProps) {
  const [panelWidth, setPanelWidth] = useState(defaultPanelWidth);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(defaultPanelWidth);
  const directionSign = panelSide === 'right' ? -1 : 1;

  const clamp = useCallback((value: number) => Math.min(maxPanelWidth, Math.max(minPanelWidth, value)), [minPanelWidth, maxPanelWidth]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingRef.current) return;
      setPanelWidth(clamp(startWidthRef.current + directionSign * (e.clientX - startXRef.current)));
    },
    [clamp, directionSign],
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
    startWidthRef.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPanelWidth(w => clamp(w - directionSign * ARROW_STEP));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPanelWidth(w => clamp(w + directionSign * ARROW_STEP));
    }
  };

  const panelEl = (
    <div className="w-full nav:w-[var(--split-panel-width)] nav:shrink-0" style={{ ['--split-panel-width' as string]: `${panelWidth}px` }}>
      {panel}
    </div>
  );
  const separatorEl = (
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
  );
  const childrenEl = <div className="min-w-0 flex-1">{children}</div>;

  return (
    <div className={cn('flex flex-col gap-4 nav:flex-row nav:items-start nav:gap-0', className)}>
      {panelSide === 'left' ? (
        <>
          {panelEl}
          {separatorEl}
          {childrenEl}
        </>
      ) : (
        <>
          {childrenEl}
          {separatorEl}
          {panelEl}
        </>
      )}
    </div>
  );
}
