import ReconciliationView from '@/features/reconciliation/ReconciliationView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '匯總沖帳 | Easytax Lite',
};

export default function ReconciliationPage() {
  return <ReconciliationView />;
}
