'use client';

import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import LockedBanner from '../components/LockedBanner';
import { useLock } from '../components/LockContext';
import WithholdingTabs from '../components/WithholdingTabs';
import AddCategoryDialog from './components/AddCategoryDialog';
import WithholdingFilterBar from './components/WithholdingFilterBar';
import WithholdingSummaryCards from './components/WithholdingSummaryCards';
import WithholdingSummaryTable from './components/WithholdingSummaryTable';
import { availableYears, CATEGORY_OPTIONS } from './data';
import { useWithholdingSummary } from './useWithholdingSummary';
import type { CategoryCode } from './types';
import { buildWithholdingQueryString, parseWithholdingFilters, SUMMARY_SORT_KEY_LABELS } from './urlState';
import type { WithholdingAdvancedFilter, WithholdingFilterState, WithholdingSummarySortKey } from './urlState';

const SORT_KEYS = Object.keys(SUMMARY_SORT_KEY_LABELS) as WithholdingSummarySortKey[];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function WithholdingListView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLocked } = useLock();

  // 篩選/排序/分頁狀態的唯一事實來源是網址查詢字串；searchParams 字串沒變時 filters 維持同一物件參照
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filters = useMemo(() => parseWithholdingFilters(searchParams), [searchParams.toString()]);

  const [query, setQuery] = useState(() => filters.query);
  const [advanced, setAdvanced] = useState<WithholdingAdvancedFilter>(() => filters.advanced);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  const { groups, loading, error, totalGroupCount, searchTotals, yearlyTotals, yearlyTotalCount, reload } = useWithholdingSummary({
    category: filters.category,
    year: filters.year,
    month: filters.month,
    query: filters.query,
    advanced: filters.advanced,
    sort: filters.sort,
    page: filters.page,
    limit: filters.limit,
  });
  void reload;

  const updateFilters = (patch: Partial<WithholdingFilterState>) => {
    const next: WithholdingFilterState = { ...filters, ...patch };
    const qs = buildWithholdingQueryString(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleSearch = () => updateFilters({ query, page: 1 });
  const handleAdvancedApply = (next?: WithholdingAdvancedFilter) => updateFilters({ advanced: next ?? advanced, page: 1 });
  const handleSortFieldChange = (key: WithholdingSummarySortKey) => updateFilters({ sort: { key, dir: filters.sort.dir }, page: 1 });
  const handleSortDirToggle = () => updateFilters({ sort: { key: filters.sort.key, dir: filters.sort.dir === 'asc' ? 'desc' : 'asc' } });
  const handleYearChange = (v: string) => updateFilters({ year: Number(v), page: 1 });
  const handleMonthChange = (v: string) => updateFilters({ month: Number(v), page: 1 });
  const handleCategoryChange = (v: string) => updateFilters({ category: v as CategoryCode | 'all', page: 1 });
  const handleLimitChange = (v: number) => updateFilters({ limit: v, page: 1 });
  const handlePageChange = (v: number) => updateFilters({ page: v });

  const totalPages = Math.max(1, Math.ceil(totalGroupCount / filters.limit));

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6 flex flex-col gap-4 nav:flex-row nav:items-start nav:justify-between">
          <div>
            <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">各類扣繳</h1>
          </div>
          <WithholdingTabs active="other" />
        </div>

        <LockedBanner className="mb-5" />

        <div className="mb-5 flex flex-col gap-3 nav:flex-row nav:items-center nav:justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="w-32">
              <Select widthClassName="w-full" value={String(filters.year)} onValueChange={handleYearChange}>
                {availableYears().map(y => (
                  <option key={y} value={String(y)}>
                    {y - 1911} 年
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-32">
              <Select widthClassName="w-full" value={String(filters.month)} onValueChange={handleMonthChange}>
                <option value="0">全部月份</option>
                {MONTH_OPTIONS.map(m => (
                  <option key={m} value={String(m)}>
                    {m} 月
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-40">
              <Select widthClassName="w-full" value={filters.category} onValueChange={handleCategoryChange}>
                <option value="all">全部類別</option>
                {CATEGORY_OPTIONS.map(o => (
                  <option key={o.code} value={o.code}>
                    {o.label} ({o.code})
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <Button icon={Plus} disabled={isLocked} onClick={() => setAddCategoryOpen(true)}>
            新增扣繳資料
          </Button>
        </div>

        <div className="mb-5">
          <WithholdingFilterBar
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            advanced={advanced}
            onAdvancedChange={setAdvanced}
            onAdvancedApply={handleAdvancedApply}
          />
        </div>

        {error && <p className="mb-3 text-sm text-semantic-error">{error}</p>}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-mid">
          <div className="flex items-center gap-1.5">
            排序：
            <Select widthClassName="w-32" value={filters.sort.key} onValueChange={v => handleSortFieldChange(v as WithholdingSummarySortKey)}>
              {SORT_KEYS.map(key => (
                <option key={key} value={key}>
                  {SUMMARY_SORT_KEY_LABELS[key]}
                </option>
              ))}
            </Select>
            <Button
              variant="ghost"
              size="sm"
              icon={filters.sort.dir === 'asc' ? ArrowUp : ArrowDown}
              onClick={handleSortDirToggle}
              aria-label="切換排序方向"
            />
          </div>
          <div className="flex items-center gap-2">
            每頁顯示：
            <Select widthClassName="w-20" value={String(filters.limit)} onValueChange={v => handleLimitChange(Number(v))}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </Select>
            筆
          </div>
        </div>

        <WithholdingSummaryTable rows={groups} loading={loading} yearlyTotalCount={yearlyTotalCount} searchTotals={searchTotals} yearlyTotals={yearlyTotals} />
        <WithholdingSummaryCards rows={groups} loading={loading} yearlyTotalCount={yearlyTotalCount} searchTotals={searchTotals} yearlyTotals={yearlyTotals} />

        <Pagination page={filters.page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      <AddCategoryDialog open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)} />
    </div>
  );
}
