'use client';

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
}

/** 上一頁／下一頁按鈕組，桌機置於卡片右上與頁底，手機改固定於畫面底部（見 StepPageHeader） */
export function StepNavButtons({ nav, className = '' }: { nav: StepNavProps; className?: string }) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {nav.onPrev && (
        <Button variant='ghost' icon={ChevronLeft} onClick={nav.onPrev}>
          上一頁
        </Button>
      )}
      <Button icon={ChevronRight} iconPosition='right' onClick={nav.onNext} disabled={nav.nextDisabled}>
        {nav.nextLabel}
      </Button>
    </div>
  );
}

interface StepPageHeaderProps {
  /** 標題上方的小字，如「合約」「第 4 / 11 份」 */
  kicker?: string;
  title: string;
  /** 標題下方的小標籤，如「民國 114 年度」 */
  badges?: string[];
  nav?: StepNavProps;
  /** 桌機不在卡片右上顯示按鈕（改由頁面自行放在內容下方）；手機的固定底部操作列不受影響 */
  hideDesktopNav?: boolean;
  /** 卡片下半部內容（進度條、上傳辨識區等），與標題、上一頁／下一頁同屬一塊 */
  children?: ReactNode;
}

/**
 * 開帳精靈每一頁共用的頁首卡片：標題資訊、上一頁／下一頁、進度與上傳區放在同一塊。
 * 桌機（md 以上）按鈕在卡片右上；手機改為固定於畫面底部的操作列，捲到哪都按得到。
 */
export function StepPageHeader({ kicker, title, badges, nav, hideDesktopNav, children }: StepPageHeaderProps) {
  return (
    <>
      <SectionCard className='gap-5 md:p-6'>
        <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4'>
          <div className='flex min-w-0 flex-col gap-1.5'>
            {kicker && <span className='text-xs font-semibold text-brand-blue'>{kicker}</span>}
            {/* 報表名稱含頓號等標點，用序體排版可能出現字重/標點對不齊的問題，改用正文黑體 */}
            <h1 className='text-xl font-bold text-neutral-dark md:text-2xl'>{title}</h1>
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
          {nav && !hideDesktopNav && <StepNavButtons nav={nav} className='hidden shrink-0 md:flex' />}
        </div>
        {children}
      </SectionCard>

      {nav && (
        <div className='fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-surface-cream bg-white px-6 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden'>
          {nav.onPrev && (
            <Button variant='ghost' icon={ChevronLeft} onClick={nav.onPrev}>
              上一頁
            </Button>
          )}
          <Button icon={ChevronRight} iconPosition='right' onClick={nav.onNext} disabled={nav.nextDisabled} className='flex-1'>
            {nav.nextLabel}
          </Button>
        </div>
      )}
    </>
  );
}
