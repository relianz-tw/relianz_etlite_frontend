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

const Step2Operating = dynamic(
  () => import('@/features/initialization/components/steps/Step2Operating').then(m => ({ default: m.Step2Operating })),
  { loading: StepLoading }
);
const Step3Cover = dynamic(
  () => import('@/features/initialization/components/steps/Step3Cover').then(m => ({ default: m.Step3Cover })),
  { loading: StepLoading }
);
const Step4Reports = dynamic(
  () => import('@/features/initialization/components/steps/Step4Reports').then(m => ({ default: m.Step4Reports })),
  { loading: StepLoading }
);
const Step5Confirm = dynamic(
  () => import('@/features/initialization/components/steps/Step5Confirm').then(m => ({ default: m.Step5Confirm })),
  { loading: StepLoading }
);
const Step6Done = dynamic(
  () => import('@/features/initialization/components/steps/Step6Done').then(m => ({ default: m.Step6Done })),
  { loading: StepLoading }
);

export function InitializationClient() {
  const { state, dispatch } = useInitialization();
  const { currentStep, currentReportIndex } = state;
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
  }, [currentStep, currentReportIndex]);

  if (currentStep === 1) return <Step1Terms />;
  if (currentStep === 2) return <Step2Operating />;
  if (currentStep === 3) return <Step3Cover />;
  if (currentStep === 4) return <Step4Reports />;
  if (currentStep === 5) return <Step5Confirm />;
  if (currentStep === 6) return <Step6Done />;

  return <Step1Terms />;
}
