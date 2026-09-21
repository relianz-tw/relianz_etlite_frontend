import WithholdingGroupView from '@/features/withholding/other/WithholdingGroupView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '扣繳彙總明細 | Easytax Lite',
};

// WithholdingGroupView 內部依此 groupKey 搭配網址 ?ic= 類別代碼呼叫
// POST /ael/withholding/summary/group/filter，本頁只負責把路由參數往下傳遞
export default function WithholdingGroupPage({ params }: { params: { groupKey: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-off-white" />}>
      <WithholdingGroupView groupKey={params.groupKey} />
    </Suspense>
  );
}
