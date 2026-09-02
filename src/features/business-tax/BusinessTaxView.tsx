'use client';

import type { VatInvoiceFilterBody, VatPeriodSummaryDto } from '@/api/types';
import { fetchVatInputInvoices, fetchVatOutputInvoices, fetchVatPeriodSummary } from '@/api/vat';
import Button from '@/components/ui/Button';
import { parseRocDate } from '@/components/ui/DatePicker';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { formatYmd } from '@/features/ledger/transaction/data';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency, sortRows } from '@/lib/utils';
import { Download } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import FilterBar from './components/FilterBar';
import InvoiceCards from './components/InvoiceCards';
import InvoiceTable from './components/InvoiceTable';
import SummaryCards from './components/SummaryCards';
import TaxReportDialog from './components/TaxReportDialog';
import { FILING_PERIODS, mapVatItemsToRows, parseFilingPeriod, REPORT_SUMMARY } from './data';
import type { AdvancedFilter, SortKey, SortState, TaxInvoiceRow, TaxSide } from './types';
import { buildBusinessTaxQueryString, DEFAULT_SORT, parseBusinessTaxFilters } from './urlState';
import type { BusinessTaxFilterState } from './urlState';

const SIDE_TABS: { value: TaxSide; label: string }[] = [
  { value: 'sales', label: '銷項' },
  { value: 'purchase', label: '進項' },
];

const SORT_KEY_FN: Record<SortKey, (row: TaxInvoiceRow) => string | number> = {
  date: row => row.date,
  id: row => row.id,
};

/** 依簡易搜尋（發票字軌+號碼）與進階條件（金額/日期區間）組成 filter API 的 request body（不含 companyUuid，由 API 層自動補入） */
function buildFilterBody(
  period: string,
  page: number,
  limit: number,
  query: string,
  advanced: AdvancedFilter,
): Omit<VatInvoiceFilterBody, 'companyUuid'> {
  const { cmsYear, cmsPhase } = parseFilingPeriod(period);
  const value = query.trim();
  return {
    cmsYear,
    cmsPhase,
    page,
    limit,
    amountFrom: advanced.minAmount ? Number(advanced.minAmount) : undefined,
    amountTo: advanced.maxAmount ? Number(advanced.maxAmount) : undefined,
    dateFrom: formatYmd(parseRocDate(advanced.dateFrom)),
    dateTo: formatYmd(parseRocDate(advanced.dateTo)),
    ...(value ? { invoiceNumber: value } : {}),
    ...(advanced.taxIdNumber.trim() ? { taxIdNumber: advanced.taxIdNumber.trim() } : {}),
    ...(advanced.companyName.trim() ? { companyName: advanced.companyName.trim() } : {}),
    ...(advanced.isVoid ? { isVoid: advanced.isVoid === 'true' } : {}),
  };
}

