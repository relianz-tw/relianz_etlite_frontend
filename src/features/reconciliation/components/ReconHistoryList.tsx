'use client';

import { reverseManualSettle, reverseSummarySettle } from '@/api/ledger';
import type { SettleEventListItemDto } from '@/api/types';
import Pagination from '@/components/ui/Pagination';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { groupSettleEventsByDate } from '../historyGrouping';
import type { ReconSide } from '../types';
import { useSettleEventHistory } from '../useSettleEventHistory';
import ReconHistoryCard from './ReconHistoryCard';
import ReconHistoryReverseModal from './ReconHistoryReverseModal';

// 欄位精簡至 8 欄後改用 13px（比系統預設的 Record Row 表頭 text-xs 大一階），
// 讓表頭在版面中更有存在感；仍小於上方 TabBar（text-sm）與下方分組日期標頭（15px），避免三者字級混在一起看不出主次
// （見 DESIGN.md「Record Row」章節之沖帳紀錄表頭字級例外說明）
const HEADER_CLASS = 'text-[13px] font-semibold text-neutral-mid';

interface ReconHistoryListProps {
  side: ReconSide;
  dateFrom: string;
  dateTo: string;
  unlimitedDate: boolean;
  /** 復原成功後通知外層清空沖帳中心快取（餘額／待沖清單已變），比照 ReconciliationView 的 finalizeSettle */
  onReversed: () => void;
}

const PAGE_SIZE = 10;

/** 沖帳紀錄日記式清單：依日期分組卡片流 + 分頁，卡片可展開明細與就地復原（見 ReconHistoryCard） */
export default function ReconHistoryList({ side, dateFrom, dateTo, unlimitedDate, onReversed }: ReconHistoryListProps) {
  const [page, setPage] = useState(1);
  const { items, total, loading, error, reload } = useSettleEventHistory({ side, dateFrom, dateTo, unlimitedDate, page, pageSize: PAGE_SIZE });
  const [reverseTarget, setReverseTarget] = useState<SettleEventListItemDto | null>(null);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const groups = useMemo(() => groupSettleEventsByDate(items), [items]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleReverseClick = (item: SettleEventListItemDto) => {
    setReverseTarget(item);
    setSubmitError('');
    setReverseOpen(true);
  };

  const handleConfirmReverse = async () => {
    if (!reverseTarget) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      // 匯總沖帳（reconMethod=2）走 reverseSummarySettle，會一併恢復同批所有交易；其餘（手動沖帳）走 reverseManualSettle
      const reverse = reverseTarget.reconMethod === 2 ? reverseSummarySettle : reverseManualSettle;
      await reverse({ settleEventUuid: reverseTarget.settleEventUuid });
      setReverseOpen(false);
      setReverseTarget(null);
      reload();
      onReversed();
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入沖帳紀錄中…</div>;
  }
  if (error) {
    return <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{error}</div>;
  }
  if (items.length === 0) {
    return <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">尚無沖帳紀錄</div>;
  }

  const isPayable = side === 'payable';

  return (
    <div className="flex flex-col gap-4 min-[1300px]:gap-2 pb-4">
      {/* 桌機表頭：與 ReconHistoryCard 桌機列欄寬一一對應 */}
      <div className="hidden items-center gap-3 border-b border-neutral-blue-gray/20 px-3 pb-2.5 min-[1300px]:flex">
        <span className={cn(HEADER_CLASS, 'w-14 shrink-0')}>時間</span>
        <span className={cn(HEADER_CLASS, 'w-16 shrink-0')}>交易狀態</span>
        <span className={cn(HEADER_CLASS, 'w-32 shrink-0')}>對象</span>
        <span className={cn(HEADER_CLASS, 'w-14 shrink-0 text-right')}>筆數</span>
        <span className={cn(HEADER_CLASS, 'w-20 shrink-0 text-right')}>沖前餘額</span>
        <span className={cn(HEADER_CLASS, 'w-20 shrink-0 text-right')}>沖後餘額</span>
        <span className={cn(HEADER_CLASS, 'w-24 shrink-0 text-right')}>{isPayable ? '實際付款金額' : '實際存入金額'}</span>
        <span className={cn(HEADER_CLASS, 'ml-3 min-w-0 flex-1')}>{isPayable ? '付款帳戶' : '存入帳戶'}</span>
        <span className="w-[68px] shrink-0" />
      </div>

      {groups.map((group, index) => (
        <div key={group.dateKey} className={cn(index > 0 && 'border-t border-neutral-blue-gray/20 pt-4')}>
          {/* 日期為此清單的主軸，標頭需比列內容更重：加粗放大＋左側城信藍短豎線；
              分隔線放在日期上方，標示與上一組的分界，而非切在標頭與列表之間 */}
          <div className="mb-2 flex items-center gap-2">
            <span className="h-4 w-[3px] shrink-0 rounded-full bg-brand-blue" />
            <span className="text-[15px] font-semibold text-neutral-dark">{group.label}</span>
          </div>
          <div className="flex flex-col gap-3 min-[1300px]:gap-1">
            {group.items.map(item => (
              <ReconHistoryCard key={item.settleEventUuid} side={side} item={item} onReverse={handleReverseClick} />
            ))}
          </div>
        </div>
      ))}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <ReconHistoryReverseModal
        open={reverseOpen}
        item={reverseTarget}
        submitting={submitting}
        submitError={submitError}
        onClose={() => setReverseOpen(false)}
        onConfirm={handleConfirmReverse}
      />
    </div>
  );
}
