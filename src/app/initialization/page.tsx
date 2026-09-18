import { InitializationClient } from './initialization-client';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = { title: '開帳設定 | Easytax Lite' };

export default function InitializationPage() {
  return (
    <Suspense>
      <InitializationClient />
    </Suspense>
  );
}
