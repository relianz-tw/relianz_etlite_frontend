import { parseReconSideParam } from '@/features/reconciliation/data';
import ReconTxnDetailView from '@/features/reconciliation/ReconTxnDetailView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '交易明細 | Easytax Lite',
};

function parseSingle(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function ReconTxnDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { side?: string | string[]; name?: string | string[] };
}) {
  const side = parseReconSideParam(searchParams.side);
  const counterparty = parseSingle(searchParams.name);
  return <ReconTxnDetailView transactionId={params.id} side={side} counterparty={counterparty} />;
}
