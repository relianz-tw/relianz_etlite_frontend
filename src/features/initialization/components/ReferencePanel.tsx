'use client';

import Button from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, FileText, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { getFieldBBox } from '../reference/fieldBBoxes';
import { useReference } from '../reference/ReferenceContext';

/** 放大後目標區域約佔視窗的比例 */
const FILL_RATIO = 0.6;
const MAX_ZOOM = 3;
/** 紅框視覺寬度（px），實際邊框寬度要除以放大倍率才不會被放粗 */
const BOX_BORDER_PX = 2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** 追蹤元素的實際尺寸（視窗縮放、圖片載入完成都會變） */
function useElementSize(ref: RefObject<HTMLElement>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
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

  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewport = useElementSize(viewportRef);
  const canvas = useElementSize(canvasRef);

  // 放大並置中目標區域；位移夾在圖片邊界內，避免露出空白
  let scale = 1;
  let tx = 0;
  let ty = 0;
  const activeBox = bbox && bbox.page === page && viewport.w > 0 && canvas.h > 0 ? bbox : null;
  if (activeBox) {
    const boxW = activeBox.w * canvas.w;
    const boxH = activeBox.h * canvas.h;
    scale = clamp(Math.min((viewport.w * FILL_RATIO) / boxW, (viewport.h * FILL_RATIO) / boxH), 1, MAX_ZOOM);
    const centerX = (activeBox.x + activeBox.w / 2) * canvas.w * scale;
    const centerY = (activeBox.y + activeBox.h / 2) * canvas.h * scale;
    tx = clamp(viewport.w / 2 - centerX, Math.min(0, viewport.w - canvas.w * scale), 0);
    ty = clamp(viewport.h / 2 - centerY, Math.min(0, viewport.h - canvas.h * scale), 0);
  }

  const goToPage = (next: number) => {
    // 手動翻頁後不再鎖定在欄位座標的頁
    setFocusedField(null);
    setManualPage(clamp(next, 1, pageCount));
  };

  return (
    <aside aria-label='原件對照' className='sticky top-2 hidden h-[70svh] w-[40%] shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-blue-gray/30 bg-white nav:flex'>
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
          <div ref={viewportRef} className='relative min-h-0 flex-1 overflow-hidden bg-surface-off-white'>
            <div
              ref={canvasRef}
              className='relative w-full origin-top-left transition-transform duration-200 ease-out'
              style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}
            >
              {urls[page - 1] && (
                // eslint-disable-next-line @next/next/no-img-element -- 來源是本地 object URL，next/image 無法最佳化
                <img src={urls[page - 1]} alt={`原件第 ${page} 頁`} className='block h-auto w-full select-none' draggable={false} />
              )}
              {activeBox && (
                <div
                  aria-hidden='true'
                  className='absolute rounded-sm border-semantic-error bg-semantic-error/10'
                  style={{
                    left: `${activeBox.x * 100}%`,
                    top: `${activeBox.y * 100}%`,
                    width: `${activeBox.w * 100}%`,
                    height: `${activeBox.h * 100}%`,
                    borderWidth: BOX_BORDER_PX / scale,
                  }}
                />
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
