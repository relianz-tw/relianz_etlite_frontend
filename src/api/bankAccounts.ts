/**
 * 「銀行帳戶管理」端點封裝（/ael/bankAccounts，見 bank.html 內嵌 OpenAPI 規格）。
 * 自動帶入 companyUuid，呼叫端（PaymentSettingsTab/BankAccountCard）不需重複組裝。
 */
import { buildQuery, apiFetch } from './client';
import { COMPANY_UUID } from './config';
import type { BankAccountDto, CreateBankAccountBody, UpdateBankAccountBody } from './types';

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
