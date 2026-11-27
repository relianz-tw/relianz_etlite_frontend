'use client';

import { useInitialization } from '@/features/initialization/state/InitializationContext';
import { INITIALIZATION_STEPPER_ITEMS, canGoToStepGroup, getStepEntry, getStepperIndex } from '@/features/initialization/utils/stepper';
import Stepper from '@/components/ui/Stepper';

/** Initialization Header：左上角 RELIANZ Logo + 右側整體進度 Stepper */
export function InitializationHeader() {
  const { state, dispatch } = useInitialization();
  const stepIndex = getStepperIndex(state);

  // 只能點走到過的位置（含往回）；還沒走到的頁要一頁頁按「下一頁」過去，不然會略過
  // 步驟 2／4／6 在「下一頁」時做的資料交接（見 canGoToStepGroup 與 getStepEntry 的說明）
  const canGoTo = (index: number) => canGoToStepGroup(index, state);

  return (
    <header className='flex flex-col gap-2 px-4 py-2 nav:flex-row nav:items-center nav:justify-between nav:px-6 nav:py-3 bg-surface-off-white'>
      {/* 全站慣例用原生 img，不使用 next/image（見 AppShell.tsx） */}
      <img src='/etlite/logo.png' alt='RELIANZ' width={140} height={30} className='object-contain w-[100px] nav:w-[140px]' fetchPriority='high' />
      <Stepper
        steps={INITIALIZATION_STEPPER_ITEMS}
        currentIndex={stepIndex}
        canGoTo={canGoTo}
        onStepClick={index => dispatch({ type: 'GO_TO_STEP', payload: getStepEntry(index, state.reportPages) })}
        className='nav:w-[600px]'
      />
    </header>
  );
}
