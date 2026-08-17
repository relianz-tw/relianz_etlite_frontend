/**
 * 帳簿區「交易紀錄」端點封裝（/ael/ledger/payables、/ael/ledger/receivables，
 * 含已付款 payables/paid、已收款 receivables/collected 篩選端點）。
 * 自動帶入 companyUuid，呼叫端（TransactionFormView）不需重複組裝。
 */
import { apiFetch, buildQuery } from './client';
import { COMPANY_UUID } from './config';
import type {
  CreateAllowanceBody,
  CreatePayableBody,
  CreateReceivableBody,
  DailyDetailResult,
  EntryDetailResult,
  InvoiceOriginResult,
  ManualSettleResult,
  PayablesFilterBody,
  PayablesFilterResult,
  ReceivablesFilterBody,
  ReceivablesFilterResult,
  ReconciliationQuery,
  ReconPayableGroupDto,
  ReconReceivableGroupDto,
  ReverseSettleBody,
  SettlePayableBody,
  SettlePayablePreviewBody,
  SettlePayablePreviewResult,
  SettlePayableSummaryBody,
  SettlePayableSummaryResult,
  SettleReceivableBody,
  SettleReceivablePreviewBody,
  SettleReceivablePreviewResult,
  SettleReceivableSummaryBody,
  SettleReceivableSummaryResult,
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

/** 建立進折交易紀錄 */
export function createPayableAllowance(body: Omit<CreateAllowanceBody, 'companyUuid'>): Promise<unknown> {
  return apiFetch<unknown>('/ael/ledger/payables/allowance', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 建立銷折交易紀錄 */
export function createReceivableAllowance(body: Omit<CreateAllowanceBody, 'companyUuid'>): Promise<unknown> {
  return apiFetch<unknown>('/ael/ledger/receivables/allowance', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 發票字軌＋號碼反查業務原單，供建立折讓單前取得 originLedgerUuid；查無原單時 entry／invoice 皆為 null */
export function fetchInvoiceOrigin(params: { invoiceTrack?: string; invoiceNumber: string }): Promise<InvoiceOriginResult> {
  return apiFetch<InvoiceOriginResult>(
    `/ael/ledger/invoices/origin${buildQuery({ companyUuid: COMPANY_UUID, invoiceTrack: params.invoiceTrack, invoiceNumber: params.invoiceNumber })}`,
  );
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

/** 對帳中心：依廠商分組的進項應付；不帶 counterpartyUuid 代表全部廠商 */
export function fetchReconciliationPayables(params: ReconciliationQuery): Promise<ReconPayableGroupDto[]> {
  return apiFetch<ReconPayableGroupDto[]>(`/ael/ledger/reconciliation/payables${buildQuery({ companyUuid: COMPANY_UUID, ...params })}`);
}

/** 對帳中心：依銷售管道分組的銷項應收；不帶 paymentChannelUuid 代表全部管道 */
export function fetchReconciliationReceivables(params: ReconciliationQuery): Promise<ReconReceivableGroupDto[]> {
  return apiFetch<ReconReceivableGroupDto[]>(`/ael/ledger/reconciliation/receivables${buildQuery({ companyUuid: COMPANY_UUID, ...params })}`);
}

export function settleReceivable(body: Omit<SettleReceivableBody, 'companyUuid'>): Promise<ManualSettleResult> {
  return apiFetch<ManualSettleResult>('/ael/ledger/receivables/settle', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

export function settlePayable(body: Omit<SettlePayableBody, 'companyUuid'>): Promise<ManualSettleResult> {
  return apiFetch<ManualSettleResult>('/ael/ledger/payables/settle', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 匯總沖帳（銷項）預覽拆帳：依 settleAmount 由舊到新試算各原單分配結果，不實際入帳 */
export function previewSettleReceivable(body: Omit<SettleReceivablePreviewBody, 'companyUuid'>): Promise<SettleReceivablePreviewResult> {
  return apiFetch<SettleReceivablePreviewResult>('/ael/ledger/reconciliation/receivables/settle/preview', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 匯總沖帳（銷項）真正執行沖帳：依預覽結果的原單 uuid 與存入銀行帳戶入帳，非預覽 */
export function settleReceivableSummary(body: Omit<SettleReceivableSummaryBody, 'companyUuid'>): Promise<SettleReceivableSummaryResult> {
  return apiFetch<SettleReceivableSummaryResult>('/ael/ledger/reconciliation/receivables/settle/summary', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 匯總沖帳（進項）預覽拆帳：依 settleAmount 由舊到新試算各原單分配結果，不實際入帳 */
export function previewSettlePayable(body: Omit<SettlePayablePreviewBody, 'companyUuid'>): Promise<SettlePayablePreviewResult> {
  return apiFetch<SettlePayablePreviewResult>('/ael/ledger/reconciliation/payables/settle/preview', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 匯總沖帳（進項）真正執行沖帳：依預覽結果的原單 uuid 與付款銀行帳戶入帳，非預覽 */
export function settlePayableSummary(body: Omit<SettlePayableSummaryBody, 'companyUuid'>): Promise<SettlePayableSummaryResult> {
  return apiFetch<SettlePayableSummaryResult>('/ael/ledger/reconciliation/payables/settle/summary', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

export function fetchEntryDetail(params: { ledgerUuid: string }): Promise<EntryDetailResult> {
  return apiFetch<EntryDetailResult>(`/ael/ledger/entries/detail${buildQuery({ companyUuid: COMPANY_UUID, ledgerUuid: params.ledgerUuid })}`);
}

/** 取得單筆交易相關的日記帳分錄（GET /ael/ledger/entries/dailyDetail） */
export function fetchDailyDetail(params: { ledgerUuid: string }): Promise<DailyDetailResult> {
  return apiFetch<DailyDetailResult>(`/ael/ledger/entries/dailyDetail${buildQuery({ companyUuid: COMPANY_UUID, ledgerUuid: params.ledgerUuid })}`);
}

/** 撤銷手動沖帳紀錄 */
export function reverseManualSettle(body: Omit<ReverseSettleBody, 'companyUuid'>): Promise<unknown> {
  return apiFetch<unknown>('/ael/ledger/settle/reverse', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 撤銷匯總沖帳紀錄；後端會一併恢復當初同批沖帳的所有交易 */
export function reverseSummarySettle(body: Omit<ReverseSettleBody, 'companyUuid'>): Promise<unknown> {
  return apiFetch<unknown>('/ael/ledger/reconciliation/settle/reverse', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}
