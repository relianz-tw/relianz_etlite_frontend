# 帳簿篩選狀態 URL 持久化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把帳簿頁（`/ledger`）的簡易搜尋、進階搜尋、銷項/進項、子分頁、排序、頁碼狀態改存進網址查詢字串，並讓「新增交易」「交易明細」「趨勢圖」等其他畫面的「返回帳簿」導頁真正帶回原本的查詢字串。

**Architecture:** 比照專案既有的 `SettingsView.tsx`（`?tab=`）模式：網址查詢字串是唯一事實來源，`LedgerView.tsx` 用 `useSearchParams()` 直接讀取，不再用 local state 鏡射「已套用」的篩選條件；只有送出前的輸入草稿維持 local state。離開帳簿列表的連結一律附上 `from=<目前查詢字串>`，目的頁再用它組出「返回帳簿」的網址。

**Tech Stack:** Next.js 14（App Router）、React 18、TypeScript `strict: true`、TailwindCSS（本次無新增/調整任何 UI 樣式）。

## Global Constraints

- 專案目前沒有任何測試框架（無 jest/vitest，`package.json` 的 `scripts` 只有 `dev`/`build`/`start`/`lint`）。本計畫的「測試」步驟一律用 `npx tsc --noEmit -p tsconfig.json`（快速型別檢查）＋手動在瀏覽器操作驗證，取代單元測試；最後一個任務會多跑一次完整 `npm run build`。**不要**為此功能額外引入測試框架——那超出本次範圍，且違反 `CLAUDE.md` 的「避免過度設計」原則。
- 全程使用 `@/*` 路徑別名匯入跨層模組；同層（`src/features/ledger/**`）內部一律用相對路徑（`./`、`../`），比照現有檔案的匯入風格，不要混用。
- 不新增任何 UI 元件、不調整任何樣式／DESIGN.md token；本次純粹是狀態管理與導頁邏輯的調整。
- 每個 handler 改動後的**既有行為語意必須維持不變**（例如切換銷項/進項不清進階金額/日期條件、切換子分頁不清搜尋條件、`periodType`/`periodFrom`/`periodTo` 那組裝飾性 local state 維持現狀不動）——這些細節已在下方各任務中標注。
- 程式碼註解沿用專案慣例：僅在「為什麼」不明顯時加中文註解，不加註解說明「做什麼」。

---

### Task 1: 新增 `src/features/ledger/urlState.ts`（URL 篩選狀態的 pure function）

**Files:**
- Create: `src/features/ledger/urlState.ts`
- Verify: 用 `npx tsc --noEmit`（無獨立測試檔）

**Interfaces:**
- Consumes: `src/features/ledger/types.ts` 既有的 `AdvancedFilter`、`PurchaseSubTab`、`QuickSearchField`、`SalesSubTab`、`Side`、`SortKey`、`SortState` 型別
- Produces（後續任務會用到，簽名需完全一致）：
  - `interface LedgerFilterState { side: Side; subTab: SalesSubTab | PurchaseSubTab; quickField: QuickSearchField; query: string; advanced: AdvancedFilter; sort: SortState; page: number; }`
  - `export const DEFAULT_SORT: SortState`
  - `export function defaultSubTabForSide(side: Side): SalesSubTab | PurchaseSubTab`
  - `export function parseLedgerFilters(searchParams: URLSearchParams): LedgerFilterState`
  - `export function buildLedgerQueryString(state: LedgerFilterState): string`
  - `export function appendReturnQuery(href: string, returnQuery?: string): string`
  - `export function withReturnParam(href: string, searchParams: URLSearchParams): string`
  - `export function resolveLedgerBackHref(returnQuery?: string): string`
  - `export function parseReturnQueryParam(value: string | string[] | undefined): string | undefined`

- [ ] **Step 1: 建立檔案，寫入完整內容**

