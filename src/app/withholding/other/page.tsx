import WithholdingListView from '@/features/withholding/other/WithholdingListView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '各類扣繳 | Easytax Lite',
};

export default function WithholdingOtherPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-off-white" />}>
      <WithholdingListView />
    </Suspense>
  );
}
