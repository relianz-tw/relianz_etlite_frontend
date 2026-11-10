'use client';

import { StepProgress, type StepProgressValue } from './StepProgress';
import Button from '@/components/ui/Button';
import SectionCard from '@/components/ui/SectionCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export interface StepNavProps {
  /** 不傳則不顯示「上一頁」（如第一步、完成頁） */
  onPrev?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  /** 按鈕旁的提示（如必填未完成的原因）；桌機在按鈕左側，手機在按鈕上方 */
  hint?: string;
}

interface StepPageHeaderProps {
  /** 標題上方的小字，如「合約」「第 4 / 11 份」 */
  kicker?: string;
  title: string;
  /** 標題下方的小標籤，如「民國 114 年度」 */
  badges?: string[];
  nav?: StepNavProps;
  /** 逐頁核對的分段進度；放在固定底部操作列、按鈕上方 */
  progress?: StepProgressValue;
  /** 緊貼標題右側的動作（如查看範例文件） */
  titleAction?: ReactNode;
  /** 與標題同一排、靠右的內容（如上傳辨識）；手機堆在標題下方 */
  aside?: ReactNode;
  /** 卡片下半部內容（上傳辨識區等），與標題同屬一塊 */
  children?: ReactNode;
}

/**
 * 開帳精靈每一頁共用的頁首卡片：標題資訊與上傳區放在同一塊。
 * 進度與上一頁／下一頁在桌機與手機都固定於畫面底部，長表單捲到哪都看得到、按得到。
 */
export function StepPageHeader({ kicker, title, badges, nav, progress, titleAction, aside, children }: StepPageHeaderProps) {
  return (
    <>
      <SectionCard className='gap-5 md:p-6'>
        <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4'>
          <div className='flex min-w-0 flex-col gap-1.5'>
            {kicker && <span className='text-xs font-semibold text-brand-blue'>{kicker}</span>}
            {/* 報表名稱含頓號等標點，用序體排版可能出現字重/標點對不齊的問題，改用正文黑體 */}
            <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
              <h1 className='text-xl font-bold text-neutral-dark md:text-2xl'>{title}</h1>
              {titleAction}
            </div>
            {badges && badges.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {badges.map(badge => (
                  <span key={badge} className='rounded-full bg-surface-off-white px-2.5 py-0.5 text-xs text-neutral-mid'>
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
          {aside}
        </div>
        {children}
      </SectionCard>

      {nav && (
        <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-surface-cream bg-white pb-[max(1.25rem,env(safe-area-inset-bottom))] ${progress ? 'pt-4' : 'pt-5'}`}>
          {/* 與 InitializationLayout 內容欄同寬；進度在上、按鈕在下，桌機按鈕靠右對齊卡片右緣 */}
          <div className='mx-auto flex w-full max-w-[1200px] flex-col gap-2 px-4 md:px-6'>
            {progress && <StepProgress {...progress} />}
            <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-end md:gap-4'>
              {nav.hint && <p className='text-xs text-semantic-error md:text-right'>{nav.hint}</p>}
              <div className='flex gap-3'>
                {nav.onPrev && (
                  <Button variant='ghost' icon={ChevronLeft} onClick={nav.onPrev}>
                    上一頁
                  </Button>
                )}
                <Button icon={ChevronRight} iconPosition='right' onClick={nav.onNext} disabled={nav.nextDisabled} className='flex-1 md:flex-none'>
                  {nav.nextLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
