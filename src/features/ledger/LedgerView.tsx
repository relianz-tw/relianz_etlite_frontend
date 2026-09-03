'use client';

import { listChannelRules } from '@/api/channelRules';
import { fetchPayables, fetchPayablesPaid, fetchReceivables, fetchReceivablesCollected } from '@/api/ledger';
import type { PayablesFilterBody, ReceivablesFilterBody } from '@/api/types';
import Button from '@/components/ui/Button';
import { formatRocDate, parseRocDate } from '@/components/ui/DatePicker';
import ExportRangeDialog from '@/components/ui/ExportRangeDialog';
import Pagination from '@/components/ui/Pagination';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import TabBar from '@/components/ui/TabBar';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency, sortRows } from '@/lib/utils';
import { Download } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import FilterBar from './components/FilterBar';
import LedgerCards from './components/LedgerCards';
import LedgerTable from './components/LedgerTable';
import SummaryCards from './components/SummaryCards';
import { mapPayableItemsToRows, mapReceivableItemsToRows } from './data';
import { formatYmd } from './transaction/data';
import type { AdvancedFilter, PurchaseSubTab, PurchaseRow, QuickSearchField, SalesRow, SalesSubTab, Side, SortKey, SortState } from './types';
import { buildLedgerQueryString, defaultSubTabForSide, DEFAULT_SORT, parseLedgerFilters } from './urlState';
import type { LedgerFilterState } from './urlState';

const getCounterparty = (row: SalesRow | PurchaseRow) => ('counterparty' in row ? row.counterparty : row.party);

/** 各排序欄位對應的取值方式，供 sortRows 共用；counterparty 統一取買受人/賣家名稱/交易敘述 */
const SORT_KEY_FN: Record<SortKey, (row: SalesRow | PurchaseRow) => string | number> = {
  id: row => row.id,
  amount: row => row.amount,
  counterparty: row => getCounterparty(row),
  date: row => row.date,
};

/**
 * 依簡易搜尋（交易編號/發票號碼 → filterType 0/1）與進階條件（金額/日期區間）組成 filter API 的 request body
 * （不含 companyUuid，由 API 層自動補入）。四支 filter 端點（payables/receivables 的 filter 與 paid/collected）
 * body 結構一致，PayablesFilterBody 與 ReceivablesFilterBody 為結構相同型別，故共用同一個組裝函式；
 * 回傳型別取兩者交集，讓 channelUuid 依 side 帶出的 paymentChannelUuid／counterpartyUuid 皆合法。
 */
function buildFilterBody(
  page: number,
  limit: number,
  quickField: QuickSearchField,
  query: string,
  advanced: AdvancedFilter,
  side: Side,
  channelUuid: string | null,
): Omit<PayablesFilterBody, 'companyUuid'> & Omit<ReceivablesFilterBody, 'companyUuid'> {
  const value = query.trim();
  return {
    page,
    limit,
    amountFrom: advanced.minAmount ? Number(advanced.minAmount) : undefined,
    amountTo: advanced.maxAmount ? Number(advanced.maxAmount) : undefined,
    dateFrom: formatYmd(parseRocDate(advanced.dateFrom)),
    dateTo: formatYmd(parseRocDate(advanced.dateTo)),
    // 交易編號/發票號碼須成對傳遞，空值則兩者皆不帶（後端視為不篩）
    ...(value ? { filterType: quickField === 'id' ? 0 : 1, filterValue: value } : {}),
    // 帳簿總覽「銷售管道／廠商佔比」卡片下鑽篩選；彙總數字（totals）由後端一併套用此條件重算
    ...(channelUuid ? (side === 'sales' ? { paymentChannelUuid: channelUuid } : { counterpartyUuid: channelUuid }) : {}),
  };
}

/** 圖表 X 軸的預設區間：今天往前推 62 天，天數對齊既有假趨勢資料的展示長度 */
function defaultChartRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - 61 * 86400000);
  return { from: formatRocDate(from), to: formatRocDate(to) };
}

const SALES_SUB_TABS: { value: SalesSubTab; label: string }[] = [
  { value: 'receivable', label: '應收帳款' },
  { value: 'received', label: '已收款' },
];
const PURCHASE_SUB_TABS: { value: PurchaseSubTab; label: string }[] = [
  { value: 'payable', label: '應付帳款' },
  { value: 'paid', label: '已付款' },
];

