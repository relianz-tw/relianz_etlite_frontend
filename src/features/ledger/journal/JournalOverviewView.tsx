'use client';

import { updateEntrySummary } from '@/api/ledger';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import ReconDateFilter from '@/features/reconciliation/components/ReconDateFilter';
import { Download } from 'lucide-react';
import { useState } from 'react';
import JournalOverviewList from './JournalOverviewList';
import { useJournalOverview } from './useJournalOverview';

const DEFAULT_PAGE_SIZE = 20;

function toYyyymmdd(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function defaultRange() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  return { today: toYyyymmdd(today), monthStart: toYyyymmdd(monthStart) };
}

/** 日記帳總覽頁 */
export default function JournalOverviewView() {
  const { today, monthStart } = defaultRange();

  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  const [unlimitedDate, setUnlimitedDate] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { vouchers, total, loading, error, patchLineSummary } = useJournalOverview({
    dateFrom,
    dateTo,
    unlimitedDate,
    page,
    pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleSaveSummary = async (lineUuid: string, summary: string) => {
    const result = await updateEntrySummary({ ledgerEntryLinesUuid: lineUuid, summary });
    patchLineSummary(result.lineUuid, result.summary, result.updateBy);
  };

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
          <div className="flex items-center gap-3">
            {!loading && !error && (
              <span className="text-sm text-neutral-mid">共 {total} 筆分錄</span>
            )}
            <div className="flex items-center gap-2 text-sm text-neutral-mid">
              每頁顯示：
              <Select widthClassName="w-20" value={String(pageSize)} onValueChange={v => handlePageSizeChange(Number(v))}>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
              筆
            </div>
          </div>
        </div>

        {/* 清單 */}
        <div className="mt-4">
          {loading ? (
            <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
          ) : error ? (
            <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{error}</div>
          ) : vouchers.length === 0 ? (
            <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">
              {unlimitedDate ? '尚無會計分錄' : '此期間無會計分錄'}
            </div>
          ) : (
            <JournalOverviewList vouchers={vouchers} onSaveSummary={handleSaveSummary} />
          )}
        </div>

        {/* 分頁 */}
        {!loading && !error && vouchers.length > 0 && (
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={p => setPage(p)} />
          </div>
        )}
      </div>
    </div>
  );
}
