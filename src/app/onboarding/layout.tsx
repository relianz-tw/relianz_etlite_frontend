import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { OnboardingProvider } from '@/features/onboarding/state/OnboardingContext';
import { Toaster } from 'sonner';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 所有步驟共用同一張宣傳圖，在 layout 層預載避免 /_next/image 冷快取延遲 */}
      <link rel='preload' as='image' href='/etlite/promotional2.webp' />
      <OnboardingProvider>
        <OnboardingLayout>{children}</OnboardingLayout>
      </OnboardingProvider>
      <Toaster position='top-center' />
    </>
  );
}
