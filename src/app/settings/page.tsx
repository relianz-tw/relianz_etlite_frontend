import SettingsView from '@/features/settings/SettingsView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '設定 | Easytax Lite',
};

// SettingsView 內部使用 useSearchParams 讀取 ?tab= 分頁狀態，App Router 要求外層需有 Suspense 邊界，
// 否則靜態渲染會報錯；fallback 維持背景色與最小高度，避免切換分頁時畫面閃爍
export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-off-white" />}>
      <SettingsView />
    </Suspense>
  );
}
