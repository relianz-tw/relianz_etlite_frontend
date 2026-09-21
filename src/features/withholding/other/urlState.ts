import type { ReadonlyURLSearchParams } from 'next/navigation';
import { availableYears, CATEGORY_OPTIONS } from './data';
import type { CategoryCode } from './types';

/**
 * 明細層（L2，群組內單筆列表）排序鍵，對照後端 filter 的 sortType（1–6，非法或未傳視為 1）：
 * 1 新增日期、2 所得日期、3 各類扣繳繳款日期、4 二代健保繳款日期、5 各類扣繳繳費狀態、6 二代健保繳費狀態。
 * ⚠️ 後端未提供依「支付日期」或「所得金額」排序，故不再沿用舊版假資料時期的 paymentDate／grossIncome 排序鍵。
 */
export type WithholdingSortKey = 'createTime' | 'incomeDate' | 'withholdingRemitDate' | 'nhiRemitDate' | 'withholdingPaidStatus' | 'nhiPaidStatus';

export const SORT_KEY_TO_TYPE: Record<WithholdingSortKey, number> = {
  createTime: 1,
  incomeDate: 2,
  withholdingRemitDate: 3,
  nhiRemitDate: 4,
  withholdingPaidStatus: 5,
  nhiPaidStatus: 6,
};

/** 排序鍵中文標籤，供 L2 群組明細頁排序下拉選單使用 */
export const SORT_KEY_LABELS: Record<WithholdingSortKey, string> = {
  createTime: '新增日期',
  incomeDate: '所得日期',
  withholdingRemitDate: '各類扣繳繳款日期',
  nhiRemitDate: '二代健保繳款日期',
  withholdingPaidStatus: '各類扣繳繳費狀態',
  nhiPaidStatus: '二代健保繳費狀態',
};

/**
 * 彙總層（L1，同一所得人同一類別彙總列表）排序鍵，對照 summary/filter 的 sortType（1–5，非法或未傳視為 1）：
 * 1 所得人姓名、2 所得金額加總、3 扣繳稅額加總、4 支付金額加總、5 筆數。與上方明細層 sortType 語意不同，
 * 兩層各自獨立編號，不可混用。
 */
export type WithholdingSummarySortKey = 'name' | 'income' | 'withholding' | 'payment' | 'count';

export const SUMMARY_SORT_KEY_TO_TYPE: Record<WithholdingSummarySortKey, number> = {
  name: 1,
  income: 2,
  withholding: 3,
  payment: 4,
  count: 5,
};

/** 排序鍵中文標籤，供 L1 彙總列表排序下拉選單使用 */
export const SUMMARY_SORT_KEY_LABELS: Record<WithholdingSummarySortKey, string> = {
  name: '所得人姓名',
  income: '所得金額',
  withholding: '扣繳稅額',
  payment: '支付金額',
  count: '筆數',
};

export type SortDir = 'asc' | 'desc';

export interface WithholdingSortState {
  key: WithholdingSortKey;
  dir: SortDir;
}

export interface WithholdingSummarySortState {
  key: WithholdingSummarySortKey;
  dir: SortDir;
}

/** 進階搜尋條件：所得金額區間 + 各類扣繳繳款狀態 + 二代健保繳費狀態；'' 代表不篩，'true'/'false' 為草稿字串慣例
 *  L1／L2 共用同一形狀：L1 比對群組加總後金額／群組內是否存在未繳，L2 比對單筆金額／單筆是否已繳。 */
export interface WithholdingAdvancedFilter {
  minAmount: string;
  maxAmount: string;
  withholdingPaid: '' | 'true' | 'false';
  nhiPaid: '' | 'true' | 'false';
}

/** L1（彙總列表）篩選/排序/分頁狀態 */
export interface WithholdingFilterState {
  year: number;
  /** 0 = 全部月份 */
  month: number;
  category: CategoryCode | 'all';
  query: string;
  advanced: WithholdingAdvancedFilter;
  sort: WithholdingSummarySortState;
  page: number;
  limit: number;
}

/**
 * L2（群組內明細列表）排序/分頁狀態；已由 groupKey／incomeType 限定所得人與類別，
 * 故不含 category／query／進階金額狀態篩選（此層資料量小，暫不提供，需要時再補）。
 */
export interface WithholdingGroupFilterState {
  year: number;
  /** 0 = 全部月份 */
  month: number;
  sort: WithholdingSortState;
  page: number;
  limit: number;
}

