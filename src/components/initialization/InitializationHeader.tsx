'use client';

import { useInitialization } from '@/features/initialization/state/InitializationContext';
import { INITIALIZATION_STEPPER_ITEMS, getStepperIndex } from '@/features/initialization/utils/stepper';
import Stepper from '@/components/ui/Stepper';

/** Initialization Header：左上角 RELIANZ Logo + 右側整體進度 Stepper */
export function InitializationHeader() {
  const { state } = useInitialization();
  const stepIndex = getStepperIndex(state.currentStep);

  return (
    <header className='flex flex-col gap-2 px-4 py-2 md:flex-row md:items-center md:justify-between md:px-6 md:py-3 bg-surface-off-white'>
      {/* 全站慣例用原生 img，不使用 next/image（見 AppShell.tsx） */}
      <img src='/etlite/logo.png' alt='RELIANZ' width={140} height={30} className='object-contain w-[100px] md:w-[140px]' fetchPriority='high' />
      <Stepper steps={INITIALIZATION_STEPPER_ITEMS} currentIndex={stepIndex} className='md:w-[420px]' />
    </header>
  );
}
