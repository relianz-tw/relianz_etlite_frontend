'use client';

import Button from '@/components/ui/Button';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { FieldBBox } from '@/api/peit';
import { useReference } from '../reference/ReferenceContext';
import { useInitialization } from '../state/InitializationContext';
import { SourceViewer } from './SourceViewer';

/** InitializationLayout 的捲動區 id，展開時內容欄寬度與留白的 CSS 變數寫在它身上 */
const SCROLL_CONTAINER_ID = 'initialization-scroll';
/** 展開時內容欄最寬與左右留白（預設 1200px／1.5rem），把空間讓給表單與面板 */
const EXPANDED_CONTENT_MAX_W = '1680px';
const EXPANDED_CONTENT_PX = '1rem';

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

/**
 * 表單區與對照面板並排；每頁表單各掛一份，離開該頁時清掉聚焦欄位，避免下一頁沿用上一頁的紅框。
 * hasReference：這一頁有沒有辨識過的原件。沒有就完全不出現對照（連展開按鈕都不給），有就自動展開。
 */
export function ReferenceLayout({ reportKey, file, hasReference, children }: { reportKey: string; file?: File; hasReference: boolean; children: ReactNode }) {
  const { open, toggleOpen, autoOpen, setFocusedField } = useReference();
  useEffect(() => () => setFocusedField(null), [setFocusedField]);
  useEffect(() => autoOpen(hasReference), [autoOpen, hasReference]);
  const expanded = hasReference && open;

  // 展開時把內容欄加寬、左右留白縮小（寫在捲動區上，InitializationLayout 與固定操作列都讀同一組變數，才會對齊）；收合或離開此頁時還原
  useEffect(() => {
    const scroller = document.getElementById(SCROLL_CONTAINER_ID);
    if (!expanded || !scroller) return;
    scroller.style.setProperty('--init-content-max-w', EXPANDED_CONTENT_MAX_W);
    scroller.style.setProperty('--init-content-px', EXPANDED_CONTENT_PX);
    return () => {
      scroller.style.removeProperty('--init-content-max-w');
      scroller.style.removeProperty('--init-content-px');
    };
  }, [expanded]);

  return (
    <div className='flex items-start gap-4 nav:gap-5'>
      <div className='flex min-w-0 flex-1 flex-col gap-4 nav:gap-5'>
        {/* 收合後把展開按鈕放回表單最上方靠右，不要浮在版面外側；手機不提供對照面板 */}
        {hasReference && !open && (
          <div className='hidden justify-end nav:flex'>
            <Button variant='outline' size='sm' icon={PanelRightOpen} onClick={() => toggleOpen(true)}>
              對照原件
            </Button>
          </div>
        )}
        {children}
      </div>
      {expanded && <ReferencePanel reportKey={reportKey} file={file} />}
    </div>
  );
}

/**
 * 下載後端辨識用的頁面圖片。後端做過轉正／透視校正時，框的座標是相對這張圖，
 * 用使用者上傳的原檔顯示會偏掉。下載失敗就回 undefined，呼叫端退回用原檔。
 */
function useBackendPageImage(url: string | undefined): File | undefined {
  const [image, setImage] = useState<File>();
  useEffect(() => {
    if (!url) {
      setImage(undefined);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(String(response.status));
        const blob = await response.blob();
        if (!cancelled) setImage(new File([blob], url.split('/').pop() ?? 'page.png', { type: blob.type }));
      } catch {
        // 取不到就讓畫面退回顯示原件，不打斷使用者
        if (!cancelled) setImage(undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);
  return image;
}

function ReferencePanel({ reportKey, file }: { reportKey: string; file?: File }) {
  const { sourceFiles, focusedField, setFocusedField, toggleOpen } = useReference();
  const { state } = useInitialization();
  // 聚焦欄位的原件位置（辨識時存進 state）；沒有座標的欄位不畫框
  const location = focusedField ? (state.fieldLocations[reportKey]?.[focusedField] ?? null) : null;
  const bbox: FieldBBox | null = location;
  // 這張表辨識自哪份原件、在哪幾頁（後端回的 pages）：面板只顯示這幾頁，不顯示整份原件
  const formSource = state.formSources[reportKey];
  // 顯示哪份原件：401／403 用該期自己的檔案；營所稅用這張表辨識自的那份，再來是欄位位置指向的那份，都沒有用最新上傳的
  const uploadedFile = file ?? sourceFiles.find(s => s.id === (formSource?.sourceId ?? location?.sourceId))?.file ?? sourceFiles[sourceFiles.length - 1]?.file;
  // 後端辨識時用的頁面圖片：bbox 是相對它算的，有就優先顯示，沒有才退回自己把原件轉圖
  const backendImage = useBackendPageImage(formSource?.imageUrl);
  const sourceFile = backendImage ?? uploadedFile;
  const scrollerHeight = useScrollerHeight();

  return (
    <aside
      aria-label='原件對照'
      // 上方 top-2、下方再留 0.5rem，剛好貼在固定操作列上緣；還沒量到捲動區高度前先用 70svh
      style={{ height: scrollerHeight > 0 ? `calc(${scrollerHeight}px - var(--init-action-bar-h, 0px) - 1rem)` : '70svh' }}
      className='sticky top-2 hidden min-h-64 w-[40%] shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-blue-gray/30 bg-white nav:flex'
    >
      {/* 後端的圖已經是該表那一頁，不需要再依 pages 篩頁 */}
      <SourceViewer
        file={sourceFile}
        pages={backendImage ? undefined : formSource?.pages}
        bbox={bbox}
        onPageNavigate={() => setFocusedField(null)}
        action={<Button variant='ghost' size='sm' icon={PanelRightClose} aria-label='收合對照' onClick={() => toggleOpen(false)} />}
      />
    </aside>
  );
}
