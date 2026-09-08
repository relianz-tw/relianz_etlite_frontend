'use client';

import Pagination from '@/components/ui/Pagination';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import { sortRows } from '@/lib/utils';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { MOCK_FIXED_ASSETS } from './data';
import type { FixedAssetRow, FixedAssetStatusFilter, SortKey, SortState } from './types';
import { buildFixedAssetsQueryString, DEFAULT_SORT, parseFixedAssetsFilters } from './urlState';
import type { FixedAssetsFilterState } from './urlState';
import FixedAssetsCards from './components/FixedAssetsCards';
import FixedAssetsFilterBar from './components/FixedAssetsFilterBar';
import FixedAssetsSummaryCards from './components/FixedAssetsSummaryCards';
import FixedAssetsTable from './components/FixedAssetsTable';

const STATUS_TABS: { value: FixedAssetStatusFilter; label: string }[] = [
  { value: 'active', label: '使用中' },
  { value: 'completed', label: '已折舊完畢' },
  { value: 'all', label: '全部' },
];

const SORT_KEY_FN: Record<SortKey, (row: FixedAssetRow) => string | number> = {
  acquiredDate: row => row.acquiredDate,
  name: row => row.name,
  originalAmount: row => row.originalAmount,
  remainingAmount: row => row.remainingAmount,
};

/** 摘要數字由全部資料（不受篩選影響）計算，模擬後端 summary API 的回傳 */
function computeSummary(rows: FixedAssetRow[]) {
  return {
    totalCount: rows.length,
    totalOriginalAmount: rows.reduce((acc, r) => acc + r.originalAmount, 0),
    totalRemainingAmount: rows.reduce((acc, r) => acc + r.remainingAmount, 0),
  };
}

export default function FixedAssetsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filters = useMemo(() => parseFixedAssetsFilters(searchParams), [searchParams.toString()]);

  const [query, setQuery] = useState(() => filters.q);

  const summary = useMemo(() => computeSummary(MOCK_FIXED_ASSETS), []);

  const updateFilters = (patch: Partial<FixedAssetsFilterState>) => {
    const next: FixedAssetsFilterState = { ...filters, ...patch };
    const qs = buildFixedAssetsQueryString(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleSearch = () => updateFilters({ q: query, page: 1 });
  const handleStatusChange = (v: FixedAssetStatusFilter) => updateFilters({ status: v, page: 1 });
  const handlePageSizeChange = (v: number) => updateFilters({ pageSize: v, page: 1 });
  const handlePageChange = (v: number) => updateFilters({ page: v });

  const handleSortToggle = (key: SortKey) => {
    const current = filters.sort;
    const next: SortState =
      current.key !== key ? { key, dir: 'asc' } : current.dir === 'asc' ? { key, dir: 'desc' } : DEFAULT_SORT;
    updateFilters({ sort: next });
  };

  const handleSortFieldChange = (key: SortKey | null) =>
    updateFilters({ sort: key ? { key, dir: 'asc' } : DEFAULT_SORT });
  const handleSortDirToggle = () => {
    if (!filters.sort.key) return;
    updateFilters({ sort: { key: filters.sort.key, dir: filters.sort.dir === 'asc' ? 'desc' : 'asc' } });
  };

  // 篩選：狀態 + 關鍵字（名稱或科目）
  const filteredRows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return MOCK_FIXED_ASSETS.filter(row => {
      const matchStatus = filters.status === 'all' || row.status === filters.status;
      const matchQ = !q || row.name.toLowerCase().includes(q) || row.subject.toLowerCase().includes(q);
      return matchStatus && matchQ;
    });
  }, [filters.q, filters.status]);

  const sortedRows = filters.sort.key ? sortRows(filteredRows, SORT_KEY_FN[filters.sort.key], filters.sort.dir) : filteredRows;

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / filters.pageSize));
  const pagedRows = sortedRows.slice((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize);

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">固定資產</h1>
          <p className="mt-1 text-sm text-neutral-mid">查看固定資產折舊狀況與剩餘可扣抵餘額</p>
        </div>

        <div className="mb-5">
          <FixedAssetsSummaryCards
            totalCount={summary.totalCount}
            totalOriginalAmount={summary.totalOriginalAmount}
            totalRemainingAmount={summary.totalRemainingAmount}
          />
        </div>

        <div className="mb-5">
          <FixedAssetsFilterBar query={query} onQueryChange={setQuery} onSearch={handleSearch} />
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div className="w-auto">
            <SegmentedControl options={STATUS_TABS} value={filters.status} onChange={handleStatusChange} size="md" fit />
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-mid">
            每頁顯示：
            <Select widthClassName="w-20" value={String(filters.pageSize)} onValueChange={v => handlePageSizeChange(Number(v))}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </Select>
            筆
          </div>
        </div>

        <FixedAssetsTable
          rows={pagedRows}
          totalCount={sortedRows.length}
          sort={filters.sort}
          onSortToggle={handleSortToggle}
        />
        <FixedAssetsCards
          rows={pagedRows}
          totalCount={sortedRows.length}
          sort={filters.sort}
          onSortFieldChange={handleSortFieldChange}
          onSortDirToggle={handleSortDirToggle}
        />

        <Pagination page={filters.page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </div>
  );
}
