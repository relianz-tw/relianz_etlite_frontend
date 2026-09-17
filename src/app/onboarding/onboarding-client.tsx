'use client';

import { Step1Landing } from '@/features/onboarding/components/steps/Step1Landing';
import { useOnboarding } from '@/features/onboarding/state/OnboardingContext';
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
  () =>
    import('@/features/onboarding/components/steps/Step2Company').then(m => ({
      default: m.Step2Company,
    })),
  { loading: StepLoading }
);
const Step3AUpload = dynamic(
  () =>
    import('@/features/onboarding/components/steps/Step3AUpload').then(m => ({
      default: m.Step3AUpload,
    })),
  { loading: StepLoading }
);
const Step3BRecognition = dynamic(
  () =>
    import('@/features/onboarding/components/steps/Step3BRecognition').then(
      m => ({ default: m.Step3BRecognition })
    ),
  { loading: StepLoading }
);
const Step4ACalculator = dynamic(
  () =>
    import('@/features/onboarding/components/steps/Step4ACalculator').then(
      m => ({
        default: m.Step4ACalculator,
      })
    ),
  { loading: StepLoading }
);
const Step4BResult = dynamic(
  () =>
    import('@/features/onboarding/components/steps/Step4BResult').then(m => ({
      default: m.Step4BResult,
    })),
  { loading: StepLoading }
);
const Step5AEstimator = dynamic(
  () =>
    import('@/features/onboarding/components/steps/Step5AEstimator').then(
      m => ({
        default: m.Step5AEstimator,
      })
    ),
  { loading: StepLoading }
);
const Step5BResult = dynamic(
  () =>
    import('@/features/onboarding/components/steps/Step5BResult').then(m => ({
      default: m.Step5BResult,
    })),
  { loading: StepLoading }
);
const Step6Plan = dynamic(
  () =>
    import('@/features/onboarding/components/steps/Step6Plan').then(m => ({
      default: m.Step6Plan,
    })),
  { loading: StepLoading }
);
const Step8Checkout = dynamic(
  () =>
    import('@/features/onboarding/components/steps/Step8Checkout').then(m => ({
      default: m.Step8Checkout,
    })),
  { loading: StepLoading }
);

export function OnboardingClient() {
  const { state, dispatch } = useOnboarding();
  const { currentStep, currentSubStep } = state;
  const searchParams = useSearchParams();
  const uuid = searchParams.get('uuid');

  // 若 URL 帶有 uuid（從付款失敗頁回來），直接跳到 Step8 並設定 uuid
  useEffect(() => {
    if (uuid) {
      dispatch({ type: 'SET_USER_UUID', payload: uuid });
      dispatch({ type: 'GO_TO_STEP', payload: { step: 8, subStep: null } });
    }
  }, [uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  // 步驟切換時手機版回滾至頂部（卡片容器為實際捲動層）
  useEffect(() => {
    const card = document.querySelector('main > div');
    if (card) card.scrollTop = 0;
  }, [currentStep, currentSubStep]);

  if (currentStep === 1) return <Step1Landing />;
  if (currentStep === 2) return <Step2Company />;
  if (currentStep === 3 && currentSubStep === 'A') return <Step3AUpload />;
  if (currentStep === 3 && currentSubStep === 'B') return <Step3BRecognition />;
  if (currentStep === 4 && currentSubStep === 'A') return <Step4ACalculator />;
  if (currentStep === 4 && currentSubStep === 'B') return <Step4BResult />;
  if (currentStep === 5 && currentSubStep === 'A') return <Step5AEstimator />;
  if (currentStep === 5 && currentSubStep === 'B') return <Step5BResult />;
  if (currentStep === 6) return <Step6Plan />;
  if (currentStep === 8) return <Step8Checkout />;

  return <Step1Landing />;
}
