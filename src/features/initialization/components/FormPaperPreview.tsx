'use client';

import { PAPER_PREVIEWS } from '../reports/paperPreviews';
import Button from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';
import { ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import type { SettlementReportId } from '../state/initializationReducer';

interface FormPaperPreviewProps {
  formCode: SettlementReportId;
}

/** 對應紙本：縮圖＋頁碼說明，點擊開啟可捲動的大圖，讓使用者對照紙本填寫 */
export function FormPaperPreview({ formCode }: FormPaperPreviewProps) {
  const [open, setOpen] = useState(false);
  const preview = PAPER_PREVIEWS[formCode];
  if (!preview) return null;
  // next/image 的 url 參數不會自動補 basePath，需自行帶上 '/etlite'（對齊 next.config.js）
  const src = `/etlite/form-previews/${preview.image}`;

  return (
    <>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-neutral-blue-gray/40 bg-surface-off-white p-3'>
        <button
          type='button'
          onClick={() => setOpen(true)}
          aria-label={`查看${preview.pageLabel}大圖`}
          className={cn(
            'relative shrink-0 cursor-zoom-in overflow-hidden rounded border border-neutral-blue-gray/50 bg-white',
            preview.landscape ? 'h-[68px] w-24' : 'h-[90px] w-16'
          )}
        >
          <Image src={src} alt='' fill sizes='96px' className='object-cover object-top' />
        </button>
        <div className='flex min-w-0 flex-1 basis-48 flex-col gap-0.5'>
          <span className='text-xs text-neutral-mid'>對應紙本</span>
          <span className='text-[15px] font-bold leading-snug text-neutral-dark'>{preview.pageLabel}</span>
          <span className='text-[13px] text-neutral-mid'>{preview.caption}</span>
        </div>
        <Button variant='outline' size='sm' icon={ZoomIn} onClick={() => setOpen(true)}>
          查看大圖
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-3 p-4 md:p-5'>
          <div className='flex flex-col gap-1 pr-8'>
            <DialogTitle className='leading-snug'>{preview.pageLabel}</DialogTitle>
            <DialogDescription>{preview.caption}・可捲動查看完整頁面</DialogDescription>
          </div>
          <div className='min-h-0 flex-1 overflow-auto rounded-lg border border-neutral-blue-gray/30 bg-white'>
            {/* 大圖寬度跟著對話框，高度依原圖比例自然撐開，由外層捲動 */}
            <Image src={src} alt={`${preview.pageLabel}範本`} width={1600} height={2263} sizes='(min-width: 1024px) 960px, 100vw' className='h-auto w-full' />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
