'use client';

import { InitializationHeader } from './InitializationHeader';

interface InitializationLayoutProps {
  children: React.ReactNode;
}

/**
 * Initialization 整體 Layout 容器（比照 components/onboarding/OnboardingLayout 結構）
 * 結構：Header（含 Stepper）→ 清爽白底的捲動區，內容為置中單欄（最寬 1200px，每個階段同寬），
 * 每個步驟以白色卡片堆疊呈現，四個階段（合約、營運狀況、開帳資料、完成）共用同一版型。
 */
export function InitializationLayout({ children }: InitializationLayoutProps) {
  return (
    <div className='h-svh overflow-hidden flex flex-col bg-surface-off-white [&_input]:!text-base [&_textarea]:!text-base'>
      <InitializationHeader />

      <main className='flex-1 min-h-0 overflow-hidden'>
        {/* id 供 initialization-client 切換步驟時把捲動位置歸零 */}
        <div id='initialization-scroll' className='h-full overflow-y-auto overscroll-contain [scrollbar-width:thin]'>
          {/* 底部預留固定操作列的實際高度（StepPageHeader 量測後寫入 --init-action-bar-h）；沒有操作列的頁面只留一般間距 */}
          <div className='mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 pb-[calc(var(--init-action-bar-h,0px)+1.5rem)] pt-2 nav:gap-5 nav:px-6'>{children}</div>
        </div>
      </main>
    </div>
  );
}
