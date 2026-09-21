'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import { fmtCurrency } from '@/lib/utils';
import { ArrowDown, ArrowUp, ChevronLeft } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import WithholdingCards from './components/WithholdingCards';
import WithholdingTable from './components/WithholdingTable';
import { availableYears, categoryLabel } from './data';
import type { CategoryCode } from './types';
import { buildWithholdingGroupQueryString, parseWithholdingGroupFilters, resolveWithholdingBackHref, SORT_KEY_LABELS } from './urlState';
import type { WithholdingGroupFilterState, WithholdingSortKey } from './urlState';
import { useWithholdingGroupDetail } from './useWithholdingGroupDetail';

const SORT_KEYS = Object.keys(SORT_KEY_LABELS) as WithholdingSortKey[];
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

interface WithholdingGroupViewProps {
  groupKey: string;
}

/**
 * 各類扣繳彙總群組（L1 點擊一列後）內的明細列表（L2）：同一所得人同一類別逐期明細，
 * 點一列再進 L3 單筆詳細（見 components/WithholdingTable.tsx／WithholdingCards.tsx）。
 */
export default function WithholdingGroupView({ groupKey }: WithholdingGroupViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryCode = (searchParams.get('ic') as CategoryCode | null) ?? '9A';
  const backHref = resolveWithholdingBackHref(searchParams.get('from') ?? undefined);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filters = useMemo(() => parseWithholdingGroupFilters(searchParams), [searchParams.toString()]);

  const { group, records, loading, error, totalCount, searchTotals } = useWithholdingGroupDetail({
    groupKey,
    categoryCode,
    year: filters.year,
    month: filters.month,
    sort: filters.sort,
    page: filters.page,
    limit: filters.limit,
  });

  // 更新篩選時保留現有 from（返回彙總列表用），否則每次改篩選都會遺失來源頁的查詢條件
  const updateFilters = (patch: Partial<WithholdingGroupFilterState>) => {
    const next: WithholdingGroupFilterState = { ...filters, ...patch };
    const params = new URLSearchParams(buildWithholdingGroupQueryString(next));
    params.set('ic', categoryCode);
    const from = searchParams.get('from');
    if (from) params.set('from', from);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSortFieldChange = (key: WithholdingSortKey) => updateFilters({ sort: { key, dir: filters.sort.dir }, page: 1 });
  const handleSortDirToggle = () => updateFilters({ sort: { key: filters.sort.key, dir: filters.sort.dir === 'asc' ? 'desc' : 'asc' } });
  const handleYearChange = (v: string) => updateFilters({ year: Number(v), page: 1 });
  const handleMonthChange = (v: string) => updateFilters({ month: Number(v), page: 1 });
  const handleLimitChange = (v: number) => updateFilters({ limit: v, page: 1 });
  const handlePageChange = (v: number) => updateFilters({ page: v });

  const totalPages = Math.max(1, Math.ceil(totalCount / filters.limit));

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            aria-label="返回彙總列表"
            onClick={() => router.push(backHref)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-mid hover:bg-surface-cream hover:text-neutral-dark"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-notoSerif text-[22px] font-semibold tracking-tight text-neutral-dark">{group?.recipientName || '扣繳明細'}</h1>
              <Badge tone="info">{categoryLabel(categoryCode)}</Badge>
            </div>
            {group?.rentalAddress && <p className="mt-1 text-sm text-neutral-mid">{group.rentalAddress}</p>}
          </div>
        </div>

        {group && (
          <div className="mb-5 grid grid-cols-2 gap-3 rounded-md border border-neutral-blue-gray/30 bg-white p-4 nav:grid-cols-4">
            <div>
              <div className="text-xs text-neutral-mid">筆數</div>
              <div className="font-mono text-lg font-semibold text-neutral-dark">{group.recordCount}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-mid">所得金額</div>
              <div className="font-mono text-lg font-semibold tabular-nums text-neutral-dark">{fmtCurrency(group.grossIncome)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-mid">扣繳稅額</div>
              <div className="font-mono text-lg font-semibold tabular-nums text-neutral-dark">{fmtCurrency(group.withholdingAmount)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-mid">支付金額</div>
              <div className="font-mono text-lg font-semibold tabular-nums text-neutral-dark">{fmtCurrency(group.netPayment)}</div>
            </div>
          </div>
        )}

        <div className="mb-5 flex flex-wrap gap-2">
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
        </div>

        {error && <p className="mb-3 text-sm text-semantic-error">{error}</p>}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-mid">
          <div className="flex items-center gap-1.5">
            排序：
            <Select widthClassName="w-40" value={filters.sort.key} onValueChange={v => handleSortFieldChange(v as WithholdingSortKey)}>
              {SORT_KEYS.map(key => (
                <option key={key} value={key}>
                  {SORT_KEY_LABELS[key]}
                </option>
              ))}
            </Select>
            <Button variant="ghost" size="sm" icon={filters.sort.dir === 'asc' ? ArrowUp : ArrowDown} onClick={handleSortDirToggle} aria-label="切換排序方向" />
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

        <WithholdingTable rows={records} loading={loading} searchTotals={searchTotals} />
        <WithholdingCards rows={records} loading={loading} searchTotals={searchTotals} />

        <Pagination page={filters.page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </div>
  );
}
