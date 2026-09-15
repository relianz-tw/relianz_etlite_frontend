import TrendDetailPageView from '@/features/ledger/components/TrendDetailPageView';
import { parseReturnQueryParam } from '@/features/ledger/urlState';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '交易金額趨勢 | Easytax Lite',
};

interface LedgerTrendPageProps {
  searchParams: { side?: string | string[]; from?: string | string[]; rangeFrom?: string | string[]; rangeTo?: string | string[] };
}

export default function LedgerTrendPage({ searchParams }: LedgerTrendPageProps) {
  const side = searchParams.side === 'purchase' ? 'purchase' : 'sales';
  const returnQuery = parseReturnQueryParam(searchParams.from);

  // rangeFrom/rangeTo 缺值時（如直接輸入網址、舊連結未帶區間）交給 TrendDetailPageView 回退預設區間；
  // 預設區間計算需要 formatRocDate（'use client' 模組匯出），不可在這個 Server Component 內呼叫
  const rangeFromParam = parseReturnQueryParam(searchParams.rangeFrom);
  const rangeToParam = parseReturnQueryParam(searchParams.rangeTo);
  const range = rangeFromParam && rangeToParam ? { from: rangeFromParam, to: rangeToParam } : undefined;

  return <TrendDetailPageView side={side} range={range} returnQuery={returnQuery} />;
}
