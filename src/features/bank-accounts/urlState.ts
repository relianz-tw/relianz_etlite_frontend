import type { ReadonlyURLSearchParams } from 'next/navigation';

/** 交易列表分頁的預設頁碼 */
const DEFAULT_PAGE = 1;

export interface BankFilterState {
  /** 目前選定的銀行帳戶 uuid；空字串代表尚未指定，由 BankAccountsView 載入帳戶清單後補上預設帳戶 */
  account: string;
  /** 查詢期間起始日，YYYYMMDD；空字串代表使用「近一個月」預設值 */
  dateFrom: string;
  /** 查詢期間結束日，YYYYMMDD；空字串代表使用「近一個月」預設值 */
  dateTo: string;
  /** 交易列表目前頁碼，從 1 開始 */
  page: number;
}

/**
 * 從網址查詢字串解析帳戶／期間／分頁篩選狀態。帳戶清單為動態資料（來自 /ael/bankAccounts），
 * 此處僅取得原始字串，實際帳戶是否存在由 BankAccountsView 載入帳戶清單後驗證並視需要回退預設帳戶。
 */
export function parseBankFilters(searchParams: ReadonlyURLSearchParams): BankFilterState {
  const page = Number(searchParams.get('page'));
  return {
    account: searchParams.get('account') ?? '',
    dateFrom: searchParams.get('dateFrom') ?? '',
    dateTo: searchParams.get('dateTo') ?? '',
    page: Number.isFinite(page) && page > 0 ? page : DEFAULT_PAGE,
  };
}

/** 將篩選狀態序列化為查詢字串；欄位為空／預設值時省略，維持網址乾淨 */
export function buildBankQueryString(state: BankFilterState): string {
  const params = new URLSearchParams();
  if (state.account) params.set('account', state.account);
  if (state.dateFrom) params.set('dateFrom', state.dateFrom);
  if (state.dateTo) params.set('dateTo', state.dateTo);
  if (state.page !== DEFAULT_PAGE) params.set('page', String(state.page));
  return params.toString();
}

/** 已知 returnQuery 字串時（如交易詳細頁內部切換）組出保留 from 的目標網址 */
export function appendReturnQuery(href: string, returnQuery?: string): string {
  if (!returnQuery) return href;
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}from=${encodeURIComponent(returnQuery)}`;
}

/** 幫「離開銀行帳戶列表」的目的網址附上 from=<目前查詢字串>；查詢字串為空時原樣回傳 href */
export function withReturnParam(href: string, searchParams: ReadonlyURLSearchParams): string {
  return appendReturnQuery(href, searchParams.toString() || undefined);
}

/** 依 from 參數組出「返回銀行帳戶總覽」的目標網址，無 from 時回退 "/bank-accounts" */
export function resolveBankAccountsBackHref(returnQuery?: string): string {
  return returnQuery ? `/bank-accounts?${returnQuery}` : '/bank-accounts';
}

/** Server Component 的 searchParams.from 可能是 string | string[]；統一正規化成單一字串 */
export function parseReturnQueryParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
