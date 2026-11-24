'use client';

import Button from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, FileText, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { FieldBBox } from '@/api/peit';
import { pdfToImages } from '@/lib/pdfToImages';

/** 放大後目標區域約佔視窗的比例 */
const FILL_RATIO = 0.6;
const MAX_ZOOM = 3;
/** 手動縮放的範圍與每按一次的倍率（1 ＝ 圖片寬度等於檢視區寬度） */
const MIN_MANUAL_ZOOM = 0.5;
const MAX_MANUAL_ZOOM = 6;
const ZOOM_STEP = 1.25;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 追蹤元素的內容區尺寸（不含捲軸；視窗縮放、面板開關都會變）。
 * 用 callback ref 而不是 useRef + useEffect：元素可能晚於 hook 才出現（先畫空狀態、圖片轉好才畫圖片視窗），
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

interface SourceViewerProps {
  file?: File;
  /** 只顯示這幾頁（原件頁碼，從 1 起）；沒給或都超出實際頁數時顯示整份原件 */
  pages?: number[];
  /** 要框出的位置；座標的頁在顯示範圍內時會自動跳到該頁並放大 */
  bbox: FieldBBox | null;
  /** 工具列右側的額外按鈕（目前是收合對照面板） */
  action?: ReactNode;
  /** 使用者手動翻頁時通知（呼叫端可清掉聚焦欄位，避免又被座標拉回去） */
  onPageNavigate?: () => void;
  /** 沒有檔案時的提示文字 */
  emptyText?: string;
}

