'use client';

import Button from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, FileText, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import type { FieldBBox } from '@/api/peit';
import { pdfToImages } from '@/lib/pdfToImages';
import { useReference } from '../reference/ReferenceContext';
import { useInitialization } from '../state/InitializationContext';

/** InitializationLayout 的捲動區 id，展開時內容欄寬度與留白的 CSS 變數寫在它身上 */
const SCROLL_CONTAINER_ID = 'initialization-scroll';
/** 展開時內容欄最寬與左右留白（預設 1200px／1.5rem），把空間讓給表單與面板 */
const EXPANDED_CONTENT_MAX_W = '1680px';
const EXPANDED_CONTENT_PX = '1rem';

/** 紅框比辨識座標各邊多留的空間（頁面寬高的比例）：辨識框常貼著文字邊緣，外擴一點才框得完整、看得舒服 */
const BOX_PAD_X = 0.01;
const BOX_PAD_Y = 0.006;

/** 把辨識座標外擴固定的邊距，並夾在頁面範圍內（0–1）；放大倍率與紅框都用外擴後的框 */
function padBBox(box: FieldBBox): FieldBBox {
  const x = Math.max(0, box.x - BOX_PAD_X);
  const y = Math.max(0, box.y - BOX_PAD_Y);
  return { page: box.page, x, y, w: Math.min(1, box.x + box.w + BOX_PAD_X) - x, h: Math.min(1, box.y + box.h + BOX_PAD_Y) - y };
}

/** 放大後目標區域約佔視窗的比例 */
const FILL_RATIO = 0.6;
const MAX_ZOOM = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 追蹤元素的內容區尺寸（不含捲軸；視窗縮放、面板開關都會變）。
 * 用 callback ref 而不是 useRef + useEffect：元素可能晚於 hook 才出現（面板先畫空狀態、圖片轉好才畫圖片視窗），
 * useEffect 只在掛載時量一次，那時元素還不存在，之後就再也量不到。
 */
