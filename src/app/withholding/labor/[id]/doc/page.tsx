import LaborDocView from '@/features/withholding/labor/LaborDocView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '勞務報酬單 | Easytax Lite',
};

export default function LaborDocPage({ params, searchParams }: { params: { id: string }; searchParams: { ic?: string } }) {
  return <LaborDocView uuid={params.id} incomeCode={searchParams.ic} />;
}