/** 原件圖片檢視器：翻頁、依座標放大並捲到目標、疊上紅框。對照面板與座標測試頁共用 */
export function SourceViewer({ file, pages, bbox, onPageNavigate, action, emptyText = '上傳申報書檔案後，可在這裡對照原件' }: SourceViewerProps) {
  const { images, status } = useSourceImages(file);
  // 要顯示的頁（原件的頁碼，從 1 起）；後端沒回頁碼、或頁碼都超出實際頁數時退回整份原件
  const validPages = (pages ?? []).filter(n => n >= 1 && n <= images.length);
  const visiblePages = validPages.length > 0 ? validPages : images.map((_, i) => i + 1);
  const pageCount = visiblePages.length;
  const [manualIndex, setManualIndex] = useState(0);
  // 欄位有座標且在顯示範圍內就跟著座標的頁，否則停在使用者自己翻到的頁
  const bboxIndex = bbox ? visiblePages.indexOf(bbox.page) : -1;
  const index = bboxIndex >= 0 ? bboxIndex : clamp(manualIndex, 0, Math.max(pageCount - 1, 0));
  // 原件的頁碼（圖片、座標都以它為準）
  const page = visiblePages[index] ?? 1;

  // 圖片轉成 object URL 顯示，換檔或卸載時釋放
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const next = images.map(image => URL.createObjectURL(image));
    setUrls(next);
    return () => next.forEach(url => URL.revokeObjectURL(url));
  }, [images]);

  const { ref: viewportRef, element: viewportEl, size: viewport } = useElementSize<HTMLDivElement>();
  // 圖片高寬比：圖片載入後才知道，放大倍率要用它算目標區域的高
  const [ratio, setRatio] = useState(0);

  // 放大靠把圖片撐寬（視窗本身可捲動），不是 CSS transform；這樣沒有座標時也能上下捲動看完整頁
  const activeBox = bbox && bbox.page === page && viewport.w > 0 && ratio > 0 ? bbox : null;
  let autoScale = 1;
  if (activeBox) {
    const boxW = activeBox.w * viewport.w;
    const boxH = activeBox.h * viewport.w * ratio;
    autoScale = clamp(Math.min((viewport.w * FILL_RATIO) / boxW, (viewport.h * FILL_RATIO) / boxH), 1, MAX_ZOOM);
  }

  // 手動縮放：點欄位會依框自動放大（autoScale），之後使用者可再用按鈕或 Ctrl／⌘＋滾輪調整；
  // 換欄位或換頁就失效、回到自動倍率（用 focusKey 比對，不必在 effect 裡重設狀態）
  const focusKey = `${page}:${bbox?.page}:${bbox?.x}:${bbox?.y}:${bbox?.w}:${bbox?.h}`;
  const [manual, setManual] = useState<{ key: string; scale: number } | null>(null);
  const manualScale = manual && manual.key === focusKey ? manual.scale : null;
  // 換欄位／換頁後清掉舊的手動倍率，避免之後又回到同一個欄位時殘留
  useEffect(() => {
    setManual(m => (m && m.key !== focusKey ? null : m));
  }, [focusKey]);
  const scale = manualScale ?? autoScale;
  // 縮放前記下目前檢視區中心在整張圖上的比例，縮放後把同一點捲回中心，不讓畫面跳走
  const anchorRef = useRef<{ cx: number; cy: number } | null>(null);

  const zoomTo = (target: number) => {
    const next = clamp(target, MIN_MANUAL_ZOOM, MAX_MANUAL_ZOOM);
    if (Math.abs(next - scale) < 0.001) return;
    const el = viewportEl;
    if (el && el.scrollWidth > 0 && el.scrollHeight > 0) {
      anchorRef.current = { cx: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth, cy: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight };
    }
    setManual({ key: focusKey, scale: next });
  };
  // 滾輪事件要在 effect 裡掛原生監聽（React 的 onWheel 是 passive，擋不住瀏覽器自己的頁面縮放），用 ref 拿最新的 zoomTo
  const zoomToRef = useRef(zoomTo);
  zoomToRef.current = zoomTo;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  useEffect(() => {
    const el = viewportEl;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return; // 沒按修飾鍵時維持一般捲動；觸控板的雙指縮放瀏覽器會送 ctrl＋滾輪
      e.preventDefault();
      zoomToRef.current(scaleRef.current * Math.exp(-clamp(e.deltaY, -40, 40) * 0.008));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [viewportEl]);

  // 撐寬後把目標區域捲到視窗中央；沒有目標區域時（換頁、清除聚焦）回到最上方
  useLayoutEffect(() => {
    const el = viewportEl;
    if (!el) return;
    const anchor = anchorRef.current;
    if (anchor) {
      // 使用者手動縮放：維持縮放前檢視區中心所在的那一點，不要跳去框的位置
      anchorRef.current = null;
      el.scrollLeft = anchor.cx * el.scrollWidth - el.clientWidth / 2;
      el.scrollTop = anchor.cy * el.scrollHeight - el.clientHeight / 2;
      return;
    }
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
    onPageNavigate?.();
    setManualIndex(clamp(next, 0, pageCount - 1));
  };

  if (pageCount === 0) {
    return (
      <>
        {action && <div className='flex items-center justify-end border-b border-neutral-blue-gray/30 px-3 py-2'>{action}</div>}
        <div className='flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center'>
          <FileText size={24} className='text-neutral-mid' />
          <p className='text-sm text-neutral-mid'>
            {status === 'loading' ? '對照圖片載入中…' : status === 'error' ? '對照圖片產生失敗，請重新上傳檔案' : emptyText}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b border-neutral-blue-gray/30 px-3 py-2'>
        <div className='flex items-center gap-1'>
          <Button variant='ghost' size='sm' icon={ChevronLeft} aria-label='上一頁' disabled={index <= 0} onClick={() => goToIndex(index - 1)} />
          <span className='px-1 text-xs text-neutral-mid'>
            第 {index + 1} / {pageCount} 頁
          </span>
          <Button variant='ghost' size='sm' icon={ChevronRight} aria-label='下一頁' disabled={index >= pageCount - 1} onClick={() => goToIndex(index + 1)} />
        </div>
        <div className='flex items-center gap-1'>
          <div className='flex items-center gap-1' title='Ctrl／⌘ ＋ 滾輪也可以縮放'>
            <Button variant='ghost' size='sm' icon={ZoomOut} aria-label='縮小' disabled={scale <= MIN_MANUAL_ZOOM + 0.001} onClick={() => zoomTo(scale / ZOOM_STEP)} />
            <span className='w-12 text-center text-xs tabular-nums text-neutral-mid'>{Math.round(scale * 100)}%</span>
            <Button variant='ghost' size='sm' icon={ZoomIn} aria-label='放大' disabled={scale >= MAX_MANUAL_ZOOM - 0.001} onClick={() => zoomTo(scale * ZOOM_STEP)} />
            <Button variant='ghost' size='sm' icon={RotateCcw} aria-label='重設縮放' disabled={manualScale === null} onClick={() => setManual(null)} />
          </div>
          {action}
        </div>
      </div>
      <div ref={viewportRef} className='min-h-0 flex-1 overflow-auto bg-surface-off-white [scrollbar-width:thin]'>
        <div className='relative mx-auto' style={{ width: `${scale * 100}%` }}>
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
              className='absolute rounded-sm border-2 border-semantic-error/50 bg-semantic-error/10'
              style={{ left: `${activeBox.x * 100}%`, top: `${activeBox.y * 100}%`, width: `${activeBox.w * 100}%`, height: `${activeBox.h * 100}%` }}
            />
          )}
        </div>
      </div>
    </>
  );
}
