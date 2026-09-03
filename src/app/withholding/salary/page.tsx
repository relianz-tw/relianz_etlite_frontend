import SalaryListView from '@/features/withholding/salary/SalaryListView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '薪資明細 | Easytax Lite',
};

export default function SalaryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-off-white" />}>
      <SalaryListView />
    </Suspense>
  );
}
