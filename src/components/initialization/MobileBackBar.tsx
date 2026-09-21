'use client';

import { useInitialization } from '@/features/initialization/state/InitializationContext';
import { ChevronLeft } from 'lucide-react';

/**
 * 手機版「上一頁」列，sticky 於捲動容器頂部
 * 第一步（合約）不顯示；完成頁不可回退亦不顯示
 */
export function MobileBackBar() {
  const { state, dispatch } = useInitialization();

  if (state.currentStep <= 1 || state.currentStep >= 6) return null;

  return (
    <div className='md:hidden bg-white px-4 pt-[15px] pb-2'>
      <button
        onClick={() => dispatch({ type: 'PREV_STEP' })}
        className='flex items-center gap-1 text-sm text-neutral-dark/60 hover:text-neutral-dark transition-colors'
      >
        <ChevronLeft size={16} />
        上一頁
      </button>
    </div>
  );
}
