import LedgerView from '@/features/ledger/LedgerView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '帳簿 | Easytax Lite',
};

// LedgerView 內部使用 useSearchParams 讀取篩選/排序/分頁狀態，App Router 要求外層需有 Suspense 邊界，
// 否則靜態渲染會報錯；fallback 維持背景色與最小高度，避免載入時畫面閃爍
export default function LedgerPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-surface-off-white" />}>
      <LedgerView />
    </Suspense>
  );
}
