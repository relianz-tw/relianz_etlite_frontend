'use client';

import { MobileBackBar } from './MobileBackBar';
import { InitializationHeader } from './InitializationHeader';

interface InitializationLayoutProps {
  children: React.ReactNode;
}

/**
 * Initialization 整體 Layout 容器（比照 components/onboarding/OnboardingLayout 結構）
 * 結構：Header（含 Stepper）→ 白色卡片內容區（手機捲動、桌面各面板獨立捲動）
 */
export function InitializationLayout({ children }: InitializationLayoutProps) {
  return (
    <div className='h-svh overflow-hidden flex flex-col bg-surface-off-white [&_input]:!text-base [&_textarea]:!text-base'>
      <InitializationHeader />

      <main className='flex-1 min-h-0 overflow-hidden flex flex-col px-7 md:px-6 pt-0 pb-20 md:pb-6'>
        {/* overflow:clip 裁切 border-radius，不建立 BFC，可正確裁切內部 scroll container */}
        <div className='flex-1 min-h-0 rounded-2xl [overflow:clip] flex flex-col bg-white'>
          <MobileBackBar />
          <div className='flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
