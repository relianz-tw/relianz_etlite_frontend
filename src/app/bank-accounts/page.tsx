import BankAccountsView from '@/features/bank-accounts/BankAccountsView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '銀行帳戶總覽 | Easytax Lite',
};

// BankAccountsView 內部使用 useSearchParams 讀取帳戶/期間篩選狀態，App Router 要求外層需有 Suspense 邊界，
// 否則靜態渲染會報錯；fallback 維持背景色與最小高度，避免載入時畫面閃爍
export default function BankAccountsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-off-white" />}>
      <BankAccountsView />
    </Suspense>
  );
}
