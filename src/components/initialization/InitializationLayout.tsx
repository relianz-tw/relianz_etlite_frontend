'use client';

import { InitializationHeader } from './InitializationHeader';

interface InitializationLayoutProps {
  children: React.ReactNode;
}

/**
 * Initialization 整體 Layout 容器（比照 components/onboarding/OnboardingLayout 結構）
 * 結構：Header（含 Stepper）→ 清爽白底的捲動區，內容為置中單欄（最寬 960px），
 * 每個步驟以白色卡片堆疊呈現，四個階段（合約、營運狀況、開帳資料、完成）共用同一版型。
 */
export function InitializationLayout({ children }: InitializationLayoutProps) {
  return (
    <div className='h-svh overflow-hidden flex flex-col bg-surface-off-white [&_input]:!text-base [&_textarea]:!text-base'>
      <InitializationHeader />

      <main className='flex-1 min-h-0 overflow-hidden'>
        {/* id 供 initialization-client 切換步驟時把捲動位置歸零 */}
        <div id='initialization-scroll' className='h-full overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'>
          {/* 手機底部預留固定操作列的高度（pb-28） */}
          <div className='mx-auto flex w-full max-w-[960px] flex-col gap-4 px-4 pb-28 pt-2 md:gap-5 md:px-6 md:pb-8'>{children}</div>
        </div>
      </main>
    </div>
  );
}
