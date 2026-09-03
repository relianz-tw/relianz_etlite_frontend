'use client';

import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import { sortRows } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import LockedBanner from '../components/LockedBanner';
import { useLock } from '../components/LockContext';
import WithholdingTabs from '../components/WithholdingTabs';
import AddCategoryDialog from './components/AddCategoryDialog';
import WithholdingCards from './components/WithholdingCards';
import WithholdingFilterBar from './components/WithholdingFilterBar';
import WithholdingTable from './components/WithholdingTable';
import { availableYears, CATEGORY_OPTIONS } from './data';
import { listWithholdingRecords } from './mockStore';
import type { CategoryCode, WithholdingRecord } from './types';
import { buildWithholdingQueryString, parseWithholdingFilters } from './urlState';
import type { WithholdingAdvancedFilter, WithholdingFilterState, WithholdingSortKey } from './urlState';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

function paymentDateKey(row: WithholdingRecord): number {
  return row.paymentYear * 10000 + row.paymentMonth * 100 + row.paymentDay;
}

function sumTotals(rows: WithholdingRecord[]) {
  return rows.reduce(
    (acc, r) => ({
      grossIncome: acc.grossIncome + r.grossIncome,
      withholdingAmount: acc.withholdingAmount + r.withholdingAmount,
      nhiAmount: acc.nhiAmount + r.nhiAmount,
      netPayment: acc.netPayment + r.netPayment,
    }),
    { grossIncome: 0, withholdingAmount: 0, nhiAmount: 0, netPayment: 0 },
  );
}

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

  const records = listWithholdingRecords();

  const filtered = useMemo(() => {
    const min = filters.advanced.minAmount ? Number(filters.advanced.minAmount) : undefined;
    const max = filters.advanced.maxAmount ? Number(filters.advanced.maxAmount) : undefined;
    const q = filters.query.trim();
    return records
      .filter(r => r.paymentYear === filters.year)
      .filter(r => filters.month === 0 || r.paymentMonth === filters.month)
      .filter(r => filters.category === 'all' || r.categoryCode === filters.category)
      .filter(r => !q || r.recipientName.includes(q) || r.withholdingId.includes(q))
      .filter(r => min === undefined || r.grossIncome >= min)
      .filter(r => max === undefined || r.grossIncome <= max)
      .filter(r => !filters.advanced.withholdingPaid || String(r.withholdingPaid) === filters.advanced.withholdingPaid)
      .filter(r => !filters.advanced.nhiPaid || String(r.nhiPaid) === filters.advanced.nhiPaid);
  }, [records, filters]);

  const sorted = filters.sort.key === 'paymentDate' ? sortRows(filtered, paymentDateKey, filters.sort.dir)
    : filters.sort.key === 'grossIncome' ? sortRows(filtered, r => r.grossIncome, filters.sort.dir)
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / filters.limit));
  const pageRows = sorted.slice((filters.page - 1) * filters.limit, filters.page * filters.limit);
  const allTotals = sumTotals(sorted);
  const pageTotals = sumTotals(pageRows);

  const updateFilters = (patch: Partial<WithholdingFilterState>) => {
    const next: WithholdingFilterState = { ...filters, ...patch };
    const qs = buildWithholdingQueryString(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleSearch = () => updateFilters({ query, page: 1 });
  const handleAdvancedApply = (next?: WithholdingAdvancedFilter) => updateFilters({ advanced: next ?? advanced, page: 1 });
  const handleSortToggle = (key: WithholdingSortKey) => {
    const next =
      filters.sort.key !== key
        ? { key, dir: 'asc' as const }
        : filters.sort.dir === 'asc'
          ? { key, dir: 'desc' as const }
          : { key: null, dir: 'none' as const };
    updateFilters({ sort: next });
  };
  const handleSortFieldChange = (key: WithholdingSortKey | null) => updateFilters({ sort: key ? { key, dir: 'asc' } : { key: null, dir: 'none' } });
  const handleSortDirToggle = () => {
    if (!filters.sort.key) return;
    updateFilters({ sort: { key: filters.sort.key, dir: filters.sort.dir === 'asc' ? 'desc' : 'asc' } });
  };
  const handleYearChange = (v: string) => updateFilters({ year: Number(v), page: 1 });
  const handleMonthChange = (v: string) => updateFilters({ month: Number(v), page: 1 });
  const handleCategoryChange = (v: string) => updateFilters({ category: v as CategoryCode | 'all', page: 1 });
  const handleLimitChange = (v: number) => updateFilters({ limit: v, page: 1 });
  const handlePageChange = (v: number) => updateFilters({ page: v });

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6 flex flex-col gap-4 nav:flex-row nav:items-start nav:justify-between">
          <div>
            <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">各類扣繳</h1>
            <p className="mt-1 text-sm text-neutral-mid">資料尚未串接後端，重新整理頁面會重置</p>
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

        <div className="mb-3 flex items-center justify-end gap-2 text-sm text-neutral-mid">
          每頁顯示：
          <Select widthClassName="w-20" value={String(filters.limit)} onValueChange={v => handleLimitChange(Number(v))}>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </Select>
          筆
        </div>

        <WithholdingTable rows={pageRows} totalCount={sorted.length} pageTotals={pageTotals} allTotals={allTotals} sort={filters.sort} onSortToggle={handleSortToggle} />
        <WithholdingCards
          rows={pageRows}
          totalCount={sorted.length}
          allTotals={allTotals}
          pageTotals={pageTotals}
          sort={filters.sort}
          onSortFieldChange={handleSortFieldChange}
          onSortDirToggle={handleSortDirToggle}
        />

        <Pagination page={filters.page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      <AddCategoryDialog open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)} />
    </div>
  );
}
