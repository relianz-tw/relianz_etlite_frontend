/**
 * 「銀行帳戶管理」端點封裝（/ael/bankAccounts，見 bank.html 內嵌 OpenAPI 規格）。
 * 自動帶入 companyUuid，呼叫端（PaymentSettingsTab/BankAccountCard）不需重複組裝。
 */
import { buildQuery, apiFetch } from './client';
import { COMPANY_UUID } from './config';
import type {
  BankAccountDto,
  BankTransactionDetailQuery,
  BankTransactionDetailResult,
  BankTransactionsBody,
  BankTransactionsResult,
  CashMovementBody,
  CashMovementResult,
  CreateBankAccountBody,
  UpdateBankAccountBody,
} from './types';

export function listBankAccounts(): Promise<BankAccountDto[]> {
  return apiFetch<BankAccountDto[]>(`/ael/bankAccounts${buildQuery({ companyUuid: COMPANY_UUID })}`);
}

export function createBankAccount(body: Omit<CreateBankAccountBody, 'companyUuid'>): Promise<BankAccountDto> {
  return apiFetch<BankAccountDto>('/ael/bankAccounts', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

export function updateBankAccount(body: Omit<UpdateBankAccountBody, 'companyUuid'>): Promise<BankAccountDto> {
  return apiFetch<BankAccountDto>('/ael/bankAccounts', {
    method: 'PATCH',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 拿取銀行帳戶相關沖帳事件列表（含關聯原單明細與期間合計）；日記帳分錄請另搭配 fetchDailyDetail（@/api/ledger） */
export function fetchBankTransactions(body: Omit<BankTransactionsBody, 'companyUuid'>): Promise<BankTransactionsResult> {
  return apiFetch<BankTransactionsResult>('/ael/bankAccounts/transactions', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 單筆沖帳事件明細（交易明細頁用），可直接依網址參數查詢單筆，不需重查整期列表 */
export function fetchBankTransactionDetail(params: Omit<BankTransactionDetailQuery, 'companyUuid'>): Promise<BankTransactionDetailResult> {
  return apiFetch<BankTransactionDetailResult>(
    `/ael/bankAccounts/transactions/detail${buildQuery({ ...params, companyUuid: COMPANY_UUID })}`,
  );
}

/** 建立一筆銀行直接提／匯款的交易紀錄 */
export function createCashMovement(body: Omit<CashMovementBody, 'companyUuid'>): Promise<CashMovementResult> {
  return apiFetch<CashMovementResult>('/ael/bankAccounts/cashMovements', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}
