# 帳簿篩選狀態 URL 持久化設計 Spec

日期：2026-07-31

## 背景與目標

帳簿頁（`LedgerView.tsx`）的簡易搜尋（交易編號/發票號碼）、進階搜尋（金額/日期區間）、
銷項/進項切換、應收/已收（或應付/已付）子分頁、排序、頁碼，目前全部是 `useState` local state。
使用者從帳簿列表點進「新增交易」、交易明細、趨勢圖等其他畫面後再返回，這些狀態會全部被重置為
預設值。

目標：把上述篩選/排序/分頁狀態改存在網址 `?` 查詢字串中，並讓「返回帳簿」的導頁路徑真正帶回
原本的查詢字串，使使用者離開再回來時畫面維持同一個選擇。

架構比照專案既有的 `src/features/settings/SettingsView.tsx`（`?tab=` 分頁狀態）：**URL 查詢字串
是唯一事實來源**，不用 local state 鏡射「已套用」的篩選條件，只有「尚未送出」的輸入草稿維持
local state。

## 一、URL 參數 schema

| URL 參數 | 對應狀態 | 有效值 | 預設值（等於預設時從網址省略） |
|---|---|---|---|
| `side` | 銷項/進項 | `sales` \| `purchase` | `purchase` |
| `subTab` | 子分頁 | `receivable` \| `received`（側=sales）或 `payable` \| `paid`（側=purchase） | `receivable`（sales）/ `payable`（purchase） |
| `quickField` | 簡易搜尋欄位 | `id` \| `invoice` | `id`（且僅 `query` 有值時才寫入網址） |
| `query` | 簡易搜尋文字 | 任意字串 | 空字串（省略） |
| `dateFrom` / `dateTo` | 進階搜尋日期區間 | 民國年格式字串，如 `115/01/01` | 空值（省略） |
| `minAmount` / `maxAmount` | 進階搜尋金額區間 | 數字字串 | 空值（省略） |
| `sortKey` | 排序欄位 | `id` \| `amount` \| `counterparty` \| `date` | 無（省略，連同 `sortDir` 一起省略） |
| `sortDir` | 排序方向 | `asc` \| `desc` | 無（`sortKey` 省略時一併省略） |
| `page` | 頁碼 | 正整數字串 | `1` |

驗證規則：任何參數值不在合法白名單內（或 `page` 無法解析成正整數）一律回退預設值，比照
`SettingsView.tsx` 的 `isSettingsTab` 容錯模式，不拋錯、不中斷渲染。

`side` 與 `subTab` 的組合容錯：若 `subTab` 的值不屬於目前 `side` 對應的合法集合（例如網址是
`side=sales&subTab=payable`），視為未提供，回退該 `side` 的預設子分頁。

## 二、新增檔案 `src/features/ledger/urlState.ts`

放置與 React 無關的 pure function，供 `LedgerView.tsx` 與其他需要組出「返回帳簿」連結的元件共用：

```ts
export interface LedgerFilterState {
  side: Side;
  subTab: SalesSubTab | PurchaseSubTab;
  quickField: QuickSearchField;
  query: string;
  advanced: AdvancedFilter;
  sort: SortState;
  page: number;
}

/** 從網址查詢字串解析目前篩選狀態，無效值一律回退預設值 */
export function parseLedgerFilters(searchParams: URLSearchParams): LedgerFilterState;

/** 將篩選狀態序列化為查詢字串，等於預設值的欄位省略不寫入 */
export function buildLedgerQueryString(state: LedgerFilterState): string;

/** 幫「離開帳簿列表」的目的網址附上 from=<目前查詢字串>，查詢字串為空時原樣返回 href 不附加 */
export function withReturnParam(href: string, searchParams: URLSearchParams): string;

/** 依 from 參數組出「返回帳簿」的目標網址，無 from 時回退 "/ledger" */
export function resolveLedgerBackHref(returnQuery?: string): string;
```

## 三、`LedgerView.tsx` 改動

- 移除 `side`／`salesSubTab`／`purchaseSubTab`／`appliedQuickField`／`appliedQuery`／
  `appliedAdvanced`／`sort`／`page` 這幾個 `useState`，改用
  `const filters = parseLedgerFilters(useSearchParams())` 於每次 render 直接取得。
- 新增一個 `updateFilters(partial: Partial<LedgerFilterState>)`：以目前 `filters` 為基礎合併
  `partial`，用 `buildLedgerQueryString` 序列化後 `router.replace(\`${pathname}?${qs}\`)`。
- 保留 `quickField`／`query`／`advanced` 三個「送出前草稿」的 `useState`，改用
  `useState(() => filters.xxx)` 做掛載時的惰性初始化（只在首次渲染跑一次，之後由使用者輸入
  或送出動作驅動，不會被網址變化覆蓋，避免與 URL 形成同步迴圈）。
