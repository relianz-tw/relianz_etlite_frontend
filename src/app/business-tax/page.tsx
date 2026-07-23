import BusinessTaxView from '@/features/business-tax/BusinessTaxView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '營業稅中心 | Easytax Lite',
};

export default function BusinessTaxPage() {
  return <BusinessTaxView />;
}
