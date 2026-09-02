import type { ReadonlyURLSearchParams } from 'next/navigation';
import { FILING_PERIODS } from './data';
import type { AdvancedFilter, SortKey, SortState, TaxSide } from './types';

export interface BusinessTaxFilterState {
  period: string;
  side: TaxSide;
  page: number;
  limit: number;
  query: string;
  advanced: AdvancedFilter;
  sort: SortState;
}

const DEFAULT_PERIOD = FILING_PERIODS[FILING_PERIODS.length - 1].value;
const DEFAULT_SIDE: TaxSide = 'sales';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
export const DEFAULT_SORT: SortState = { key: null, dir: 'none' };

const VALID_PERIODS = new Set(FILING_PERIODS.map(p => p.value));
const VALID_LIMITS = new Set([10, 25, 50]);
const SORT_KEYS: SortKey[] = ['date', 'id'];

/**
 * 從網址查詢字串解析營業稅中心目前的篩選/排序/分頁狀態。任何欄位值不在合法範圍內
 * （例如手動改網址帶入無效值）一律回退預設值，不拋錯。
 */
export function parseBusinessTaxFilters(searchParams: ReadonlyURLSearchParams): BusinessTaxFilterState {
  const periodParam = searchParams.get('period');
  const period = periodParam && VALID_PERIODS.has(periodParam) ? periodParam : DEFAULT_PERIOD;

  const sideParam = searchParams.get('side');
  const side: TaxSide = sideParam === 'sales' || sideParam === 'purchase' ? sideParam : DEFAULT_SIDE;

  const pageParam = Number.parseInt(searchParams.get('page') ?? '', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : DEFAULT_PAGE;

  const limitParam = Number.parseInt(searchParams.get('limit') ?? '', 10);
  const limit = VALID_LIMITS.has(limitParam) ? limitParam : DEFAULT_LIMIT;

  const query = searchParams.get('query') ?? '';

  const isVoidParam = searchParams.get('isVoid');
  const advanced: AdvancedFilter = {
    minAmount: searchParams.get('minAmount') ?? '',
    maxAmount: searchParams.get('maxAmount') ?? '',
    dateFrom: searchParams.get('dateFrom') ?? '',
    dateTo: searchParams.get('dateTo') ?? '',
    taxIdNumber: searchParams.get('taxIdNumber') ?? '',
    companyName: searchParams.get('companyName') ?? '',
    isVoid: isVoidParam === 'true' || isVoidParam === 'false' ? isVoidParam : '',
  };

  const sortKeyParam = searchParams.get('sortKey');
  const sortKey = sortKeyParam && (SORT_KEYS as string[]).includes(sortKeyParam) ? (sortKeyParam as SortKey) : null;
  const sort: SortState = sortKey ? { key: sortKey, dir: searchParams.get('sortDir') === 'desc' ? 'desc' : 'asc' } : DEFAULT_SORT;

  return { period, side, page, limit, query, advanced, sort };
}

/** 將篩選狀態序列化為查詢字串；欄位值等於預設值時省略，維持網址乾淨 */
export function buildBusinessTaxQueryString(state: BusinessTaxFilterState): string {
  const params = new URLSearchParams();
  if (state.period !== DEFAULT_PERIOD) params.set('period', state.period);
  if (state.side !== DEFAULT_SIDE) params.set('side', state.side);
  if (state.query.trim()) params.set('query', state.query);
  if (state.advanced.minAmount) params.set('minAmount', state.advanced.minAmount);
  if (state.advanced.maxAmount) params.set('maxAmount', state.advanced.maxAmount);
  if (state.advanced.dateFrom) params.set('dateFrom', state.advanced.dateFrom);
  if (state.advanced.dateTo) params.set('dateTo', state.advanced.dateTo);
  if (state.advanced.taxIdNumber) params.set('taxIdNumber', state.advanced.taxIdNumber);
  if (state.advanced.companyName) params.set('companyName', state.advanced.companyName);
  if (state.advanced.isVoid) params.set('isVoid', state.advanced.isVoid);
  if (state.sort.key) {
    params.set('sortKey', state.sort.key);
    params.set('sortDir', state.sort.dir === 'desc' ? 'desc' : 'asc');
  }
  if (state.limit !== DEFAULT_LIMIT) params.set('limit', String(state.limit));
  if (state.page !== DEFAULT_PAGE) params.set('page', String(state.page));
  return params.toString();
}

/** 已知 returnQuery 字串時組出保留 from 的目標網址 */
export function appendReturnQuery(href: string, returnQuery?: string): string {
  if (!returnQuery) return href;
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}from=${encodeURIComponent(returnQuery)}`;
}

/** 幫「離開營業稅中心列表」的目的網址附上 from=<目前查詢字串>；查詢字串為空時原樣回傳 href */
export function withReturnParam(href: string, searchParams: ReadonlyURLSearchParams): string {
  return appendReturnQuery(href, searchParams.toString() || undefined);
}

/** 依 from 參數組出「返回營業稅中心」的目標網址，無 from 時回退 "/business-tax" */
export function resolveBusinessTaxBackHref(returnQuery?: string): string {
  return returnQuery ? `/business-tax?${returnQuery}` : '/business-tax';
}

/** Server Component 的 searchParams.from 可能是 string | string[]；統一正規化成單一字串 */
export function parseReturnQueryParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
