'use client';

import Button from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, FileText, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { getFieldBBox } from '../reference/fieldBBoxes';
import { useReference } from '../reference/ReferenceContext';

/** InitializationLayout 的捲動區 id，展開時內容欄寬度與留白的 CSS 變數寫在它身上 */
const SCROLL_CONTAINER_ID = 'initialization-scroll';
/** 展開時內容欄最寬與左右留白（預設 1200px／1.5rem），把空間讓給表單與面板 */
const EXPANDED_CONTENT_MAX_W = '1680px';
const EXPANDED_CONTENT_PX = '1rem';

/** 放大後目標區域約佔視窗的比例 */
const FILL_RATIO = 0.6;
const MAX_ZOOM = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** 追蹤元素的內容區尺寸（不含捲軸；視窗縮放、面板開關都會變） */
function useElementSize(ref: RefObject<HTMLElement>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/**
 * 捲動區的可視高度。面板要貼齊底部固定操作列上緣：高度 = 可視高度 − 操作列高度（--init-action-bar-h，
 * StepPageHeader 量測後寫在捲動區上）− 上下各一點留白，所以得知道捲動區實際多高；尚未量到時回 0。
 */
function useScrollerHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const scroller = document.getElementById(SCROLL_CONTAINER_ID);
    if (!scroller) return;
    const update = () => setHeight(scroller.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);
  return height;
}

/** 頁首的展開／收合按鈕，只在桌機出現（手機不提供對照面板） */
export function ReferenceToggle() {
  const { open, setOpen } = useReference();
  return (
    <Button variant='outline' size='sm' icon={open ? PanelRightClose : PanelRightOpen} className='hidden shrink-0 self-start nav:inline-flex' onClick={() => setOpen(!open)}>
      {open ? '收合對照' : '對照原件'}
    </Button>
  );
}

/** 表單區與對照面板並排；每頁表單各掛一份，離開該頁時清掉聚焦欄位，避免下一頁沿用上一頁的紅框 */
export function ReferenceLayout({ children }: { children: ReactNode }) {
  const { open, setFocusedField } = useReference();
  useEffect(() => () => setFocusedField(null), [setFocusedField]);

  // 展開時把內容欄加寬、左右留白縮小（寫在捲動區上，InitializationLayout 與固定操作列都讀同一組變數，才會對齊）；收合或離開此頁時還原
  useEffect(() => {
    const scroller = document.getElementById(SCROLL_CONTAINER_ID);
    if (!open || !scroller) return;
    scroller.style.setProperty('--init-content-max-w', EXPANDED_CONTENT_MAX_W);
    scroller.style.setProperty('--init-content-px', EXPANDED_CONTENT_PX);
    return () => {
      scroller.style.removeProperty('--init-content-max-w');
      scroller.style.removeProperty('--init-content-px');
    };
  }, [open]);

  return (
    <div className='flex items-start gap-4 nav:gap-5'>
      <div className='flex min-w-0 flex-1 flex-col gap-4 nav:gap-5'>{children}</div>
      {open && <ReferencePanel />}
    </div>
  );
}

