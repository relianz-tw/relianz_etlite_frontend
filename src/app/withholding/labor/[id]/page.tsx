import LaborDetailView from '@/features/withholding/labor/LaborDetailView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '勞報單詳細 | Easytax Lite',
};

export default function LaborDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { ic?: string } }) {
  return <LaborDetailView uuid={params.id} incomeCode={searchParams.ic} />;
}