```ts
import type { AdvancedFilter, PurchaseSubTab, QuickSearchField, SalesSubTab, Side, SortKey, SortState } from './types';

export interface LedgerFilterState {
  side: Side;
  subTab: SalesSubTab | PurchaseSubTab;
  quickField: QuickSearchField;
  query: string;
  advanced: AdvancedFilter;
  sort: SortState;
  page: number;
}

const DEFAULT_SIDE: Side = 'purchase';
const DEFAULT_SALES_SUB_TAB: SalesSubTab = 'receivable';
const DEFAULT_PURCHASE_SUB_TAB: PurchaseSubTab = 'payable';
const DEFAULT_QUICK_FIELD: QuickSearchField = 'id';
export const DEFAULT_SORT: SortState = { key: null, dir: 'none' };
const DEFAULT_PAGE = 1;

const SALES_SUB_TABS: SalesSubTab[] = ['receivable', 'received'];
const PURCHASE_SUB_TABS: PurchaseSubTab[] = ['payable', 'paid'];
const SORT_KEYS: SortKey[] = ['id', 'amount', 'counterparty', 'date'];

/** 依 side 取得該側的預設子分頁（銷項→應收帳款／進項→應付帳款） */
export function defaultSubTabForSide(side: Side): SalesSubTab | PurchaseSubTab {
  return side === 'sales' ? DEFAULT_SALES_SUB_TAB : DEFAULT_PURCHASE_SUB_TAB;
}

/**
 * 從網址查詢字串解析帳簿目前的篩選/排序/分頁狀態。任何欄位值不在合法範圍內
 * （例如手動改網址帶入無效值）一律回退預設值，不拋錯。
 */
export function parseLedgerFilters(searchParams: URLSearchParams): LedgerFilterState {
  const side: Side = searchParams.get('side') === 'sales' ? 'sales' : DEFAULT_SIDE;

  const subTabParam = searchParams.get('subTab');
  const validSubTabs: string[] = side === 'sales' ? SALES_SUB_TABS : PURCHASE_SUB_TABS;
  const subTab = (subTabParam && validSubTabs.includes(subTabParam) ? subTabParam : defaultSubTabForSide(side)) as
    | SalesSubTab
    | PurchaseSubTab;

  const quickField: QuickSearchField = searchParams.get('quickField') === 'invoice' ? 'invoice' : DEFAULT_QUICK_FIELD;
  const query = searchParams.get('query') ?? '';

  const advanced: AdvancedFilter = {
    dateFrom: searchParams.get('dateFrom') ?? '',
    dateTo: searchParams.get('dateTo') ?? '',
    minAmount: searchParams.get('minAmount') ?? '',
    maxAmount: searchParams.get('maxAmount') ?? '',
  };

  const sortKeyParam = searchParams.get('sortKey');
  const sortKey = sortKeyParam && (SORT_KEYS as string[]).includes(sortKeyParam) ? (sortKeyParam as SortKey) : null;
  const sort: SortState = sortKey ? { key: sortKey, dir: searchParams.get('sortDir') === 'desc' ? 'desc' : 'asc' } : DEFAULT_SORT;

  const pageParam = Number.parseInt(searchParams.get('page') ?? '', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : DEFAULT_PAGE;

  return { side, subTab, quickField, query, advanced, sort, page };
}

/** 將篩選狀態序列化為查詢字串；欄位值等於預設值時省略，維持網址乾淨 */
export function buildLedgerQueryString(state: LedgerFilterState): string {
  const params = new URLSearchParams();
  if (state.side !== DEFAULT_SIDE) params.set('side', state.side);
  if (state.subTab !== defaultSubTabForSide(state.side)) params.set('subTab', state.subTab);
  if (state.query.trim()) {
    params.set('query', state.query);
    if (state.quickField !== DEFAULT_QUICK_FIELD) params.set('quickField', state.quickField);
  }
  if (state.advanced.dateFrom) params.set('dateFrom', state.advanced.dateFrom);
  if (state.advanced.dateTo) params.set('dateTo', state.advanced.dateTo);
  if (state.advanced.minAmount) params.set('minAmount', state.advanced.minAmount);
  if (state.advanced.maxAmount) params.set('maxAmount', state.advanced.maxAmount);
  if (state.sort.key) {
    params.set('sortKey', state.sort.key);
    params.set('sortDir', state.sort.dir === 'desc' ? 'desc' : 'asc');
  }
  if (state.page !== DEFAULT_PAGE) params.set('page', String(state.page));
  return params.toString();
}

/** 已知 returnQuery 字串時（如交易表單頁內部切換銷項/進項）組出保留 from 的目標網址 */
export function appendReturnQuery(href: string, returnQuery?: string): string {
  if (!returnQuery) return href;
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}from=${encodeURIComponent(returnQuery)}`;
}

/** 幫「離開帳簿列表」的目的網址附上 from=<目前查詢字串>；查詢字串為空時原樣回傳 href */
export function withReturnParam(href: string, searchParams: URLSearchParams): string {
  return appendReturnQuery(href, searchParams.toString() || undefined);
}

/** 依 from 參數組出「返回帳簿」的目標網址，無 from 時回退 "/ledger" */
export function resolveLedgerBackHref(returnQuery?: string): string {
  return returnQuery ? `/ledger?${returnQuery}` : '/ledger';
}

/** Server Component 的 searchParams.from 可能是 string | string[]；統一正規化成單一字串 */
export function parseReturnQueryParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
```

- [ ] **Step 2: 型別檢查**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 無任何輸出（無錯誤）

- [ ] **Step 3: Commit**

```bash
git add src/features/ledger/urlState.ts
git commit -m "feat(ledger): add pure functions for URL-driven filter state"
```

---

### Task 2: `src/app/ledger/page.tsx` 加上 Suspense 邊界

**Files:**
- Modify: `src/app/ledger/page.tsx`

**Interfaces:**
- Consumes: 無新介面（下個任務起 `LedgerView` 才會用到 `useSearchParams`，這裡先把邊界準備好，比照 `src/app/settings/page.tsx` 現有寫法）
- Produces: 無

- [ ] **Step 1: 修改檔案為以下完整內容**

```tsx
import LedgerView from '@/features/ledger/LedgerView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '帳簿 | Easytax Lite',
};

