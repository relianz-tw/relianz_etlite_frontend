import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { FixedAssetStatusFilter, SortKey, SortState } from './types';

export interface FixedAssetsFilterState {
  q: string;
  status: FixedAssetStatusFilter;
  sort: SortState;
  page: number;
  pageSize: number;
}

const DEFAULT_STATUS: FixedAssetStatusFilter = 'active';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_SORT: SortState = { key: 'acquiredDate', dir: 'desc' };

const VALID_PAGE_SIZES = new Set([10, 25, 50]);
const SORT_KEYS: SortKey[] = ['acquiredDate', 'name', 'originalAmount', 'remainingAmount'];

/** 從 URL query 解析固定資產篩選狀態，非合法值一律回退預設，不拋錯 */
export function parseFixedAssetsFilters(searchParams: ReadonlyURLSearchParams): FixedAssetsFilterState {
  const q = searchParams.get('q') ?? '';

  const statusParam = searchParams.get('status');
  const status: FixedAssetStatusFilter =
    statusParam === 'active' || statusParam === 'completed' || statusParam === 'all' ? statusParam : DEFAULT_STATUS;

  const sortKeyParam = searchParams.get('sortKey');
  const sortKey = sortKeyParam && (SORT_KEYS as string[]).includes(sortKeyParam) ? (sortKeyParam as SortKey) : null;
  const sortDir = searchParams.get('sortDir');
  const sort: SortState = sortKey
    ? { key: sortKey, dir: sortDir === 'asc' ? 'asc' : sortDir === 'desc' ? 'desc' : 'asc' }
    : DEFAULT_SORT;

  const pageParam = Number.parseInt(searchParams.get('page') ?? '', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : DEFAULT_PAGE;

  const pageSizeParam = Number.parseInt(searchParams.get('pageSize') ?? '', 10);
  const pageSize = VALID_PAGE_SIZES.has(pageSizeParam) ? pageSizeParam : DEFAULT_PAGE_SIZE;

  return { q, status, sort, page, pageSize };
}

/** 將篩選狀態序列化為 query string；等於預設值的欄位省略 */
export function buildFixedAssetsQueryString(state: FixedAssetsFilterState): string {
  const params = new URLSearchParams();
  if (state.q.trim()) params.set('q', state.q);
  if (state.status !== DEFAULT_STATUS) params.set('status', state.status);
  if (state.sort.key !== DEFAULT_SORT.key || state.sort.dir !== DEFAULT_SORT.dir) {
    if (state.sort.key) {
      params.set('sortKey', state.sort.key);
      params.set('sortDir', state.sort.dir);
    }
  }
  if (state.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(state.pageSize));
  if (state.page !== DEFAULT_PAGE) params.set('page', String(state.page));
  return params.toString();
}
