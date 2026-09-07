import LaborSignView from '@/features/withholding/labor/LaborSignView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '簽署勞報單 | Easytax Lite',
};

export default function LaborSignPage({ params, searchParams }: { params: { uuid: string }; searchParams: { ic?: string } }) {
  return <LaborSignView uuid={params.uuid} incomeCode={searchParams.ic} />;
}