function useElementSize<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!element) return;
    const update = () => setSize({ w: element.clientWidth, h: element.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return { ref: setElement, element, size };
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

const imageCache = new WeakMap<File, Promise<File[]>>();

/** 原件轉成每頁一張圖（PDF 切頁、圖片原樣）；同一份檔案只轉一次，切換欄位、換頁都吃快取 */
function loadSourceImages(file: File): Promise<File[]> {
  let cached = imageCache.get(file);
  if (!cached) {
    // 從後端取回的檔案 Content-Type 不一定可靠，PDF 另以副檔名判斷
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    cached = isPdf ? pdfToImages(file) : Promise.resolve([file]);
    imageCache.set(file, cached);
  }
  return cached;
}

type ImagesStatus = 'empty' | 'loading' | 'ready' | 'error';

function useSourceImages(file: File | undefined): { images: File[]; status: ImagesStatus } {
  const [result, setResult] = useState<{ images: File[]; status: ImagesStatus }>({ images: [], status: 'empty' });
  useEffect(() => {
    if (!file) {
      setResult({ images: [], status: 'empty' });
      return;
    }
    let cancelled = false;
    setResult({ images: [], status: 'loading' });
    loadSourceImages(file)
      .then(images => !cancelled && setResult({ images, status: 'ready' }))
      .catch(() => {
        // 失敗不留快取，下次點欄位可以重試
        imageCache.delete(file);
        if (!cancelled) setResult({ images: [], status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [file]);
  return result;
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
export function ReferenceLayout({ reportKey, file, children }: { reportKey: string; file?: File; children: ReactNode }) {
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
      {open && <ReferencePanel reportKey={reportKey} file={file} />}
    </div>
  );
}

function ReferencePanel({ reportKey, file }: { reportKey: string; file?: File }) {
  const { sourceFiles, focusedField, setFocusedField } = useReference();
  const { state } = useInitialization();
  // 聚焦欄位的原件位置（辨識時存進 state）；沒有座標的欄位不畫框
  const location = focusedField ? (state.fieldLocations[reportKey]?.[focusedField] ?? null) : null;
  const bbox: FieldBBox | null = location;
  // 這張表辨識自哪份原件、在哪幾頁（後端回的 pages）：面板只顯示這幾頁，不顯示整份原件
  const formSource = state.formSources[reportKey];
  // 顯示哪份原件：401／403 用該期自己的檔案；營所稅用這張表辨識自的那份，再來是欄位位置指向的那份，都沒有用最新上傳的
  const sourceFile = file ?? sourceFiles.find(s => s.id === (formSource?.sourceId ?? location?.sourceId))?.file ?? sourceFiles[sourceFiles.length - 1]?.file;
  const { images, status } = useSourceImages(sourceFile);
  // 要顯示的頁（原件的頁碼，從 1 起）；後端沒回頁碼、或頁碼都超出實際頁數時退回整份原件
  const validPages = (formSource?.pages ?? []).filter(n => n >= 1 && n <= images.length);
  const visiblePages = validPages.length > 0 ? validPages : images.map((_, i) => i + 1);
  const pageCount = visiblePages.length;
  const [manualIndex, setManualIndex] = useState(0);
  // 聚焦欄位有座標且在顯示範圍內就跟著座標的頁，否則停在使用者自己翻到的頁
  const bboxIndex = bbox ? visiblePages.indexOf(bbox.page) : -1;
  const index = bboxIndex >= 0 ? bboxIndex : clamp(manualIndex, 0, Math.max(pageCount - 1, 0));
  // 原件的頁碼（圖片、座標都以它為準）
  const page = visiblePages[index] ?? 1;

  // 圖片轉成 object URL 顯示，換檔或卸載時釋放
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const next = images.map(file => URL.createObjectURL(file));
    setUrls(next);
    return () => next.forEach(url => URL.revokeObjectURL(url));
  }, [images]);

  const scrollerHeight = useScrollerHeight();
  const { ref: viewportRef, element: viewportEl, size: viewport } = useElementSize<HTMLDivElement>();
  // 圖片高寬比：圖片載入後才知道，放大倍率要用它算目標區域的高
  const [ratio, setRatio] = useState(0);

  // 放大靠把圖片撐寬（視窗本身可捲動），不是 CSS transform；這樣沒有座標時也能上下捲動看完整頁
  const activeBox = bbox && bbox.page === page && viewport.w > 0 && ratio > 0 ? padBBox(bbox) : null;
  let scale = 1;
  if (activeBox) {
    const boxW = activeBox.w * viewport.w;
    const boxH = activeBox.h * viewport.w * ratio;
    scale = clamp(Math.min((viewport.w * FILL_RATIO) / boxW, (viewport.h * FILL_RATIO) / boxH), 1, MAX_ZOOM);
  }

  // 撐寬後把目標區域捲到視窗中央；沒有目標區域時（換頁、清除聚焦）回到最上方
  useLayoutEffect(() => {
    const el = viewportEl;
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
  }, [viewportEl, activeBox?.page, activeBox?.x, activeBox?.y, activeBox?.w, activeBox?.h, scale, page]);

  const goToIndex = (next: number) => {
    // 手動翻頁後不再鎖定在欄位座標的頁
    setFocusedField(null);
    setManualIndex(clamp(next, 0, pageCount - 1));
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
          <p className='text-sm text-neutral-mid'>
            {status === 'loading' ? '對照圖片載入中…' : status === 'error' ? '對照圖片產生失敗，請重新上傳檔案' : '上傳申報書檔案後，可在這裡對照原件'}
          </p>
        </div>
      ) : (
        <>
          <div className='flex items-center justify-between border-b border-neutral-blue-gray/30 px-3 py-2'>
            <Button variant='ghost' size='sm' icon={ChevronLeft} aria-label='上一頁' disabled={index <= 0} onClick={() => goToIndex(index - 1)} />
            <span className='text-xs text-neutral-mid'>
              第 {index + 1} / {pageCount} 頁
            </span>
            <Button variant='ghost' size='sm' icon={ChevronRight} aria-label='下一頁' disabled={index >= pageCount - 1} onClick={() => goToIndex(index + 1)} />
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
