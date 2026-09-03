import LaborFormView from '@/features/withholding/labor/LaborFormView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '新增勞報單 | Easytax Lite',
};

export default function LaborCreatePage() {
  return <LaborFormView />;
}