// LedgerView 內部使用 useSearchParams 讀取篩選/排序/分頁狀態，App Router 要求外層需有 Suspense 邊界，
// 否則靜態渲染會報錯；fallback 維持背景色與最小高度，避免載入時畫面閃爍
export default function LedgerPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] bg-surface-off-white" />}>
      <LedgerView />
    </Suspense>
  );
}
```

- [ ] **Step 2: 型別檢查**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 無任何輸出

- [ ] **Step 3: Commit**

```bash
git add src/app/ledger/page.tsx
git commit -m "feat(ledger): wrap ledger page in Suspense for useSearchParams"
```

---

### Task 3: `LedgerView.tsx` 改為網址驅動篩選狀態

**Files:**
- Modify: `src/features/ledger/LedgerView.tsx`（全檔重寫）

**Interfaces:**
- Consumes: Task 1 的 `parseLedgerFilters`、`buildLedgerQueryString`、`defaultSubTabForSide`、`DEFAULT_SORT`、`LedgerFilterState`（來自 `./urlState`）
- Produces: 無新對外介面；`FilterBar`／`LedgerTable`／`LedgerCards`／`SummaryCards` 的 props 呼叫方式不變（仍是 `side`/`subTab`/`quickField`/`query`/`advanced`/`sort`/`onXxx` 這組），差別只在這些值現在衍生自網址

- [ ] **Step 1: 用以下完整內容取代整個檔案**

```tsx
'use client';

import { fetchPayables, fetchPayablesPaid, fetchReceivables, fetchReceivablesCollected } from '@/api/ledger';
import type { PayablesFilterBody } from '@/api/types';
import Button from '@/components/ui/Button';
import { parseRocDate } from '@/components/ui/DatePicker';
import ExportRangeDialog from '@/components/ui/ExportRangeDialog';
import Pagination from '@/components/ui/Pagination';
import SegmentedControl from '@/components/ui/SegmentedControl';
import SummaryReconDialog from '@/features/reconciliation/components/SummaryReconDialog';
import { fmtCurrency, sortRows } from '@/lib/utils';
import { Download, HandCoins } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useMemo, useState } from 'react';
import FilterBar from './components/FilterBar';
import LedgerCards from './components/LedgerCards';
import LedgerTable from './components/LedgerTable';
import SummaryCards from './components/SummaryCards';
import { mapPayableItemsToRows, mapReceivableItemsToRows } from './data';
import { formatYmd } from './transaction/data';
import type { AdvancedFilter, PurchaseSubTab, PurchaseRow, QuickSearchField, SalesRow, SalesSubTab, Side, SortKey, SortState } from './types';
import { buildLedgerQueryString, defaultSubTabForSide, DEFAULT_SORT, parseLedgerFilters } from './urlState';
import type { LedgerFilterState } from './urlState';

/** 對齊表格底部「每頁顯示」欄位目前固定顯示的 10 筆，同時作為後端 filter API 的 limit */
const PAGE_LIMIT = 10;

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
 * body 結構一致，PayablesFilterBody 與 ReceivablesFilterBody 為結構相同型別，故共用同一個組裝函式。
 */
