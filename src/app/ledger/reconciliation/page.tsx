import ReconciliationView from '@/features/reconciliation/ReconciliationView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '沖帳中心 | Easytax Lite',
};

export default function ReconciliationPage() {
  return <ReconciliationView />;
}