function ReferencePanel() {
  const { images, focusedField, setFocusedField } = useReference();
  const bbox = getFieldBBox(focusedField);
  const [manualPage, setManualPage] = useState(1);
  const pageCount = images.length;
  // 聚焦欄位有座標時跟著座標的頁，否則停在使用者自己翻到的頁；座標頁超出實際頁數時退回第一頁
  const page = clamp(bbox ? bbox.page : manualPage, 1, Math.max(pageCount, 1));

  // 圖片轉成 object URL 顯示，換檔或卸載時釋放
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const next = images.map(file => URL.createObjectURL(file));
    setUrls(next);
    return () => next.forEach(url => URL.revokeObjectURL(url));
  }, [images]);

  const scrollerHeight = useScrollerHeight();
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewport = useElementSize(viewportRef);
  // 圖片高寬比：圖片載入後才知道，放大倍率要用它算目標區域的高
  const [ratio, setRatio] = useState(0);

  // 放大靠把圖片撐寬（視窗本身可捲動），不是 CSS transform；這樣沒有座標時也能上下捲動看完整頁
  const activeBox = bbox && bbox.page === page && viewport.w > 0 && ratio > 0 ? bbox : null;
  let scale = 1;
  if (activeBox) {
    const boxW = activeBox.w * viewport.w;
    const boxH = activeBox.h * viewport.w * ratio;
    scale = clamp(Math.min((viewport.w * FILL_RATIO) / boxW, (viewport.h * FILL_RATIO) / boxH), 1, MAX_ZOOM);
  }

  // 撐寬後把目標區域捲到視窗中央；沒有目標區域時（換頁、清除聚焦）回到最上方
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    if (!activeBox) {
      el.scrollTo({ top: 0, left: 0 });
      return;
    }
    const canvasW = viewport.w * scale;
    const canvasH = canvasW * ratio;
    el.scrollTo({
      left: (activeBox.x + activeBox.w / 2) * canvasW - viewport.w / 2,
      top: (activeBox.y + activeBox.h / 2) * canvasH - viewport.h / 2,
      behavior: 'smooth',
    });
    // 只在目標區域或倍率改變時捲動，視窗尺寸變動不要打斷使用者自己捲的位置
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBox?.page, activeBox?.x, activeBox?.y, activeBox?.w, activeBox?.h, scale, page]);

  const goToPage = (next: number) => {
    // 手動翻頁後不再鎖定在欄位座標的頁
    setFocusedField(null);
    setManualPage(clamp(next, 1, pageCount));
  };

  return (
    <aside
      aria-label='原件對照'
      // 上方 top-2、下方再留 0.5rem，剛好貼在固定操作列上緣；還沒量到捲動區高度前先用 70svh
      style={{ height: scrollerHeight > 0 ? `calc(${scrollerHeight}px - var(--init-action-bar-h, 0px) - 1rem)` : '70svh' }}
      className='sticky top-2 hidden min-h-64 w-[40%] shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-blue-gray/30 bg-white nav:flex'
    >
      {pageCount === 0 ? (
        <div className='flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center'>
          <FileText size={24} className='text-neutral-mid' />
          <p className='text-sm text-neutral-mid'>上傳申報書檔案後，可在這裡對照原件</p>
        </div>
      ) : (
        <>
          <div className='flex items-center justify-between border-b border-neutral-blue-gray/30 px-3 py-2'>
            <Button variant='ghost' size='sm' icon={ChevronLeft} aria-label='上一頁' disabled={page <= 1} onClick={() => goToPage(page - 1)} />
            <span className='text-xs text-neutral-mid'>
              第 {page} / {pageCount} 頁
            </span>
            <Button variant='ghost' size='sm' icon={ChevronRight} aria-label='下一頁' disabled={page >= pageCount} onClick={() => goToPage(page + 1)} />
          </div>
          <div ref={viewportRef} className='min-h-0 flex-1 overflow-auto bg-surface-off-white [scrollbar-width:thin]'>
            <div className='relative' style={{ width: `${scale * 100}%` }}>
              {urls[page - 1] && (
                // eslint-disable-next-line @next/next/no-img-element -- 來源是本地 object URL，next/image 無法最佳化
                <img
                  src={urls[page - 1]}
                  alt={`原件第 ${page} 頁`}
                  className='block h-auto w-full select-none'
                  draggable={false}
                  onLoad={e => setRatio(e.currentTarget.naturalHeight / e.currentTarget.naturalWidth)}
                />
              )}
              {activeBox && (
                <div
                  aria-hidden='true'
                  className='absolute rounded-sm border-2 border-semantic-error bg-semantic-error/10'
                  style={{ left: `${activeBox.x * 100}%`, top: `${activeBox.y * 100}%`, width: `${activeBox.w * 100}%`, height: `${activeBox.h * 100}%` }}
                />
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