const DEFAULT_MONTH = 0;
const DEFAULT_CATEGORY = 'all';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
/** L2 群組明細排序預設：新增日期新到舊 */
export const DEFAULT_SORT: WithholdingSortState = { key: 'createTime', dir: 'desc' };
/** L1 彙總列表排序預設：所得金額高到低 */
export const DEFAULT_SUMMARY_SORT: WithholdingSummarySortState = { key: 'income', dir: 'desc' };
export const EMPTY_ADVANCED: WithholdingAdvancedFilter = { minAmount: '', maxAmount: '', withholdingPaid: '', nhiPaid: '' };

const VALID_CATEGORIES = new Set(CATEGORY_OPTIONS.map(o => o.code));
const VALID_LIMITS = new Set([10, 25, 50]);
const SORT_KEYS: WithholdingSortKey[] = Object.keys(SORT_KEY_TO_TYPE) as WithholdingSortKey[];
const SUMMARY_SORT_KEYS: WithholdingSummarySortKey[] = Object.keys(SUMMARY_SORT_KEY_TO_TYPE) as WithholdingSummarySortKey[];

function parseYear(searchParams: ReadonlyURLSearchParams): number {
  const years = availableYears();
  const yearParam = Number.parseInt(searchParams.get('year') ?? '', 10);
  return years.includes(yearParam) ? yearParam : years[0];
}

function parseMonth(searchParams: ReadonlyURLSearchParams): number {
  const monthParam = Number.parseInt(searchParams.get('month') ?? '', 10);
  return Number.isFinite(monthParam) && monthParam >= 0 && monthParam <= 12 ? monthParam : DEFAULT_MONTH;
}

function parsePage(searchParams: ReadonlyURLSearchParams): number {
  const pageParam = Number.parseInt(searchParams.get('page') ?? '', 10);
  return Number.isFinite(pageParam) && pageParam > 0 ? pageParam : DEFAULT_PAGE;
}

function parseLimit(searchParams: ReadonlyURLSearchParams): number {
  const limitParam = Number.parseInt(searchParams.get('limit') ?? '', 10);
  return VALID_LIMITS.has(limitParam) ? limitParam : DEFAULT_LIMIT;
}

function parseAdvanced(searchParams: ReadonlyURLSearchParams): WithholdingAdvancedFilter {
  const withholdingPaidParam = searchParams.get('withholdingPaid');
  const nhiPaidParam = searchParams.get('nhiPaid');
  return {
    minAmount: searchParams.get('minAmount') ?? '',
    maxAmount: searchParams.get('maxAmount') ?? '',
    withholdingPaid: withholdingPaidParam === 'true' || withholdingPaidParam === 'false' ? withholdingPaidParam : '',
    nhiPaid: nhiPaidParam === 'true' || nhiPaidParam === 'false' ? nhiPaidParam : '',
  };
}

function buildAdvancedParams(params: URLSearchParams, advanced: WithholdingAdvancedFilter): void {
  if (advanced.minAmount) params.set('minAmount', advanced.minAmount);
  if (advanced.maxAmount) params.set('maxAmount', advanced.maxAmount);
  if (advanced.withholdingPaid) params.set('withholdingPaid', advanced.withholdingPaid);
  if (advanced.nhiPaid) params.set('nhiPaid', advanced.nhiPaid);
}

/**
 * 從網址查詢字串解析 L1（彙總列表）目前的篩選/排序/分頁狀態。任何欄位值不在合法範圍內
 * （例如手動改網址帶入無效值）一律回退預設值，不拋錯。
 */
export function parseWithholdingFilters(searchParams: ReadonlyURLSearchParams): WithholdingFilterState {
  const categoryParam = searchParams.get('category');
  const category = categoryParam && VALID_CATEGORIES.has(categoryParam as CategoryCode) ? (categoryParam as CategoryCode) : DEFAULT_CATEGORY;

  const sortKeyParam = searchParams.get('sortKey');
  const sortKey = sortKeyParam && (SUMMARY_SORT_KEYS as string[]).includes(sortKeyParam) ? (sortKeyParam as WithholdingSummarySortKey) : DEFAULT_SUMMARY_SORT.key;
  const sortDirParam = searchParams.get('sortDir');
  const sort: WithholdingSummarySortState = {
    key: sortKey,
    dir: sortDirParam === 'asc' ? 'asc' : sortDirParam === 'desc' ? 'desc' : DEFAULT_SUMMARY_SORT.dir,
  };

  return {
    year: parseYear(searchParams),
    month: parseMonth(searchParams),
    category,
    query: searchParams.get('query') ?? '',
    advanced: parseAdvanced(searchParams),
    sort,
    page: parsePage(searchParams),
    limit: parseLimit(searchParams),
  };
}

