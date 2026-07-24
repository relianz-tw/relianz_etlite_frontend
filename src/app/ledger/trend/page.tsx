import TrendDetailPageView from '@/features/ledger/components/TrendDetailPageView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '發票金額趨勢 | Easytax Lite',
};

export default function LedgerTrendPage({ searchParams }: { searchParams: { side?: string | string[] } }) {
  const side = searchParams.side === 'purchase' ? 'purchase' : 'sales';
  return <TrendDetailPageView side={side} />;
}
