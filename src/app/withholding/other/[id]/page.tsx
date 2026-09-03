import WithholdingFormView from '@/features/withholding/other/WithholdingFormView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '扣繳資料詳細 | Easytax Lite',
};

// 各類扣繳假資料僅存於瀏覽器端記憶體，WithholdingFormView 內部依此 id 自行從 mockStore 讀取，
// 本頁只負責把網址參數往下傳遞
export default function WithholdingDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-off-white" />}>
      <WithholdingFormView recordId={params.id} />
    </Suspense>
  );
}
