import ReconcileView from '@/features/vat-reconcile/ReconcileView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '申報對帳 | Easytax Lite',
};

export default function ReconcilePage() {
  return <ReconcileView />;
}
