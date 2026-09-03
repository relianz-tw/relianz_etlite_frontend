import type { SortDir } from '@/lib/utils';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import { availableYears, CATEGORY_OPTIONS } from './data';
import type { CategoryCode } from './types';

export type WithholdingSortKey = 'paymentDate' | 'grossIncome';

export interface WithholdingSortState {
  key: WithholdingSortKey | null;
  dir: SortDir;
}

/** 進階搜尋條件：所得金額區間 + 各類扣繳繳款狀態 + 二代健保繳費狀態；'' 代表不篩，'true'/'false' 為草稿字串慣例 */
export interface WithholdingAdvancedFilter {
  minAmount: string;
  maxAmount: string;
  withholdingPaid: '' | 'true' | 'false';
  nhiPaid: '' | 'true' | 'false';
}

export interface WithholdingFilterState {
  year: number;
  /** 0 = 全部月份 */
  month: number;
  category: CategoryCode | 'all';
  query: string;
  advanced: WithholdingAdvancedFilter;
  sort: WithholdingSortState;
  page: number;
  limit: number;
}

const DEFAULT_MONTH = 0;
const DEFAULT_CATEGORY = 'all';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
export const DEFAULT_SORT: WithholdingSortState = { key: null, dir: 'none' };
export const EMPTY_ADVANCED: WithholdingAdvancedFilter = { minAmount: '', maxAmount: '', withholdingPaid: '', nhiPaid: '' };

const VALID_CATEGORIES = new Set(CATEGORY_OPTIONS.map(o => o.code));
const VALID_LIMITS = new Set([10, 25, 50]);
const SORT_KEYS: WithholdingSortKey[] = ['paymentDate', 'grossIncome'];

/**
 * 從網址查詢字串解析各類扣繳列表目前的篩選/排序/分頁狀態。任何欄位值不在合法範圍內
 * （例如手動改網址帶入無效值）一律回退預設值，不拋錯。
 */
export function parseWithholdingFilters(searchParams: ReadonlyURLSearchParams): WithholdingFilterState {
  const years = availableYears();
  const yearParam = Number.parseInt(searchParams.get('year') ?? '', 10);
  const year = years.includes(yearParam) ? yearParam : years[0];

  const monthParam = Number.parseInt(searchParams.get('month') ?? '', 10);
  const month = Number.isFinite(monthParam) && monthParam >= 0 && monthParam <= 12 ? monthParam : DEFAULT_MONTH;

  const categoryParam = searchParams.get('category');
  const category = categoryParam && VALID_CATEGORIES.has(categoryParam as CategoryCode) ? (categoryParam as CategoryCode) : DEFAULT_CATEGORY;

  const pageParam = Number.parseInt(searchParams.get('page') ?? '', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : DEFAULT_PAGE;

  const limitParam = Number.parseInt(searchParams.get('limit') ?? '', 10);
  const limit = VALID_LIMITS.has(limitParam) ? limitParam : DEFAULT_LIMIT;

  const query = searchParams.get('query') ?? '';

  const withholdingPaidParam = searchParams.get('withholdingPaid');
  const nhiPaidParam = searchParams.get('nhiPaid');
  const advanced: WithholdingAdvancedFilter = {
    minAmount: searchParams.get('minAmount') ?? '',
    maxAmount: searchParams.get('maxAmount') ?? '',
    withholdingPaid: withholdingPaidParam === 'true' || withholdingPaidParam === 'false' ? withholdingPaidParam : '',
    nhiPaid: nhiPaidParam === 'true' || nhiPaidParam === 'false' ? nhiPaidParam : '',
  };

  const sortKeyParam = searchParams.get('sortKey');
  const sortKey = sortKeyParam && (SORT_KEYS as string[]).includes(sortKeyParam) ? (sortKeyParam as WithholdingSortKey) : null;
  const sort: WithholdingSortState = sortKey ? { key: sortKey, dir: searchParams.get('sortDir') === 'desc' ? 'desc' : 'asc' } : DEFAULT_SORT;

  return { year, month, category, query, advanced, sort, page, limit };
}

/** 將篩選狀態序列化為查詢字串；欄位值等於預設值時省略，維持網址乾淨 */
export function buildWithholdingQueryString(state: WithholdingFilterState): string {
  const params = new URLSearchParams();
  params.set('year', String(state.year));
  if (state.month !== DEFAULT_MONTH) params.set('month', String(state.month));
  if (state.category !== DEFAULT_CATEGORY) params.set('category', state.category);
  if (state.query.trim()) params.set('query', state.query);
  if (state.advanced.minAmount) params.set('minAmount', state.advanced.minAmount);
  if (state.advanced.maxAmount) params.set('maxAmount', state.advanced.maxAmount);
  if (state.advanced.withholdingPaid) params.set('withholdingPaid', state.advanced.withholdingPaid);
  if (state.advanced.nhiPaid) params.set('nhiPaid', state.advanced.nhiPaid);
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

/** 幫「離開各類扣繳列表」的目的網址附上 from=<目前查詢字串>；查詢字串為空時原樣回傳 href */
export function withReturnParam(href: string, searchParams: ReadonlyURLSearchParams): string {
  return appendReturnQuery(href, searchParams.toString() || undefined);
}

/** 依 from 參數組出「返回各類扣繳列表」的目標網址，無 from 時回退 "/withholding/other" */
export function resolveWithholdingBackHref(returnQuery?: string): string {
  return returnQuery ? `/withholding/other?${returnQuery}` : '/withholding/other';
}

/** Server Component 的 searchParams.from 可能是 string | string[]；統一正規化成單一字串 */
export function parseReturnQueryParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
