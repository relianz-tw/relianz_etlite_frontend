import TrendDetailPageView from '@/features/ledger/components/TrendDetailPageView';
import { parseReturnQueryParam } from '@/features/ledger/urlState';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '發票金額趨勢 | Easytax Lite',
};

export default function LedgerTrendPage({ searchParams }: { searchParams: { side?: string | string[]; from?: string | string[] } }) {
  const side = searchParams.side === 'purchase' ? 'purchase' : 'sales';
  const returnQuery = parseReturnQueryParam(searchParams.from);
  return <TrendDetailPageView side={side} returnQuery={returnQuery} />;
}
