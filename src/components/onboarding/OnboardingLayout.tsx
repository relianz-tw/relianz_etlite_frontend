'use client';

import { MobileBackBar } from './MobileBackBar';
import { OnboardingFooter } from './OnboardingFooter';
import { OnboardingHeader } from './OnboardingHeader';
import { useOnboarding } from '@/features/onboarding/state/OnboardingContext';
import { usePathname } from 'next/navigation';

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

const NO_SCROLL_PATHS = [
  '/onboarding/payment/success',
  '/onboarding/payment/fail',
];

/**
 * 依步驟決定手機版捲動區背景色
 * iOS overscroll rubber-band 顯示的顏色 = 捲動容器的 background-color
 * 需與該步驟手機版最底部的色塊一致，避免 overscroll 時出現色彩突兀
 */
function getScrollBgClass(step: number, subStep: string | null): string {
  // 左欄在手機版排序為下方（order-2）且為 surface-off-white 的步驟
  if ((step === 3 && subStep === 'B') || step === 6 || step === 8) {
    return 'bg-surface-off-white';
  }
  return 'bg-white';
}

/**
 * Onboarding 整體 Layout 容器
 * 結構：Header → 兩欄內容區（由子元件透過 StepContainer 管理）→ Footer
 */
export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const pathname = usePathname();
  const isResultPage = NO_SCROLL_PATHS.includes(pathname);
  const { state } = useOnboarding();
  const scrollBgClass = getScrollBgClass(
    state.currentStep,
    state.currentSubStep
  );

  return (
    <div className='h-svh overflow-hidden flex flex-col bg-surface-off-white [&_input]:!text-base [&_textarea]:!text-base'>
      <OnboardingHeader />

      {/* 手機版：卡片捲動（overflow-x-hidden 保留圓角裁切）；桌面版：各面板獨立捲動 */}
      <main
        className={`flex-1 min-h-0 overflow-hidden flex flex-col px-7 md:px-6 pt-0 ${
          isResultPage ? 'pb-4 md:pb-0' : 'pb-20 md:pb-0'
        }`}
      >
        {/* overflow:clip 裁切 border-radius，不建立 BFC，可正確裁切內部 scroll container */}
        <div className='flex-1 min-h-0 rounded-2xl [overflow:clip] flex flex-col bg-white'>
          {/* MobileBackBar 置於捲動容器之外，避免 min-h-full 計算含入其高度造成多餘捲動 */}
          <MobileBackBar />
          {/*
           * overscroll-contain：允許 iOS rubber-band（手感自然），不往上層傳播
           * 背景色依步驟切換：rubber-band 延伸時顯示的顏色與頁面底部色塊一致
           * 移除 touch-none：恢復自然觸控慣性滑動
           */}
          <div
            className={`flex-1 min-h-0 flex flex-col ${scrollBgClass} md:bg-transparent overscroll-contain transition-colors duration-300 overflow-x-hidden [&::-webkit-scrollbar]:hidden [scrollbar-width:none] ${
              isResultPage
                ? 'overflow-y-auto'
                : 'overflow-y-auto md:overflow-hidden'
            }`}
          >
            {children}
          </div>
        </div>
      </main>

      <OnboardingFooter />
    </div>
  );
}
