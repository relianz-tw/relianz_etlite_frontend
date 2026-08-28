/**
 * 營業稅中心端點封裝（/ael/vat/*，見 api.md「營業稅中心」章節）。
 * 自動帶入 companyUuid，呼叫端（BusinessTaxView）不需重複組裝。
 */
import { apiFetch, buildQuery } from './client';
import { COMPANY_UUID } from './config';
import type { VatInvoiceFilterBody, VatInvoiceFilterResult, VatPeriodSummaryDto } from './types';

/** 指定期別進項發票列表（POST /ael/vat/input/filter） */
export function fetchVatInputInvoices(filter: Omit<VatInvoiceFilterBody, 'companyUuid'>): Promise<VatInvoiceFilterResult> {
  return apiFetch<VatInvoiceFilterResult>('/ael/vat/input/filter', {
    method: 'POST',
    body: JSON.stringify({ ...filter, companyUuid: COMPANY_UUID }),
  });
}

/** 指定期別銷項發票列表（POST /ael/vat/output/filter） */
export function fetchVatOutputInvoices(filter: Omit<VatInvoiceFilterBody, 'companyUuid'>): Promise<VatInvoiceFilterResult> {
  return apiFetch<VatInvoiceFilterResult>('/ael/vat/output/filter', {
    method: 'POST',
    body: JSON.stringify({ ...filter, companyUuid: COMPANY_UUID }),
  });
}

/** 計算本期銷／進發票金額與應納營業稅（GET /ael/vat/periodSummary） */
export function fetchVatPeriodSummary(params: { cmsYear: number; cmsPhase: number }): Promise<VatPeriodSummaryDto> {
  return apiFetch<VatPeriodSummaryDto>(`/ael/vat/periodSummary${buildQuery({ companyUuid: COMPANY_UUID, ...params })}`);
}
