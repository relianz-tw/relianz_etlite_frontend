import ReconcileView from '@/features/vat-reconcile/ReconcileView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '任務中心 | Easytax Lite',
};

export default function ReconcilePage() {
  return <ReconcileView />;
}
