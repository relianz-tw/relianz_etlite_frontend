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
import { useEffect, useState } from 'react';
import FilterBar from './components/FilterBar';
import InvoiceCards from './components/InvoiceCards';
import InvoiceTable from './components/InvoiceTable';
import SummaryCards from './components/SummaryCards';
import TaxReportDialog from './components/TaxReportDialog';
import { FILING_PERIODS, mapVatItemsToRows, parseFilingPeriod, REPORT_SUMMARY } from './data';
import type { AdvancedFilter, SortKey, SortState, TaxInvoiceRow, TaxSide } from './types';

const SIDE_TABS: { value: TaxSide; label: string }[] = [
  { value: 'sales', label: '銷項' },
  { value: 'purchase', label: '進項' },
];

const EMPTY_ADVANCED_FILTER: AdvancedFilter = { minAmount: '', maxAmount: '', dateFrom: '', dateTo: '', taxIdNumber: '', companyName: '', isVoid: '' };
const DEFAULT_SORT: SortState = { key: null, dir: 'none' };
const DEFAULT_LIMIT = 10;
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
  const [period, setPeriod] = useState(FILING_PERIODS[FILING_PERIODS.length - 1].value);
  const [side, setSide] = useState<TaxSide>('sales');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  // 搜尋關鍵字：query 是輸入框當下內容，appliedQuery 是按下「搜尋」後才套用的條件
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [advanced, setAdvanced] = useState<AdvancedFilter>(EMPTY_ADVANCED_FILTER);
  const [appliedAdvanced, setAppliedAdvanced] = useState<AdvancedFilter>(EMPTY_ADVANCED_FILTER);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);

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
    const { cmsYear, cmsPhase } = parseFilingPeriod(period);
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
  }, [period]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const body = buildFilterBody(period, page, limit, appliedQuery, appliedAdvanced);
    const request = side === 'sales' ? fetchVatOutputInvoices(body) : fetchVatInputInvoices(body);

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
  }, [period, side, page, limit, appliedQuery, appliedAdvanced]);

  const handleSearch = () => {
    setAppliedQuery(query);
    setPage(1);
  };
  // next 供「清除」按鈕使用：避免 onAdvancedChange 與 onAdvancedApply 連續呼叫時讀到尚未更新的 state
  const handleAdvancedApply = (next?: AdvancedFilter) => {
    setAppliedAdvanced(next ?? advanced);
    setPage(1);
  };
  // 桌機表頭三態循環：none → asc → desc → none
  const handleSortToggle = (key: SortKey) => {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return DEFAULT_SORT;
    });
  };
  // 手機排序入口：下拉直接指定欄位（預設 asc），方向鈕只切換 asc/desc
  const handleSortFieldChange = (key: SortKey | null) => setSort(key ? { key, dir: 'asc' } : DEFAULT_SORT);
  const handleSortDirToggle = () => setSort(prev => (prev.key ? { key: prev.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : prev));
  // 切換銷項／進項時重置排序，避免帶著上一個身分別的排序狀態
  const handleSideChange = (v: TaxSide) => {
    setSide(v);
    setSort(DEFAULT_SORT);
    setPage(1);
  };
  const handlePeriodChange = (v: string) => {
    setPeriod(v);
    setPage(1);
  };
  const handleLimitChange = (v: number) => {
    setLimit(v);
    setPage(1);
  };

  // 排序僅對目前這頁的資料進行（API 未提供排序），與帳簿列表行為一致
  const sortedRows = sort.key ? sortRows(rows, SORT_KEY_FN[sort.key], sort.dir) : rows;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">營業稅中心</h1>
          <p className="mt-1 text-sm text-neutral-mid">營業稅申報</p>
        </div>

        <div className="mb-5 w-64">
          <Select widthClassName="w-full" value={period} onValueChange={handlePeriodChange}>
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

        <div className="mb-3 w-64">
          <SegmentedControl options={SIDE_TABS} value={side} onChange={handleSideChange} size="md" />
        </div>

        {loading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : error ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{error}</div>
        ) : (
          <>
            <InvoiceTable
              side={side}
              rows={sortedRows}
              totalCount={total}
              totalSales={fmtCurrency(totalSales)}
              totalBusinessTax={fmtCurrency(totalBusinessTax)}
              totalAmount={fmtCurrency(totalAmount)}
              pageSales={fmtCurrency(pageSales)}
              pageBusinessTax={fmtCurrency(pageBusinessTax)}
              pageAmount={fmtCurrency(pageAmount)}
              limit={limit}
              onLimitChange={handleLimitChange}
              sort={sort}
              onSortToggle={handleSortToggle}
            />
            <InvoiceCards
              side={side}
              rows={sortedRows}
              totalCount={total}
              totalAmount={fmtCurrency(totalAmount)}
              pageAmount={fmtCurrency(pageAmount)}
              sort={sort}
              onSortFieldChange={handleSortFieldChange}
              onSortDirToggle={handleSortDirToggle}
            />
          </>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
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
