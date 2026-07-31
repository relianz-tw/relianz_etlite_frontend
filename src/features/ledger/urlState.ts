import type { ReadonlyURLSearchParams } from 'next/navigation';
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
export function parseLedgerFilters(searchParams: ReadonlyURLSearchParams): LedgerFilterState {
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
export function withReturnParam(href: string, searchParams: ReadonlyURLSearchParams): string {
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
