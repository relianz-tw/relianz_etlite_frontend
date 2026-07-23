import { parseSideParam } from '@/features/ledger/transaction/data';
import TransactionFormView from '@/features/ledger/transaction/TransactionFormView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '新增交易 | Easytax Lite',
};

export default function NewTransactionPage({ searchParams }: { searchParams: { side?: string | string[] } }) {
  const side = parseSideParam(searchParams.side);
  return <TransactionFormView mode="create" side={side} />;
}
