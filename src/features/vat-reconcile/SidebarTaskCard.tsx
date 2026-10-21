'use client';

import { CircleCheck, ListChecks } from 'lucide-react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { RECONCILE_PATH, useVatReconcile } from './VatReconcileContext';
import type { PeriodState } from './VatReconcileContext';

/** 色條顏色：已符合 / 待處理 / 未上傳申報（無資料或失敗視同未上傳） */
function barClass(p: PeriodState): string {
  switch (p.data?.status) {
    case 'matched':
      return 'bg-semantic-success';
    case 'pending':
      return 'bg-neutral-mid';
    default:
      return 'bg-neutral-blue-gray';
  }
}

/** 側邊欄「申報對帳」任務卡：六格色條對應 1／3／5／7／9／11 期，點擊進任務頁 */
export default function SidebarTaskCard() {
  const { rocYear, periods, initialLoading, pendingCount } = useVatReconcile();
  const allFailed = !initialLoading && periods.every(p => p.error);
  const anyMatched = periods.some(p => p.data?.status === 'matched');

  let summary: string;
  if (allFailed) summary = '無法取得對帳結果';
  else if (pendingCount > 0) summary = `${rocYear} 年 · ${pendingCount} 期待處理`;
  else if (anyMatched) summary = `${rocYear} 年 · 已申報期別皆符合`;
  else summary = `${rocYear} 年 · 尚未上傳申報書`;

  return (
    <div className="shrink-0 border-t border-surface-cream p-3">
      <Link
        href={RECONCILE_PATH}
        className="flex flex-col gap-2 rounded-lg bg-surface-off-white p-3 text-neutral-dark transition-colors hover:bg-surface-cream"
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-primary">
          <ListChecks size={16} />
          申報對帳
          {!initialLoading && pendingCount > 0 && (
            <Badge tone="neutral" variant="solid" className="ml-auto">
              {pendingCount}
            </Badge>
          )}
          {!initialLoading && !allFailed && pendingCount === 0 && anyMatched && (
            <CircleCheck size={16} className="ml-auto text-semantic-success" aria-label="已符合" />
          )}
        </span>
        {initialLoading ? (
          <>
            <span className="h-1.5 rounded-sm bg-surface-cream" />
            <span className="h-3 w-3/4 rounded-sm bg-surface-cream" />
          </>
        ) : (
          <>
            {!allFailed && (
              <span className="flex gap-1" aria-hidden="true">
                {periods.map(p => (
                  <span key={p.phase} className={`h-1.5 flex-1 rounded-sm ${barClass(p)}`} />
                ))}
              </span>
            )}
            <span className={`text-xs ${allFailed ? 'text-semantic-error' : ''}`}>{summary}</span>
            {allFailed && <span className="text-xs text-brand-primary underline">點此進入重試</span>}
          </>
        )}
      </Link>
    </div>
  );
}

/** 手機頂部列選單鈕上的待處理小圓點（需置於 relative 容器內） */
export function PendingDot() {
  const { pendingCount } = useVatReconcile();
  if (pendingCount === 0) return null;
  return <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-neutral-dark" aria-hidden="true" />;
}
