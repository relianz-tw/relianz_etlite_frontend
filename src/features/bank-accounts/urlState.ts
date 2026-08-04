import type { ReadonlyURLSearchParams } from 'next/navigation';

export interface BankFilterState {
  /** 目前選定的銀行帳戶 uuid；空字串代表尚未指定，由 BankAccountsView 載入帳戶清單後補上預設帳戶 */
  account: string;
  /** 查詢期間起始日，YYYYMMDD；空字串代表使用「近一個月」預設值 */
  dateFrom: string;
  /** 查詢期間結束日，YYYYMMDD；空字串代表使用「近一個月」預設值 */
  dateTo: string;
}

/**
 * 從網址查詢字串解析帳戶／期間篩選狀態。帳戶清單為動態資料（來自 /ael/bankAccounts），
 * 此處僅取得原始字串，實際帳戶是否存在由 BankAccountsView 載入帳戶清單後驗證並視需要回退預設帳戶。
 */
export function parseBankFilters(searchParams: ReadonlyURLSearchParams): BankFilterState {
  return {
    account: searchParams.get('account') ?? '',
    dateFrom: searchParams.get('dateFrom') ?? '',
    dateTo: searchParams.get('dateTo') ?? '',
  };
}

/** 將篩選狀態序列化為查詢字串；欄位為空時省略，維持網址乾淨 */
export function buildBankQueryString(state: BankFilterState): string {
  const params = new URLSearchParams();
  if (state.account) params.set('account', state.account);
  if (state.dateFrom) params.set('dateFrom', state.dateFrom);
  if (state.dateTo) params.set('dateTo', state.dateTo);
  return params.toString();
}
