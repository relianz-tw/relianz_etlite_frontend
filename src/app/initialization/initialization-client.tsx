'use client';

import { useInitialization } from '@/features/initialization/state/InitializationContext';
import { Step1Terms } from '@/features/initialization/components/steps/Step1Terms';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

function StepLoading() {
  return (
    <div className='flex-1 flex items-center justify-center bg-white'>
      <Loader2 size={24} className='animate-spin text-brand-blue' />
    </div>
  );
}

const Step2Company = dynamic(
  () => import('@/features/initialization/components/steps/Step2Company').then(m => ({ default: m.Step2Company })),
  { loading: StepLoading }
);
const Step3AUpload = dynamic(
  () => import('@/features/initialization/components/steps/Step3AUpload').then(m => ({ default: m.Step3AUpload })),
  { loading: StepLoading }
);
const Step3BBalance = dynamic(
  () => import('@/features/initialization/components/steps/Step3BBalance').then(m => ({ default: m.Step3BBalance })),
  { loading: StepLoading }
);
const Step4Confirm = dynamic(
  () => import('@/features/initialization/components/steps/Step4Confirm').then(m => ({ default: m.Step4Confirm })),
  { loading: StepLoading }
);
const Step5Done = dynamic(
  () => import('@/features/initialization/components/steps/Step5Done').then(m => ({ default: m.Step5Done })),
  { loading: StepLoading }
);

export function InitializationClient() {
  const { state, dispatch } = useInitialization();
  const { currentStep, currentSubStep } = state;
  const searchParams = useSearchParams();
  const uuid = searchParams.get('uuid');

  // 登入機制上線前，userUuid 由 URL ?uuid= 帶入（見 /onboarding/payment/success 的「前往開帳設定」按鈕）
  useEffect(() => {
    if (uuid && uuid !== state.userUuid) {
      dispatch({ type: 'SET_USER_UUID', payload: uuid });
    }
  }, [uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  // 步驟切換時手機版回滾至頂部（卡片容器為實際捲動層）
  useEffect(() => {
    const card = document.querySelector('main > div');
    if (card) card.scrollTop = 0;
  }, [currentStep, currentSubStep]);

  if (currentStep === 1) return <Step1Terms />;
  if (currentStep === 2) return <Step2Company />;
  if (currentStep === 3 && currentSubStep === 'A') return <Step3AUpload />;
  if (currentStep === 3 && currentSubStep === 'B') return <Step3BBalance />;
  if (currentStep === 4) return <Step4Confirm />;
  if (currentStep === 5) return <Step5Done />;

  return <Step1Terms />;
}
