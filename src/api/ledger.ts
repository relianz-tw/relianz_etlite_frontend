/**
 * 帳簿區「交易紀錄」端點封裝（/ael/ledger/payables、/ael/ledger/receivables）。
 * 自動帶入 companyUuid，呼叫端（TransactionFormView）不需重複組裝。
 */
import { apiFetch } from './client';
import { COMPANY_UUID } from './config';
import type { CreatePayableBody, CreateReceivableBody } from './types';

export function createPayable(body: Omit<CreatePayableBody, 'companyUuid'>): Promise<unknown> {
  return apiFetch<unknown>('/ael/ledger/payables', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

export function createReceivable(body: Omit<CreateReceivableBody, 'companyUuid'>): Promise<unknown> {
  return apiFetch<unknown>('/ael/ledger/receivables', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}