/** 將 L1 篩選狀態序列化為查詢字串；欄位值等於預設值時省略，維持網址乾淨 */
export function buildWithholdingQueryString(state: WithholdingFilterState): string {
  const params = new URLSearchParams();
  params.set('year', String(state.year));
  if (state.month !== DEFAULT_MONTH) params.set('month', String(state.month));
  if (state.category !== DEFAULT_CATEGORY) params.set('category', state.category);
  if (state.query.trim()) params.set('query', state.query);
  buildAdvancedParams(params, state.advanced);
  if (state.sort.key !== DEFAULT_SUMMARY_SORT.key) params.set('sortKey', state.sort.key);
  if (state.sort.dir !== DEFAULT_SUMMARY_SORT.dir) params.set('sortDir', state.sort.dir);
  if (state.limit !== DEFAULT_LIMIT) params.set('limit', String(state.limit));
  if (state.page !== DEFAULT_PAGE) params.set('page', String(state.page));
  return params.toString();
}

/**
 * 從網址查詢字串解析 L2（群組內明細列表）目前的篩選/排序/分頁狀態；已由路由的 groupKey
 * 與 ?ic= 限定所得人與類別，故不含 category／query。
 */
export function parseWithholdingGroupFilters(searchParams: ReadonlyURLSearchParams): WithholdingGroupFilterState {
  const sortKeyParam = searchParams.get('sortKey');
  const sortKey = sortKeyParam && (SORT_KEYS as string[]).includes(sortKeyParam) ? (sortKeyParam as WithholdingSortKey) : DEFAULT_SORT.key;
  const sortDirParam = searchParams.get('sortDir');
  const sort: WithholdingSortState = { key: sortKey, dir: sortDirParam === 'asc' ? 'asc' : sortDirParam === 'desc' ? 'desc' : DEFAULT_SORT.dir };

  return {
    year: parseYear(searchParams),
    month: parseMonth(searchParams),
    sort,
    page: parsePage(searchParams),
    limit: parseLimit(searchParams),
  };
}

/** 將 L2 排序/分頁狀態序列化為查詢字串；欄位值等於預設值時省略，維持網址乾淨 */
export function buildWithholdingGroupQueryString(state: WithholdingGroupFilterState): string {
  const params = new URLSearchParams();
  params.set('year', String(state.year));
  if (state.month !== DEFAULT_MONTH) params.set('month', String(state.month));
  if (state.sort.key !== DEFAULT_SORT.key) params.set('sortKey', state.sort.key);
  if (state.sort.dir !== DEFAULT_SORT.dir) params.set('sortDir', state.sort.dir);
  if (state.limit !== DEFAULT_LIMIT) params.set('limit', String(state.limit));
  if (state.page !== DEFAULT_PAGE) params.set('page', String(state.page));
  return params.toString();
}

/**
 * 已知目的地 href 時附上 from=<完整返回路徑+查詢字串>；from 攜帶的是「完整路徑」而非單純查詢字串，
 * 讓下一層可能是 L1 或 L2，返回時都能還原正確頁面，不只是還原查詢條件。
 */
export function appendReturnPath(href: string, returnPath?: string): string {
  if (!returnPath) return href;
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}from=${encodeURIComponent(returnPath)}`;
}

/** 幫「離開目前頁面」的目的網址附上 from=<目前完整路徑+查詢字串> */
export function withReturnParam(href: string, pathname: string, searchParams: ReadonlyURLSearchParams): string {
  const query = searchParams.toString();
  return appendReturnPath(href, query ? `${pathname}?${query}` : pathname);
}

/** 依 from 參數（完整路徑+查詢字串）組出返回網址；無 from 時退回彙總列表首頁 "/withholding/other" */
export function resolveWithholdingBackHref(returnPath?: string): string {
  return returnPath || '/withholding/other';
}

/** Server Component 的 searchParams.from 可能是 string | string[]；統一正規化成單一字串 */
export function parseReturnQueryParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * L1 列表點擊一列時，組出該群組（L2）的目標網址：延續 L1 目前選取的年度／月份作為 L2 初始篩選，
 * 並帶上 from 供 L2 返回 L1 時還原完整查詢條件。
 */
export function buildGroupHref(groupKey: string, categoryCode: CategoryCode, pathname: string, searchParams: ReadonlyURLSearchParams): string {
  const params = new URLSearchParams({ ic: categoryCode });
  const year = searchParams.get('year');
  if (year) params.set('year', year);
  const month = searchParams.get('month');
  if (month) params.set('month', month);
  return withReturnParam(`/withholding/other/group/${encodeURIComponent(groupKey)}?${params.toString()}`, pathname, searchParams);
}