export default function LedgerView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 篩選/排序/分頁狀態的唯一事實來源是網址查詢字串；searchParams 字串沒變時 filters 維持同一物件參照，
  // 避免下方 useEffect 因物件參照每次 render 都不同而重複抓資料
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filters = useMemo(() => parseLedgerFilters(searchParams), [searchParams.toString()]);

  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // 簡易搜尋／進階搜尋輸入框內容：使用者「送出前」的草稿，掛載時取網址目前值作初始值，
  // 送出（搜尋／套用）後才寫回網址；網址本身不再需要對應的「已套用」local state
  const [quickField, setQuickField] = useState<QuickSearchField>(() => filters.quickField);
  const [query, setQuery] = useState(() => filters.query);
  const [advanced, setAdvanced] = useState<AdvancedFilter>(() => filters.advanced);

  // 帳簿總覽卡片 A（趨勢圖）X 軸涵蓋的區間，刻意與列表的日期篩選（filters.advanced）解耦：
  // 若圖表直接吃 filters.advanced.dateFrom/dateTo，點下某根柱子會把區間縮成該柱涵蓋的範圍，
  // 圖表重繪只剩一（或少數幾）根柱子、使用者再也回不去。
  // ⚠️ 不能只靠「起訖是否同一天」判斷是否為使用者手動輸入的區間篩選——週檢視點擊產生的
  // dateFrom/dateTo 本身就橫跨 7 天（from !== to），與使用者在進階搜尋手動選區間無法區分。
  // 因此改用 skipChartRangeSyncRef 明確標記「這次 filters.advanced 變動是點擊趨勢圖造成的」，
  // 該次一律跳過同步；只有使用者透過 FilterBar 手動輸入/清除日期時才會更新圖表區間。
  const [chartRange, setChartRange] = useState(defaultChartRange);
  const skipChartRangeSyncRef = useRef(false);
  useEffect(() => {
    if (skipChartRangeSyncRef.current) {
      skipChartRangeSyncRef.current = false;
      return;
    }
    const { dateFrom, dateTo } = filters.advanced;
    if (dateFrom && dateTo) setChartRange({ from: dateFrom, to: dateTo });
    else if (!dateFrom && !dateTo) setChartRange(defaultChartRange());
  }, [filters.advanced]);
  // 目前列表套用的日期篩選；供卡片 A 標示選取態
  const selectedRange = filters.advanced.dateFrom && filters.advanced.dateTo ? { from: filters.advanced.dateFrom, to: filters.advanced.dateTo } : null;

  // 應付/已付/應收/已收四個子分頁共用同一組載入狀態；四支 filter API 依 side + 子分頁擇一呼叫
  const [rows, setRows] = useState<(SalesRow | PurchaseRow)[]>([]);
  const [total, setTotal] = useState(0);
  // 本頁／全部加總（皆排除折讓）：後端直接回傳，前端不自行加總，見 pageAmount/totalAmount/totalCount 欄位說明
  const [pageAmount, setPageAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 銷售管道名稱反查表：帳簿列表「銷售管道」欄位唯讀顯示用，一次載入不隨 side/分頁重抓
  const [channelNameByUuid, setChannelNameByUuid] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    let cancelled = false;
    listChannelRules()
      .then(list => {
        if (!cancelled) setChannelNameByUuid(new Map(list.map(c => [c.channelUuid, c.channelName])));
      })
      .catch(() => {
        // 名稱反查失敗僅影響顯示（退回顯示「未知」），不影響帳簿主要功能，故不特別呈現錯誤訊息
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 以目前 filters 為基礎合併變更後寫回網址；side/subTab/搜尋/排序/分頁的所有異動皆經此函式
  const updateFilters = (patch: Partial<LedgerFilterState>) => {
    const next: LedgerFilterState = { ...filters, ...patch };
    const qs = buildLedgerQueryString(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const body = buildFilterBody(filters.page, filters.limit, filters.quickField, filters.query, filters.advanced, filters.side, filters.channelUuid);

    // 折讓單改為掛在原單展開區內顯示（見 LedgerTable/LedgerCards 的 LedgerAllowanceChildren），
    // 故從最上層列表過濾掉；下方「本頁加總／全部加總」改吃後端 pageAmount/totalAmount/totalCount
    // （皆已排除折讓），不再由前端 reduce 拼湊；分頁頁數仍用後端原始 total（含折讓）計算，不受影響；
    // 頂部三張卡片數字改由 useLedgerSummary 另外抓取，不吃這裡的結果
    const request =
      filters.side === 'purchase'
        ? (filters.subTab === 'payable' ? fetchPayables(body) : fetchPayablesPaid(body)).then(async result => ({
            rows: (await mapPayableItemsToRows(result.items)).filter(row => !row.isAllowance),
            total: result.total,
            pageAmount: result.pageAmount,
            totalAmount: result.totalAmount,
            totalCount: result.totalCount,
          }))
        : (filters.subTab === 'receivable' ? fetchReceivables(body) : fetchReceivablesCollected(body)).then(async result => ({
            rows: (await mapReceivableItemsToRows(result.items)).filter(row => !row.isAllowance),
            total: result.total,
            pageAmount: result.pageAmount,
            totalAmount: result.totalAmount,
            totalCount: result.totalCount,
          }));

    request
      .then(result => {
        if (cancelled) return;
        setRows(result.rows);
        setTotal(result.total);
        setPageAmount(result.pageAmount);
        setTotalAmount(result.totalAmount);
        setTotalCount(result.totalCount);
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

  // 桌機表頭三態循環：none → asc → desc → none；切換到不同欄位時重新從 asc 開始
  const handleSortToggle = (key: SortKey) => {
    const next: SortState =
      filters.sort.key !== key ? { key, dir: 'asc' } : filters.sort.dir === 'asc' ? { key, dir: 'desc' } : DEFAULT_SORT;
    updateFilters({ sort: next });
  };
  // 手機排序入口：下拉直接指定欄位（預設 asc），方向鈕只切換 asc/desc（選「不排序」才回到 none）
  const handleSortFieldChange = (key: SortKey | null) => updateFilters({ sort: key ? { key, dir: 'asc' } : DEFAULT_SORT });
  const handleSortDirToggle = () => {
    if (!filters.sort.key) return;
    updateFilters({ sort: { key: filters.sort.key, dir: filters.sort.dir === 'asc' ? 'desc' : 'asc' } });
  };

  const handleSearch = () => updateFilters({ quickField, query, page: 1 });
  const handleClearQuick = () => {
    setQuery('');
    updateFilters({ query: '', page: 1 });
  };
  // next 供「清除」按鈕使用：避免 onAdvancedChange 與 onAdvancedApply 連續呼叫時讀到尚未更新的 state
  const handleAdvancedApply = (next?: AdvancedFilter) => updateFilters({ advanced: next ?? advanced, page: 1 });

  // 切換銷項／進項時重設簡易搜尋，避免帶著不相干欄位查詢；同步清空 rows 避免新 side 用舊型別（SalesRow/PurchaseRow 欄位不同）資料渲染而出錯
  // 進階條件（金額/日期區間）刻意不重置，維持切換銷項/進項仍套用同一組進階篩選的既有行為
  const handleSideChange = (v: Side) => {
    setQuickField('id');
    setQuery('');
    setRows([]);
    updateFilters({ side: v, subTab: defaultSubTabForSide(v), quickField: 'id', query: '', sort: DEFAULT_SORT, page: 1, channelUuid: null });
  };
  const handleSalesSubTabChange = (v: SalesSubTab) => {
    setRows([]);
    updateFilters({ subTab: v, page: 1 });
  };
  const handlePurchaseSubTabChange = (v: PurchaseSubTab) => {
    setRows([]);
    updateFilters({ subTab: v, page: 1 });
  };
  // 卡片 A（趨勢圖）長條點擊：寫回日期區間；再點同一根（range 為 null）代表清除
  const handleTrendRangeSelect = (range: { from: string; to: string } | null) => {
    const next: AdvancedFilter = { ...advanced, dateFrom: range?.from ?? '', dateTo: range?.to ?? '' };
    setAdvanced(next); // 同步進階搜尋輸入框草稿，避免面板顯示與網址不一致
    skipChartRangeSyncRef.current = true; // 這次 filters.advanced 變動由圖表點擊觸發，圖表區間本身不跟著變
    updateFilters({ advanced: next, page: 1 });
  };
  // 卡片 C（管道／廠商佔比）長條點擊：寫回 channelUuid；再點同一項清除
  const handleChannelSelect = (uuid: string | null) => updateFilters({ channelUuid: uuid, page: 1 });
  const handleLimitChange = (v: number) => updateFilters({ limit: v, page: 1 });

  // 排序僅對目前這頁的資料進行（API 未提供排序），桌機表格與手機卡片共用同一份已排序資料
  const sortKeyFn = filters.sort.key ? SORT_KEY_FN[filters.sort.key] : null;
  const sortedRows = sortKeyFn ? sortRows(rows, sortKeyFn, filters.sort.dir) : rows;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">帳簿</h1>
          <p className="mt-1 text-sm text-neutral-mid">有開立發票或收據的交易</p>
        </div>

        <div className="mb-5">
          <SummaryCards
            side={filters.side}
            chartRange={chartRange}
            selectedRange={selectedRange}
            channelUuid={filters.channelUuid}
            onRangeSelect={handleTrendRangeSelect}
            onChannelSelect={handleChannelSelect}
          />
        </div>

        <div className="mb-5">
          <FilterBar
            side={filters.side}
            quickField={quickField}
            onQuickFieldChange={setQuickField}
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            onClearQuick={handleClearQuick}
            advanced={advanced}
            onAdvancedChange={setAdvanced}
            onAdvancedApply={handleAdvancedApply}
          />
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="w-full nav:w-56">
            <SegmentedControl
              options={[
                { value: 'sales', label: '銷項' },
                { value: 'purchase', label: '進項' },
              ]}
              value={filters.side}
              onChange={handleSideChange}
              size="md"
            />
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
        {/* 表格檢視切換：底線分頁附著於下方表格卡片頂部，與上方主切換（銷項/進項）視覺區隔；
            手機無下方桌機表格可接續，維持四角圓角獨立列，桌機則去除下緣圓角以接續表格 */}
        <div className="mb-3 flex items-stretch gap-3 rounded-md border border-neutral-blue-gray/30 bg-white px-2 nav:mb-0 nav:rounded-b-none">
          <TabBar
            options={filters.side === 'sales' ? SALES_SUB_TABS : PURCHASE_SUB_TABS}
            value={filters.subTab}
            onChange={v => (filters.side === 'sales' ? handleSalesSubTabChange(v as SalesSubTab) : handlePurchaseSubTabChange(v as PurchaseSubTab))}
          />
        </div>

        {loading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid nav:rounded-t-none nav:border nav:border-t-0 nav:border-neutral-blue-gray/30">
            載入中…
          </div>
        ) : error ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error nav:rounded-t-none nav:border nav:border-t-0 nav:border-neutral-blue-gray/30">
            {error}
          </div>
        ) : filters.side === 'sales' ? (
          <Fragment key={`sales-${filters.subTab}`}>
            <LedgerTable
              side="sales"
              subTab={filters.subTab as SalesSubTab}
              rows={sortedRows as SalesRow[]}
              pageAmount={fmtCurrency(pageAmount)}
              totalAmount={fmtCurrency(totalAmount)}
              totalCount={totalCount}
              sort={filters.sort}
              onSortToggle={handleSortToggle}
              channelNameByUuid={channelNameByUuid}
            />
            <LedgerCards
              side="sales"
              subTab={filters.subTab as SalesSubTab}
              rows={sortedRows as SalesRow[]}
              pageAmount={fmtCurrency(pageAmount)}
              totalAmount={fmtCurrency(totalAmount)}
              totalCount={totalCount}
              sort={filters.sort}
              onSortFieldChange={handleSortFieldChange}
              onSortDirToggle={handleSortDirToggle}
              channelNameByUuid={channelNameByUuid}
            />
          </Fragment>
        ) : (
          <Fragment key={`purchase-${filters.subTab}`}>
            <LedgerTable
              side="purchase"
              subTab={filters.subTab as PurchaseSubTab}
              rows={sortedRows as PurchaseRow[]}
              pageAmount={fmtCurrency(pageAmount)}
              totalAmount={fmtCurrency(totalAmount)}
              totalCount={totalCount}
              sort={filters.sort}
              onSortToggle={handleSortToggle}
            />
            <LedgerCards
              side="purchase"
              subTab={filters.subTab as PurchaseSubTab}
              rows={sortedRows as PurchaseRow[]}
              pageAmount={fmtCurrency(pageAmount)}
              totalAmount={fmtCurrency(totalAmount)}
              totalCount={totalCount}
              sort={filters.sort}
              onSortFieldChange={handleSortFieldChange}
              onSortDirToggle={handleSortDirToggle}
            />
          </Fragment>
        )}

        <Pagination
          page={filters.page}
          totalPages={totalPages}
          onPageChange={p => updateFilters({ page: p })}
          rightSlot={
            <>
              <Button variant="ghost" icon={Download} onClick={() => setExportDialogOpen(true)}>
                匯出總表
              </Button>
              <ExportRangeDialog
                open={exportDialogOpen}
                onClose={() => setExportDialogOpen(false)}
                onExport={() => setExportDialogOpen(false)}
              />
            </>
          }
        />
      </div>
    </div>
  );
}
