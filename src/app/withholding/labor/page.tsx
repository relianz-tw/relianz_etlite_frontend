import LaborListView from '@/features/withholding/labor/LaborListView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '勞報單 | Easytax Lite',
};

export default function LaborPage() {
  return <LaborListView />;
}