- 各 handler 的**既有語意原封不動**，只是改成呼叫 `updateFilters`：
  - `handleSearch`：`updateFilters({ quickField, query, page: 1 })`
  - `handleClearQuick`：清空草稿 `query`，`updateFilters({ query: '', page: 1 })`
  - `handleAdvancedApply`：`updateFilters({ advanced: next ?? advanced, page: 1 })`
  - `handleSideChange`：重置草稿 quickField/query，`updateFilters({ side: v, subTab: 該 side 預設值, quickField: 'id', query: '', sort: DEFAULT_SORT, page: 1 })`——**不動 `advanced`**，維持現有「切換銷項/進項不清進階條件」的行為
  - `handleSalesSubTabChange`/`handlePurchaseSubTabChange`：`updateFilters({ subTab: v, page: 1 })`——不動搜尋/進階條件
  - `handleSortToggle`/`handleSortFieldChange`/`handleSortDirToggle`：`updateFilters({ sort: 新排序 })`
  - `Pagination` 的 `onPageChange`：`updateFilters({ page: p })`
- `useEffect` 抓資料的依賴陣列改為依賴 `filters` 中會影響 API 的欄位（`side`/`subTab`/
  `quickField`/`query`/`advanced`/`page`），`sort` 維持不觸發重新抓取（現況即是純前端排序）。

## 四、`src/app/ledger/page.tsx` 加 Suspense

`LedgerView` 用到 `useSearchParams()` 後，比照 `settings/page.tsx`，`LedgerPage` 需用
`<Suspense fallback={...}>` 包住 `<LedgerView />`，否則靜態渲染會報錯。

## 五、返回導航串接（讓「返回帳簿」帶回篩選狀態）

現況這幾個地方離開帳簿列表後，「返回」都寫死 `/ledger`（不帶查詢字串）：

- `TransactionFormView.tsx`：`backToLedger()`、儲存成功後的 `router.push('/ledger')`（2 處）、
  「取消」的 `<Link href="/ledger">`
- `TrendDetailPageView.tsx`：`backHref="/ledger"`（傳給 `TrendDetailView`）

改法：

1. 這些畫面的**入口點**（皆為 `'use client'` 元件）各自呼叫 `useSearchParams()`，用
   `withReturnParam()` 幫外連結/`router.push` 目標網址加上
   `&from=<encodeURIComponent(目前查詢字串)>`（空字串時不附加）：
   - `FilterBar.tsx` 的 `goToNewTransaction`（`/ledger/new?side=...`）
   - `LedgerTable.tsx` 的兩處交易明細 `<Link href="/ledger/${row.id}?side=...">`
   - `LedgerCards.tsx` 的 `goToTransaction`（`router.push`）
   - `SummaryCards.tsx` 的 `detailHref`（`/ledger/trend?side=...`）
2. 對應的 Server Component 頁面（`ledger/new/page.tsx`、`ledger/[id]/page.tsx`、
   `ledger/trend/page.tsx`）原本就以 `searchParams` prop 讀取 `side`，比照新增讀取
   `searchParams.from`，原樣以新 prop `returnQuery?: string` 往下傳給
   `TransactionFormView` / `TrendDetailPageView`（這些頁面本身不用 `useSearchParams()`，
   不需額外包 Suspense）。
3. `TransactionFormView.tsx` 與 `TrendDetailPageView.tsx` 新增 `returnQuery?: string` prop，
   用 `resolveLedgerBackHref(returnQuery)` 取代所有寫死的 `'/ledger'`。

`FilterBar.tsx`/`LedgerTable.tsx`/`LedgerCards.tsx`/`SummaryCards.tsx` 呼叫
`useSearchParams()` 時人在 `LedgerView` 子樹內，已受 `ledger/page.tsx` 的 Suspense 邊界涵蓋，
不需額外包 Suspense。

## 六、不在本次範圍

- `FilterBar.tsx` 中「交易期間 月/年」那組 `periodType`/`periodFrom`/`periodTo`：目前本來就沒有
  接到任何 filter 邏輯（純裝飾性 local state，不影響查詢結果），維持現狀不動，不列入 URL 持久化。
- 不新增 sessionStorage/localStorage 或全域 store；篩選狀態完全由 URL 驅動。

## 七、預計異動檔案

- 新增：`src/features/ledger/urlState.ts`
- 修改：`src/features/ledger/LedgerView.tsx`、`src/features/ledger/components/FilterBar.tsx`、
  `src/features/ledger/components/LedgerTable.tsx`、`src/features/ledger/components/LedgerCards.tsx`、
  `src/features/ledger/components/SummaryCards.tsx`、
  `src/features/ledger/transaction/TransactionFormView.tsx`、
  `src/features/ledger/components/TrendDetailPageView.tsx`
- 修改：`src/app/ledger/page.tsx`（加 Suspense）、`src/app/ledger/new/page.tsx`、
  `src/app/ledger/[id]/page.tsx`、`src/app/ledger/trend/page.tsx`
