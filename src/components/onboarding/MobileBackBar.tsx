'use client';

import { useOnboarding } from '@/features/onboarding/state/OnboardingContext';
import { ChevronLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';

const HIDE_BACK_BAR_PATHS = [
  '/onboarding/payment/success',
  '/onboarding/payment/fail',
];

/**
 * 手機版「上一頁」列
 * sticky top-0：吸附在 main scroll 容器頂部（header 正下方）
 * currentStep === 1 時不顯示
 */
export function MobileBackBar() {
  const { state, dispatch } = useOnboarding();
  const pathname = usePathname();

  if (HIDE_BACK_BAR_PATHS.includes(pathname)) return null;
  if (state.currentStep <= 1) return null;

  // Step3A/4A/5A 有圖片 overlay 按鈕，不重複顯示
  const hasImageOverlay =
    (state.currentStep === 3 && state.currentSubStep === 'A') ||
    (state.currentStep === 4 && state.currentSubStep === 'A') ||
    (state.currentStep === 5 && state.currentSubStep === 'A');
  if (hasImageOverlay) return null;

  const bg = state.currentStep === 8 ? 'bg-surface-off-white' : 'bg-white';

  return (
    <div className={`md:hidden ${bg} px-4 pt-[15px] pb-2`}>
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
