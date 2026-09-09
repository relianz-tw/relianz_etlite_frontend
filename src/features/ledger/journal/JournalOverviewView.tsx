'use client';

import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import ReconDateFilter from '@/features/reconciliation/components/ReconDateFilter';
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { groupJournalLinesByDate } from './journalGrouping';
import JournalOverviewList from './JournalOverviewList';
import { useJournalOverview } from './useJournalOverview';

const PAGE_SIZE = 10;

function toYyyymmdd(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function defaultRange() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  return { today: toYyyymmdd(today), monthStart: toYyyymmdd(monthStart) };
}

/** 日記帳總覽頁；目前資料走 mock，後端 range API 上線後只需替換 useJournalOverview 內部邏輯 */
export default function JournalOverviewView() {
  const { today, monthStart } = defaultRange();

  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  const [unlimitedDate, setUnlimitedDate] = useState(true);
  const [page, setPage] = useState(1);

  const { items, total, loading, error } = useJournalOverview({
    dateFrom,
    dateTo,
    unlimitedDate,
    page,
    pageSize: PAGE_SIZE,
  });

  const groups = useMemo(() => groupJournalLinesByDate(items), [items]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleApplyDate = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
  };

  const handleToggleUnlimited = () => {
    setUnlimitedDate(u => !u);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1440px] px-4 pt-4 pb-28 nav:px-7 nav:pt-7 nav:pb-7">
        {/* 標題列 */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">
              日記帳總覽
            </h1>
            <p className="mt-1 text-sm text-neutral-mid">所有交易的會計分錄，依傳票日期分組</p>
          </div>
          <Button variant="ghost" icon={Download} disabled title="後端尚未提供匯出分錄資料，暫停用">
            匯出 CSV
          </Button>
        </div>

        {/* 篩選列 */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <ReconDateFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            defaultDateFrom={monthStart}
            defaultDateTo={today}
            unlimitedDate={unlimitedDate}
            onApply={handleApplyDate}
            onToggleUnlimitedDate={handleToggleUnlimited}
            unlimitedLabel="不限日期，顯示全部分錄"
          />
          {!loading && !error && (
            <span className="text-sm text-neutral-mid">共 {total} 筆</span>
          )}
        </div>

        {/* 清單 */}
        <div className="mt-4">
          {loading ? (
            <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
          ) : error ? (
            <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{error}</div>
          ) : items.length === 0 ? (
            <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">
              {unlimitedDate ? '尚無會計分錄' : '此期間無會計分錄'}
            </div>
          ) : (
            <JournalOverviewList groups={groups} />
          )}
        </div>

        {/* 分頁 */}
        {!loading && !error && items.length > 0 && (
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={p => setPage(p)} />
          </div>
        )}
      </div>
    </div>
  );
}