function buildFilterBody(page: number, quickField: QuickSearchField, query: string, advanced: AdvancedFilter): Omit<PayablesFilterBody, 'companyUuid'> {
  const value = query.trim();
  return {
    page,
    limit: PAGE_LIMIT,
    amountFrom: advanced.minAmount ? Number(advanced.minAmount) : undefined,
    amountTo: advanced.maxAmount ? Number(advanced.maxAmount) : undefined,
    dateFrom: formatYmd(parseRocDate(advanced.dateFrom)),
    dateTo: formatYmd(parseRocDate(advanced.dateTo)),
    // 交易編號/發票號碼須成對傳遞，空值則兩者皆不帶（後端視為不篩）
    ...(value ? { filterType: quickField === 'id' ? 0 : 1, filterValue: value } : {}),
  };
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
  const [reconDialogOpen, setReconDialogOpen] = useState(false);

  // 簡易搜尋／進階搜尋輸入框內容：使用者「送出前」的草稿，掛載時取網址目前值作初始值，
  // 送出（搜尋／套用）後才寫回網址；網址本身不再需要對應的「已套用」local state
  const [quickField, setQuickField] = useState<QuickSearchField>(() => filters.quickField);
  const [query, setQuery] = useState(() => filters.query);
  const [advanced, setAdvanced] = useState<AdvancedFilter>(() => filters.advanced);

  // 應付/已付/應收/已收四個子分頁共用同一組載入狀態；四支 filter API 依 side + 子分頁擇一呼叫
  const [rows, setRows] = useState<(SalesRow | PurchaseRow)[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 手動入帳成功後遞增此值以觸發重新查詢（沖帳不改變頁碼/篩選條件，需獨立的刷新旗標）
  const [reloadKey, setReloadKey] = useState(0);

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
    const body = buildFilterBody(filters.page, filters.quickField, filters.query, filters.advanced);

    const request =
      filters.side === 'purchase'
        ? (filters.subTab === 'payable' ? fetchPayables(body) : fetchPayablesPaid(body)).then(async result => ({
            rows: await mapPayableItemsToRows(result.items),
            total: result.total,
          }))
        : (filters.subTab === 'receivable' ? fetchReceivables(body) : fetchReceivablesCollected(body)).then(result => ({
            rows: mapReceivableItemsToRows(result.items),
            total: result.total,
          }));

    request
      .then(result => {
        if (cancelled) return;
        setRows(result.rows);
        setTotal(result.total);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '操作失敗');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, reloadKey]);

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
    updateFilters({ side: v, subTab: defaultSubTabForSide(v), quickField: 'id', query: '', sort: DEFAULT_SORT, page: 1 });
  };
  const handleSalesSubTabChange = (v: SalesSubTab) => {
    setRows([]);
    updateFilters({ subTab: v, page: 1 });
  };
  const handlePurchaseSubTabChange = (v: PurchaseSubTab) => {
    setRows([]);
    updateFilters({ subTab: v, page: 1 });
  };

  // 排序僅對目前這頁的資料進行（API 未提供排序），桌機表格與手機卡片共用同一份已排序資料
  const sortKeyFn = filters.sort.key ? SORT_KEY_FN[filters.sort.key] : null;
  const sortedRows = sortKeyFn ? sortRows(rows, sortKeyFn, filters.sort.dir) : rows;
  const totalAmount = fmtCurrency(sortedRows.reduce((sum, r) => sum + r.amount, 0));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const handleReceivableSettled = () => setReloadKey(k => k + 1);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 py-7 nav:px-7">
        <div className="mb-6">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">帳簿</h1>
          <p className="mt-1 text-sm text-neutral-mid">有開立發票或收據的交易</p>
        </div>

        <div className="mb-5">
          <SummaryCards side={filters.side} />
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

        <div className="mb-3 flex flex-col gap-2 nav:flex-row nav:items-center nav:gap-3">
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
          <div className="w-full nav:w-56">
            <SegmentedControl
              options={filters.side === 'sales' ? SALES_SUB_TABS : PURCHASE_SUB_TABS}
              value={filters.subTab}
              onChange={v => (filters.side === 'sales' ? handleSalesSubTabChange(v as SalesSubTab) : handlePurchaseSubTabChange(v as PurchaseSubTab))}
              size="md"
            />
          </div>
          {((filters.side === 'sales' && filters.subTab === 'receivable') || (filters.side === 'purchase' && filters.subTab === 'payable')) && (
            <Button variant="warm" icon={HandCoins} onClick={() => setReconDialogOpen(true)} className="nav:ml-auto">
              匯總沖帳
            </Button>
          )}
        </div>
        <SummaryReconDialog
          open={reconDialogOpen}
          onClose={() => setReconDialogOpen(false)}
          side={filters.side === 'sales' ? 'receivable' : 'payable'}
        />

        {loading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : error ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{error}</div>
        ) : filters.side === 'sales' ? (
          <Fragment key={`sales-${filters.subTab}`}>
            <LedgerTable
              side="sales"
              subTab={filters.subTab as SalesSubTab}
              rows={sortedRows as SalesRow[]}
              totalCount={sortedRows.length}
              totalAmount={totalAmount}
              sort={filters.sort}
              onSortToggle={handleSortToggle}
              onReceivableSettled={handleReceivableSettled}
            />
            <LedgerCards
              side="sales"
              subTab={filters.subTab as SalesSubTab}
              rows={sortedRows as SalesRow[]}
              totalCount={sortedRows.length}
              totalAmount={totalAmount}
              sort={filters.sort}
              onSortFieldChange={handleSortFieldChange}
              onSortDirToggle={handleSortDirToggle}
              onReceivableSettled={handleReceivableSettled}
            />
          </Fragment>
        ) : (
          <Fragment key={`purchase-${filters.subTab}`}>
            <LedgerTable
              side="purchase"
              subTab={filters.subTab as PurchaseSubTab}
              rows={sortedRows as PurchaseRow[]}
              totalCount={sortedRows.length}
              totalAmount={totalAmount}
              sort={filters.sort}
              onSortToggle={handleSortToggle}
            />
            <LedgerCards
              side="purchase"
              subTab={filters.subTab as PurchaseSubTab}
              rows={sortedRows as PurchaseRow[]}
              totalCount={sortedRows.length}
              totalAmount={totalAmount}
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
```

- [ ] **Step 2: 型別檢查**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 無任何輸出

- [ ] **Step 3: 手動驗證**

Run: `npm run dev`，瀏覽器開 `http://localhost:3000/ledger`，依序操作並觀察網址列：

1. 輸入交易編號按「搜尋」→ 網址出現 `?query=...`（quickField 為預設 `id` 時不會出現 `quickField` 參數）。
2. 展開「進階搜尋」，輸入金額區間後按「套用」→ 網址追加 `minAmount`/`maxAmount`。
3. 切換「銷項」/「進項」→ 網址的 `side` 改變，`query` 等簡易搜尋參數消失（重置），但剛剛輸入的金額區間**仍保留**在網址上。
4. 切換子分頁（應收帳款/已收款）→ 網址出現/更新 `subTab`，簡易搜尋與進階條件不受影響。
5. 點表頭排序一次 → 網址出現 `sortKey`/`sortDir`。
6. 換頁 → 網址出現 `page`。
7. 整頁重新整理（F5）→ 畫面上的搜尋輸入框、進階條件、排序狀態、頁碼與重新整理前完全一致。
8. 手動把網址改成 `?side=sales&subTab=payable`（一個對 sales 無效的 subTab）→ 頁面不噴錯，`subTab` 自動回退成 `receivable`。

- [ ] **Step 4: Commit**

```bash
git add src/features/ledger/LedgerView.tsx
git commit -m "feat(ledger): drive filter/sort/page state from URL search params"
```

---

### Task 4: 離開帳簿列表的連結附上 `from` 查詢參數

**Files:**
- Modify: `src/features/ledger/components/FilterBar.tsx`
- Modify: `src/features/ledger/components/LedgerTable.tsx`
- Modify: `src/features/ledger/components/LedgerCards.tsx`
- Modify: `src/features/ledger/components/SummaryCards.tsx`

**Interfaces:**
- Consumes: Task 1 的 `withReturnParam(href: string, searchParams: URLSearchParams): string`（來自 `../urlState`）
- Produces: 無新對外介面；這四個元件原本的 props 簽名皆不變

- [ ] **Step 1: 修改 `FilterBar.tsx`**

第 9 行的 import 改成：

```ts
import { useRouter, useSearchParams } from 'next/navigation';
```

第 12 行 `import ImportInvoiceDialog from './ImportInvoiceDialog';` 之後新增一行：

```ts
import { withReturnParam } from '../urlState';
```

第 67-68 行：

```ts
  const router = useRouter();
  const goToNewTransaction = () => router.push(`/ledger/new?side=${side}`);
```

改成：

```ts
  const router = useRouter();
  const searchParams = useSearchParams();
  const goToNewTransaction = () => router.push(withReturnParam(`/ledger/new?side=${side}`, searchParams));
```

- [ ] **Step 2: 修改 `LedgerTable.tsx`**

第 12 行 `import Link from 'next/link';` 之後新增：

```ts
import { useSearchParams } from 'next/navigation';
```

第 20 行 `import VoidConfirmDialog from './VoidConfirmDialog';` 之後新增：

```ts
import { withReturnParam } from '../urlState';
```

第 203-204 行：

```ts
export default function LedgerTable(props: LedgerTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
```

改成：

```ts
export default function LedgerTable(props: LedgerTableProps) {
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
```

第 350 行：

```tsx
href={`/ledger/${row.id}?side=sales`}
```

改成：

```tsx
href={withReturnParam(`/ledger/${row.id}?side=sales`, searchParams)}
```

第 498 行：

```tsx
href={`/ledger/${row.id}?side=purchase`}
```

改成：

```tsx
href={withReturnParam(`/ledger/${row.id}?side=purchase`, searchParams)}
```

- [ ] **Step 3: 修改 `LedgerCards.tsx`**

第 13 行：

```ts
import { useRouter } from 'next/navigation';
```

改成：

```ts
import { useRouter, useSearchParams } from 'next/navigation';
```

第 18 行 `import { useLongPress } from '../useLongPress';` 之後新增：

```ts
import { withReturnParam } from '../urlState';
```

第 304-305 行：

```ts
  const router = useRouter();
  const goToTransaction = (id: string) => router.push(`/ledger/${id}?side=${props.side}`);
```

改成：

```ts
  const router = useRouter();
  const searchParams = useSearchParams();
  const goToTransaction = (id: string) => router.push(withReturnParam(`/ledger/${id}?side=${props.side}`, searchParams));
```

- [ ] **Step 4: 修改 `SummaryCards.tsx`（全檔重寫）**

```tsx
'use client';

import StatCard from '@/components/ui/StatCard';
import TrendChart from '@/components/ui/TrendChart';
import { fmtCurrency } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { PURCHASE_DAILY, SALES_DAILY } from '../data';
import type { Side } from '../types';
import { withReturnParam } from '../urlState';

const SALES_TOTALS = { issued: 999462582, settled: 850000000, outstanding: 149462582 };
const PURCHASE_TOTALS = { received: 999462582, paid: 850000000, payable: 149462582 };

// 桌面版卡片有足夠寬度，趨勢圖預設顯示「日」；手機版卡片較窄，預設顯示「週」避免 62 根柱子擠爆
function buildCards(side: Side, chartDefaultView: 'day' | 'week', searchParams: URLSearchParams) {
  const dailyData = side === 'sales' ? SALES_DAILY : PURCHASE_DAILY;
  const chart = <TrendChart data={dailyData} defaultView={chartDefaultView} />;

  return side === 'sales'
    ? [
        {
          label: '已開立發票金額',
          value: fmtCurrency(SALES_TOTALS.issued),
          chart,
          detailHref: withReturnParam('/ledger/trend?side=sales', searchParams),
        },
        { label: '已入帳金額', value: fmtCurrency(SALES_TOTALS.settled), valueClassName: 'text-semantic-success', caption: '平均收款週期 7 天' },
        { label: '應收帳款', value: fmtCurrency(SALES_TOTALS.outstanding), valueClassName: 'text-semantic-error', caption: '平均收款週期 7 天' },
      ]
    : [
        {
          label: '已收取憑證金額',
          value: fmtCurrency(PURCHASE_TOTALS.received),
          chart,
          detailHref: withReturnParam('/ledger/trend?side=purchase', searchParams),
        },
        { label: '已付款金額', value: fmtCurrency(PURCHASE_TOTALS.paid), valueClassName: 'text-semantic-success', caption: '平均付款週期 7 天' },
        { label: '應付金額', value: fmtCurrency(PURCHASE_TOTALS.payable), valueClassName: 'text-semantic-error', caption: '平均付款週期 7 天' },
      ];
}

export default function SummaryCards({ side }: { side: Side }) {
  const searchParams = useSearchParams();
  const desktopCards = buildCards(side, 'day', searchParams);
  const mobileCards = buildCards(side, 'week', searchParams);

  return (
    <>
      <div className="hidden gap-3 nav:flex">
        {desktopCards.map(c => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>
      <div className="nav:hidden">
        <StatCard {...mobileCards[0]} />
      </div>
    </>
  );
}
```

- [ ] **Step 5: 型別檢查**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 無任何輸出

- [ ] **Step 6: 手動驗證**

Run: `npm run dev`，在 `http://localhost:3000/ledger` 先套用任一搜尋條件（例如輸入交易編號按搜尋），確認網址已帶上 `?query=...`，接著：

1. 點「新增交易」按鈕 → 瀏覽器網址列應為 `/ledger/new?side=purchase&from=query%3D...`（`from` 的值是剛剛那個查詢字串的 URL 編碼）。
2. 回上一頁，點任一列的交易編號連結 → 網址應為 `/ledger/123?side=...&from=...`。
3. 手機版（縮小視窗寬度或切 DevTools 手機模式）點任一卡片 → 同樣應帶 `from`。
4. 桌機版摘要卡片點趨勢圖「查看更多」（若有此連結文字，依 `StatCard` 實際顯示為準）→ `/ledger/trend?side=...&from=...`。

此步驟只需確認網址正確帶上 `from`；點進去之後「返回帳簿」尚未串接，留到 Task 5 驗證。

- [ ] **Step 7: Commit**

```bash
git add src/features/ledger/components/FilterBar.tsx src/features/ledger/components/LedgerTable.tsx src/features/ledger/components/LedgerCards.tsx src/features/ledger/components/SummaryCards.tsx
git commit -m "feat(ledger): append return query param to links leaving the ledger list"
```

---

### Task 5: 目的頁接收 `from` 並讓「返回帳簿」帶回篩選狀態

**Files:**
- Modify: `src/app/ledger/new/page.tsx`
- Modify: `src/app/ledger/[id]/page.tsx`
- Modify: `src/app/ledger/trend/page.tsx`
- Modify: `src/features/ledger/transaction/TransactionFormView.tsx`
- Modify: `src/features/ledger/components/TrendDetailPageView.tsx`

**Interfaces:**
- Consumes: Task 1 的 `parseReturnQueryParam`、`appendReturnQuery`、`resolveLedgerBackHref`（來自 `@/features/ledger/urlState` 或 `../urlState`）
- Produces: `TransactionFormView` 新增 prop `returnQuery?: string`；`TrendDetailPageView` 新增 prop `returnQuery?: string`

- [ ] **Step 1: 修改 `src/app/ledger/new/page.tsx`（全檔重寫）**

```tsx
import { parseSideParam } from '@/features/ledger/transaction/data';
import TransactionFormView from '@/features/ledger/transaction/TransactionFormView';
import { parseReturnQueryParam } from '@/features/ledger/urlState';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '新增交易 | Easytax Lite',
};

export default function NewTransactionPage({ searchParams }: { searchParams: { side?: string | string[]; from?: string | string[] } }) {
  const side = parseSideParam(searchParams.side);
  const returnQuery = parseReturnQueryParam(searchParams.from);
  return <TransactionFormView mode="create" side={side} returnQuery={returnQuery} />;
}
```

- [ ] **Step 2: 修改 `src/app/ledger/[id]/page.tsx`（全檔重寫）**

```tsx
import { parseSideParam } from '@/features/ledger/transaction/data';
import TransactionFormView from '@/features/ledger/transaction/TransactionFormView';
import { parseReturnQueryParam } from '@/features/ledger/urlState';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '交易細節 | Easytax Lite',
};

export default function TransactionDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { side?: string | string[]; from?: string | string[] };
}) {
  const side = parseSideParam(searchParams.side);
  const returnQuery = parseReturnQueryParam(searchParams.from);
  return <TransactionFormView mode="edit" side={side} transactionId={params.id} returnQuery={returnQuery} />;
}
```

- [ ] **Step 3: 修改 `src/app/ledger/trend/page.tsx`（全檔重寫）**

```tsx
import TrendDetailPageView from '@/features/ledger/components/TrendDetailPageView';
import { parseReturnQueryParam } from '@/features/ledger/urlState';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '發票金額趨勢 | Easytax Lite',
};

export default function LedgerTrendPage({ searchParams }: { searchParams: { side?: string | string[]; from?: string | string[] } }) {
  const side = searchParams.side === 'purchase' ? 'purchase' : 'sales';
  const returnQuery = parseReturnQueryParam(searchParams.from);
  return <TrendDetailPageView side={side} returnQuery={returnQuery} />;
}
```

- [ ] **Step 4: 修改 `TransactionFormView.tsx`**

第 17 行 `import VoidConfirmDialog from '../components/VoidConfirmDialog';` 之後新增：

```ts
import { appendReturnQuery, resolveLedgerBackHref } from '../urlState';
```

第 21-25 行的 props interface：

```ts
interface TransactionFormViewProps {
  mode: TransactionMode;
  side: Side;
  transactionId?: string;
}
```

改成：

```ts
interface TransactionFormViewProps {
  mode: TransactionMode;
  side: Side;
  transactionId?: string;
  returnQuery?: string;
}
```

第 114-128 行：

```ts
export default function TransactionFormView({ mode, side, transactionId }: TransactionFormViewProps) {
  const router = useRouter();
  const [form, setForm] = useState<TransactionFormState>(() => initialForm(mode, side, transactionId));
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (patch: Partial<TransactionFormState>) => setForm(f => ({ ...f, ...patch }));
  const handleFileChange = (fileName: string, previewUrl: string) =>
    handleChange({ voucherFileName: fileName, voucherPreviewUrl: previewUrl });

  const handleSideChange = (next: Side) => router.push(`/ledger/new?side=${next}`);

  // 編輯畫面（更新/作廢/刪除）本次未串接後端，維持既有視覺模擬
  const backToLedger = () => router.push('/ledger');
```

改成：

```ts
export default function TransactionFormView({ mode, side, transactionId, returnQuery }: TransactionFormViewProps) {
  const router = useRouter();
  const [form, setForm] = useState<TransactionFormState>(() => initialForm(mode, side, transactionId));
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const backHref = resolveLedgerBackHref(returnQuery);

  const handleChange = (patch: Partial<TransactionFormState>) => setForm(f => ({ ...f, ...patch }));
  const handleFileChange = (fileName: string, previewUrl: string) =>
    handleChange({ voucherFileName: fileName, voucherPreviewUrl: previewUrl });

  const handleSideChange = (next: Side) => router.push(appendReturnQuery(`/ledger/new?side=${next}`, returnQuery));

  // 編輯畫面（更新/作廢/刪除）本次未串接後端，維持既有視覺模擬
  const backToLedger = () => router.push(backHref);
```

第 145 行（`handleCreate` 成功後）：

```ts
      router.push('/ledger');
```

改成：

```ts
      router.push(backHref);
```

第 160 行：

```tsx
            <Link href="/ledger" className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
```

改成：

```tsx
            <Link href={backHref} className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
```

- [ ] **Step 5: 修改 `TrendDetailPageView.tsx`（全檔重寫）**

```tsx
'use client';

import TrendDetailView from '@/components/ui/TrendDetailView';
import { fmtCurrency } from '@/lib/utils';
import { PURCHASE_DAILY, SALES_DAILY } from '../data';
import type { Side } from '../types';
import { resolveLedgerBackHref } from '../urlState';

const SIDE_CONFIG: Record<Side, { title: string; label: string }> = {
  sales: { title: '已開立發票金額趨勢', label: '已開立發票金額' },
  purchase: { title: '已收取憑證金額趨勢', label: '已收取憑證金額' },
};

export default function TrendDetailPageView({ side, returnQuery }: { side: Side; returnQuery?: string }) {
  const { title, label } = SIDE_CONFIG[side];
  const data = side === 'sales' ? SALES_DAILY : PURCHASE_DAILY;
  const rows = data.map(point => ({ date: point.date, amount: fmtCurrency(point.value) }));

  return (
    <TrendDetailView
      title={title}
      subtitle="帳簿"
      backHref={resolveLedgerBackHref(returnQuery)}
      series={[{ key: 'amount', label, color: 'blue', data }]}
      table={{
        columns: [
          { key: 'date', label: '日期' },
          { key: 'amount', label, align: 'right' },
        ],
        rows,
      }}
    />
  );
}
```

- [ ] **Step 6: 型別檢查**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 無任何輸出

- [ ] **Step 7: 手動驗證（端對端）**

Run: `npm run dev`，在 `http://localhost:3000/ledger`：

1. 切到「進項」，套用一個簡易搜尋＋一個進階金額區間，確認網址已帶上對應參數。
2. 點「新增交易」→ 在新增交易頁點左上角「返回帳簿」連結 → 應回到 `/ledger` 且網址帶回剛剛的 `side`/`query`/`minAmount`/`maxAmount`，畫面上的搜尋框與進階條件也應該是剛剛輸入的內容（不是空的）。
3. 回帳簿頁後點任一列進入交易明細（`mode=edit`），點「更新」按鈕（會呼叫 `backToLedger`）→ 同樣應帶回原本篩選狀態。
4. 在新增交易頁（`mode=create`）點畫面上「銷項/進項」切換鈕 → 網址應變成 `/ledger/new?side=sales&from=...`，`from` 值不變（沿用一開始帶進來的 `returnQuery`）。
5. 回帳簿頁點桌面版摘要卡片的趨勢圖連結 → 進入 `/ledger/trend`，點「返回」→ 應帶回原本篩選狀態。
6. 都沒有 `from`（直接在網址列輸入 `http://localhost:3000/ledger/new?side=purchase` 前往）時，「返回帳簿」應正常回到不帶任何參數的 `/ledger`（不會出現 `?undefined` 之類的錯誤）。

- [ ] **Step 8: Commit**

```bash
git add src/app/ledger/new/page.tsx "src/app/ledger/[id]/page.tsx" src/app/ledger/trend/page.tsx src/features/ledger/transaction/TransactionFormView.tsx src/features/ledger/components/TrendDetailPageView.tsx
git commit -m "feat(ledger): restore filter state when returning from transaction/trend pages"
```

---

### Task 6: 完整建置驗證

**Files:**
- 無新增/修改檔案，僅驗證

**Interfaces:**
- Consumes: 前五個任務的全部產出
- Produces: 無

- [ ] **Step 1: 完整建置**

Run: `npm run build`
Expected: 建置成功（`✓ Compiled successfully`），無 TypeScript 或 ESLint 錯誤

- [ ] **Step 2: 依 spec 邊界情況逐一手動複查**

Run: `npm run dev`，對照 `docs/superpowers/specs/2026-07-31-ledger-filter-url-persistence-design.md` 的「邊界情況」章節，確認：

1. 網址帶入不合法的 `side`（如 `?side=foo`）→ 回退成 `purchase`，不噴錯。
2. 網址帶入不合法的 `sortKey`（如 `?sortKey=foo`）→ 排序回退成無排序（`ChevronsUpDown` 圖示，非 active 狀態）。
3. 網址帶入 `?page=abc` 或 `?page=-1` → 頁碼回退成 `1`。
4. `FilterBar.tsx` 裡「交易期間 月/年」那組控制項（僅銷項顯示）維持原樣可操作，未被本次改動影響（本來就不影響篩選結果）。
5. 瀏覽器「上一頁」按鈕：在 `/ledger` 依序切換兩次不同搜尋條件後，點瀏覽器上一頁，應直接跳回上一個完整網址（例如導覽到 `/ledger/new` 之前的那個 `/ledger?...` 狀態），而不是回到兩次搜尋切換之間的中繼狀態（因為篩選變更用 `router.replace` 不建立歷史紀錄，只有真正切換路由才會有歷史記錄——這是預期行為，比照 `SettingsView.tsx` 既有的 `?tab=` 做法）。

- [ ] **Step 3: 確認無殘留未使用的匯出/常數**

Run: `grep -rn "EMPTY_ADVANCED_FILTER" src/features/ledger/LedgerView.tsx`
Expected: 無輸出（確認舊的 `EMPTY_ADVANCED_FILTER` 常數已隨 Task 3 移除，未殘留死碼）

- [ ] **Step 4: 若前述步驟皆通過，無需額外 commit（Task 1-5 已個別 commit）**
