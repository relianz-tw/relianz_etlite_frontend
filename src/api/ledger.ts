/**
 * 帳簿區「交易紀錄」端點封裝（/ael/ledger/payables、/ael/ledger/receivables，
 * 含已付款 payables/paid、已收款 receivables/collected 篩選端點）。
 * 自動帶入 companyUuid，呼叫端（TransactionFormView）不需重複組裝。
 */
import { apiFetch, buildQuery } from './client';
import { COMPANY_UUID } from './config';
import type {
  CreatePayableBody,
  CreateReceivableBody,
  EntryDetailResult,
  PayablesFilterBody,
  PayablesFilterResult,
  ReceivablesFilterBody,
  ReceivablesFilterResult,
  SettlePayableBody,
  SettleReceivableBody,
} from './types';

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

export function fetchPayables(filter: Omit<PayablesFilterBody, 'companyUuid'>): Promise<PayablesFilterResult> {
  return apiFetch<PayablesFilterResult>('/ael/ledger/payables/filter', {
    method: 'POST',
    body: JSON.stringify({ ...filter, companyUuid: COMPANY_UUID }),
  });
}

export function fetchReceivables(filter: Omit<ReceivablesFilterBody, 'companyUuid'>): Promise<ReceivablesFilterResult> {
  return apiFetch<ReceivablesFilterResult>('/ael/ledger/receivables/filter', {
    method: 'POST',
    body: JSON.stringify({ ...filter, companyUuid: COMPANY_UUID }),
  });
}

export function fetchPayablesPaid(filter: Omit<PayablesFilterBody, 'companyUuid'>): Promise<PayablesFilterResult> {
  return apiFetch<PayablesFilterResult>('/ael/ledger/payables/paid/filter', {
    method: 'POST',
    body: JSON.stringify({ ...filter, companyUuid: COMPANY_UUID }),
  });
}

export function fetchReceivablesCollected(filter: Omit<ReceivablesFilterBody, 'companyUuid'>): Promise<ReceivablesFilterResult> {
  return apiFetch<ReceivablesFilterResult>('/ael/ledger/receivables/collected/filter', {
    method: 'POST',
    body: JSON.stringify({ ...filter, companyUuid: COMPANY_UUID }),
  });
}

export function settleReceivable(body: Omit<SettleReceivableBody, 'companyUuid'>): Promise<unknown> {
  return apiFetch<unknown>('/ael/ledger/receivables/settle', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

export function settlePayable(body: Omit<SettlePayableBody, 'companyUuid'>): Promise<unknown> {
  return apiFetch<unknown>('/ael/ledger/payables/settle', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

export function fetchEntryDetail(params: { ledgerUuid: string }): Promise<EntryDetailResult> {
  return apiFetch<EntryDetailResult>(`/ael/ledger/entries/detail${buildQuery({ companyUuid: COMPANY_UUID, ledgerUuid: params.ledgerUuid })}`);
}
