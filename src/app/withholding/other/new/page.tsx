import WithholdingFormView from '@/features/withholding/other/WithholdingFormView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '新增各類扣繳 | Easytax Lite',
};

export default function NewWithholdingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-off-white" />}>
      <WithholdingFormView />
    </Suspense>
  );
}
