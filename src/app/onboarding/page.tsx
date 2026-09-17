import { OnboardingClient } from './onboarding-client';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = { title: '開通導引 | Easytax Lite' };

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingClient />
    </Suspense>
  );
}
