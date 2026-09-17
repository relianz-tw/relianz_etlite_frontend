'use client';

import { Loader2 } from 'lucide-react';

interface OnboardingLoaderProps {
  description?: string;
}

/** 全螢幕載入指示器，用於 onboarding 付款流程中的過場頁（交易處理中／載入資料中） */
export function OnboardingLoader({ description }: OnboardingLoaderProps) {
  return (
    <div className='absolute inset-0 z-50 flex items-center justify-center bg-surface-off-white text-base'>
      <div className='flex flex-col items-center gap-4'>
        <Loader2 size={40} className='animate-spin text-brand-blue' />
        {description && (
          <p className='text-sm font-medium text-neutral-dark'>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
