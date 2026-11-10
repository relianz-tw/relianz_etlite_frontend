'use client';

import { PAPER_PREVIEWS } from '../reports/paperPreviews';
import Button from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog';
import { FileText } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import type { SettlementReportId } from '../state/initializationReducer';

interface FormPaperPreviewProps {
  formCode: SettlementReportId;
}

/** 對應紙本：與標題同一排的按鈕；點擊開啟可捲動的大圖（含頁碼說明），讓使用者對照紙本填寫 */
export function FormPaperPreview({ formCode }: FormPaperPreviewProps) {
  const [open, setOpen] = useState(false);
  const preview = PAPER_PREVIEWS[formCode];
  if (!preview) return null;
  // next/image 的 url 參數不會自動補 basePath，需自行帶上 '/etlite'（對齊 next.config.js）
  const src = `/etlite/form-previews/${preview.image}`;
  // hover 時先把大圖抓進瀏覽器快取，點開時多半已載入完成
  const prefetchLarge = () => {
    new window.Image().src = src;
  };

  return (
    <>
      {/* 用暖棕實心（warm）與藍色的上一頁／下一頁區隔，讓範例文件入口一眼可見 */}
      <Button variant='warm' size='sm' icon={FileText} className='shrink-0 self-start' onClick={() => setOpen(true)} onPointerEnter={prefetchLarge}>
        查看範例文件
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-3 p-4 md:p-5'>
          <div className='flex flex-col gap-1 pr-8'>
            <DialogTitle className='leading-snug'>{preview.pageLabel}</DialogTitle>
            <DialogDescription>{preview.caption}・可捲動查看完整頁面</DialogDescription>
          </div>
          <div className='min-h-0 flex-1 overflow-auto rounded-lg border border-neutral-blue-gray/30 bg-white'>
            {/* 大圖寬度跟著對話框，高度依原圖比例自然撐開，由外層捲動 */}
            {/* 原圖已壓縮到 2000px，直接吃靜態檔，省掉 next/image 第一次請求的即時轉檔時間 */}
            <Image src={src} alt={`${preview.pageLabel}範本`} width={1600} height={2263} unoptimized className='h-auto w-full' />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
