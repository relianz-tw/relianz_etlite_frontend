import TrendDetailPageView from '@/features/business-tax/components/TrendDetailPageView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '銷項發票金額趨勢 | Easytax Lite',
};

export default function BusinessTaxTrendPage() {
  return <TrendDetailPageView />;
}