export default function BusinessTaxView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 篩選/排序/分頁狀態的唯一事實來源是網址查詢字串；searchParams 字串沒變時 filters 維持同一物件參照，
  // 避免下方 useEffect 因物件參照每次 render 都不同而重複抓資料
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filters = useMemo(() => parseBusinessTaxFilters(searchParams), [searchParams.toString()]);

  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // 搜尋關鍵字／進階條件：使用者「送出前」的草稿，掛載時取網址目前值作初始值，
  // 送出（搜尋／套用）後才寫回網址；網址本身不再需要對應的「已套用」local state
  const [query, setQuery] = useState(() => filters.query);
  const [advanced, setAdvanced] = useState<AdvancedFilter>(() => filters.advanced);

  const [rows, setRows] = useState<TaxInvoiceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalBusinessTax, setTotalBusinessTax] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pageSales, setPageSales] = useState(0);
  const [pageBusinessTax, setPageBusinessTax] = useState(0);
  const [pageAmount, setPageAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 三張統計卡數字：來自 periodSummary API，只依 period 變動，不隨 side／分頁／搜尋重抓
  const [summary, setSummary] = useState<VatPeriodSummaryDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { cmsYear, cmsPhase } = parseFilingPeriod(filters.period);
    fetchVatPeriodSummary({ cmsYear, cmsPhase })
      .then(result => {
        if (!cancelled) setSummary(result);
      })
      .catch(() => {
        // 統計卡查詢失敗僅影響頂部卡片顯示，不影響下方列表，故不特別呈現錯誤訊息
      });
    return () => {
      cancelled = true;
    };
  }, [filters.period]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const body = buildFilterBody(filters.period, filters.page, filters.limit, filters.query, filters.advanced);
    const request = filters.side === 'sales' ? fetchVatOutputInvoices(body) : fetchVatInputInvoices(body);

    request
      .then(result => {
        if (cancelled) return;
        setRows(mapVatItemsToRows(result.items));
        setTotal(result.total);
        setTotalSales(result.totalSales);
        setTotalBusinessTax(result.totalBusinessTax);
        setTotalAmount(result.totalAmount);
        setPageSales(result.pageSales);
        setPageBusinessTax(result.pageBusinessTax);
        setPageAmount(result.pageAmount);
      })
      .catch(err => {
        if (cancelled) return;
        setError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  // 以目前 filters 為基礎合併變更後寫回網址；period/side/搜尋/排序/分頁/每頁筆數的所有異動皆經此函式
  const updateFilters = (patch: Partial<BusinessTaxFilterState>) => {
    const next: BusinessTaxFilterState = { ...filters, ...patch };
    const qs = buildBusinessTaxQueryString(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleSearch = () => updateFilters({ query, page: 1 });
  // next 供「清除」按鈕使用：避免 onAdvancedChange 與 onAdvancedApply 連續呼叫時讀到尚未更新的 state
  const handleAdvancedApply = (next?: AdvancedFilter) => updateFilters({ advanced: next ?? advanced, page: 1 });
  // 桌機表頭三態循環：none → asc → desc → none
  const handleSortToggle = (key: SortKey) => {
    const next: SortState =
      filters.sort.key !== key ? { key, dir: 'asc' } : filters.sort.dir === 'asc' ? { key, dir: 'desc' } : DEFAULT_SORT;
    updateFilters({ sort: next });
  };
  // 手機排序入口：下拉直接指定欄位（預設 asc），方向鈕只切換 asc/desc
  const handleSortFieldChange = (key: SortKey | null) => updateFilters({ sort: key ? { key, dir: 'asc' } : DEFAULT_SORT });
  const handleSortDirToggle = () => {
    if (!filters.sort.key) return;
    updateFilters({ sort: { key: filters.sort.key, dir: filters.sort.dir === 'asc' ? 'desc' : 'asc' } });
  };
  // 切換銷項／進項時重置排序，避免帶著上一個身分別的排序狀態
  const handleSideChange = (v: TaxSide) => updateFilters({ side: v, sort: DEFAULT_SORT, page: 1 });
  const handlePeriodChange = (v: string) => updateFilters({ period: v, page: 1 });
  const handleLimitChange = (v: number) => updateFilters({ limit: v, page: 1 });
  const handlePageChange = (v: number) => updateFilters({ page: v });

  // 排序僅對目前這頁的資料進行（API 未提供排序），與帳簿列表行為一致
  const sortedRows = filters.sort.key ? sortRows(rows, SORT_KEY_FN[filters.sort.key], filters.sort.dir) : rows;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">營業稅中心</h1>
          <p className="mt-1 text-sm text-neutral-mid">營業稅申報</p>
        </div>

        <div className="mb-5 w-64">
          <Select widthClassName="w-full" value={filters.period} onValueChange={handlePeriodChange}>
            {FILING_PERIODS.map(p => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="mb-5">
          <SummaryCards summary={summary} />
        </div>

        <div className="mb-5">
          <FilterBar
            onOpenReport={() => setReportDialogOpen(true)}
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            advanced={advanced}
            onAdvancedChange={setAdvanced}
            onAdvancedApply={handleAdvancedApply}
          />
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div className="w-64">
            <SegmentedControl options={SIDE_TABS} value={filters.side} onChange={handleSideChange} size="md" />
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-mid">
            每頁顯示：
            <Select widthClassName="w-20" value={String(filters.limit)} onValueChange={v => handleLimitChange(Number(v))}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </Select>
            筆
          </div>
        </div>

        {loading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : error ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{error}</div>
        ) : (
          <>
            <InvoiceTable
              side={filters.side}
              rows={sortedRows}
              totalCount={total}
              totalSales={fmtCurrency(totalSales)}
              totalBusinessTax={fmtCurrency(totalBusinessTax)}
              totalAmount={fmtCurrency(totalAmount)}
              pageSales={fmtCurrency(pageSales)}
              pageBusinessTax={fmtCurrency(pageBusinessTax)}
              pageAmount={fmtCurrency(pageAmount)}
              sort={filters.sort}
              onSortToggle={handleSortToggle}
              searchParams={searchParams}
            />
            <InvoiceCards
              side={filters.side}
              rows={sortedRows}
              totalCount={total}
              totalAmount={fmtCurrency(totalAmount)}
              pageAmount={fmtCurrency(pageAmount)}
              sort={filters.sort}
              onSortFieldChange={handleSortFieldChange}
              onSortDirToggle={handleSortDirToggle}
              searchParams={searchParams}
            />
          </>
        )}

        <Pagination
          page={filters.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          rightSlot={
            <Button variant="ghost" icon={Download} disabled title="後端尚未提供匯出總表資料，暫停用">
              匯出總表
            </Button>
          }
        />
      </div>

      <TaxReportDialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} summary={REPORT_SUMMARY} />
    </div>
  );
}
