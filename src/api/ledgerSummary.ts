/**
 * 帳簿總覽彙總端點封裝（POST /ael/ledger/{receivables,payables}/{,collected/,paid/}summary）。
 * 自動帶入 companyUuid，呼叫端（useLedgerSummary）不需重複組裝。
 */
import { apiFetch } from './client';
import { COMPANY_UUID } from './config';
import type { PayablesSummaryBody, PayablesSummaryResult, ReceivablesSummaryBody, ReceivablesSummaryResult } from './types';

/** 帳簿總覽彙總（銷項·應收帳款）；dateFrom/dateTo 口徑為 transaction_date */
export function fetchReceivablesSummary(body: Omit<ReceivablesSummaryBody, 'companyUuid'>): Promise<ReceivablesSummaryResult> {
  return apiFetch<ReceivablesSummaryResult>('/ael/ledger/receivables/summary', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 帳簿總覽彙總（銷項·已收款）；dateFrom/dateTo 口徑為 entry_date */
export function fetchReceivablesCollectedSummary(body: Omit<ReceivablesSummaryBody, 'companyUuid'>): Promise<ReceivablesSummaryResult> {
  return apiFetch<ReceivablesSummaryResult>('/ael/ledger/receivables/collected/summary', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 帳簿總覽彙總（進項·應付帳款）；dateFrom/dateTo 口徑為 transaction_date */
export function fetchPayablesSummary(body: Omit<PayablesSummaryBody, 'companyUuid'>): Promise<PayablesSummaryResult> {
  return apiFetch<PayablesSummaryResult>('/ael/ledger/payables/summary', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 帳簿總覽彙總（進項·已付款）；dateFrom/dateTo 口徑為 entry_date */
export function fetchPayablesPaidSummary(body: Omit<PayablesSummaryBody, 'companyUuid'>): Promise<PayablesSummaryResult> {
  return apiFetch<PayablesSummaryResult>('/ael/ledger/payables/paid/summary', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}
