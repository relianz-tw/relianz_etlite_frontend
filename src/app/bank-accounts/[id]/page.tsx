import BankTransactionDetailView from '@/features/bank-accounts/BankTransactionDetailView';
import { parseReturnQueryParam } from '@/features/bank-accounts/urlState';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '交易明細 | Easytax Lite',
};

export default function BankTransactionDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { account?: string | string[]; from?: string | string[] };
}) {
  const account = parseReturnQueryParam(searchParams.account) ?? '';
  const returnQuery = parseReturnQueryParam(searchParams.from);
  return <BankTransactionDetailView transactionId={params.id} accountUuid={account} returnQuery={returnQuery} />;
}
