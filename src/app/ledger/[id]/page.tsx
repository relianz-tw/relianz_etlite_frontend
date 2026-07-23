import { parseSideParam } from '@/features/ledger/transaction/data';
import TransactionFormView from '@/features/ledger/transaction/TransactionFormView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '交易細節 | Easytax Lite',
};

export default function TransactionDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { side?: string | string[] };
}) {
  const side = parseSideParam(searchParams.side);
  return <TransactionFormView mode="edit" side={side} transactionId={params.id} />;
}
