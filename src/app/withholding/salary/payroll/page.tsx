import PayrollFormView from '@/features/withholding/salary/PayrollFormView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '開立/編輯薪資明細 | Easytax Lite',
};

export default function PayrollPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-off-white" />}>
      <PayrollFormView />
    </Suspense>
  );
}
