import WithholdingFormView from '@/features/withholding/other/WithholdingFormView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '扣繳資料詳細 | Easytax Lite',
};

// WithholdingFormView 內部依此 id（＝withholdingSummaryUuid）搭配網址 ?ic= 類別代碼
// 自行呼叫 GET /ael/withholding/detail 查詢，本頁只負責把網址參數往下傳遞
export default function WithholdingDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-off-white" />}>
      <WithholdingFormView recordId={params.id} />
    </Suspense>
  );
}
