import LaborDetailView from '@/features/withholding/labor/LaborDetailView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '勞報單詳細 | Easytax Lite',
};

export default function LaborDetailPage({ params }: { params: { id: string } }) {
  return <LaborDetailView uuid={params.id} />;
}
