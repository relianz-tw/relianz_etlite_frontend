import { parseReconSideParam } from '@/features/reconciliation/data';
import ReconciliationView from '@/features/reconciliation/ReconciliationView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '沖帳中心 | Easytax Lite',
};

export default function ReconciliationPage({ searchParams }: { searchParams: { side?: string | string[] } }) {
  const initialSide = parseReconSideParam(searchParams.side);
  return <ReconciliationView initialSide={initialSide} />;
}
