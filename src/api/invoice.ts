/**
 * 發票相關端點封裝（/ael/invoice/*）。
 */
import { apiFetch, buildQuery } from './client';
import { COMPANY_UUID } from './config';
import type { InvoiceIdentificationDto } from './types';

interface CheckInvoiceTrackRuleParams {
  track: string;
  year: string;
  phase: string;
}

/** 依字軌＋年＋期別檢查發票字軌是否符合當期規則（GET /ael/invoice/trackRule）；不符合規則時後端回 400 */
export function checkInvoiceTrackRule(params: CheckInvoiceTrackRuleParams): Promise<unknown> {
  return apiFetch<unknown>(`/ael/invoice/trackRule${buildQuery({ track: params.track, year: params.year, phase: params.phase })}`);
}

/**
 * 單張發票 Gemini 結構化辨識（POST /ael/invoice/identification/one）。
 * 新增交易頁上傳憑證照片後呼叫，回傳的欄位用於自動帶入表單。
 * ⚠️ 此端點的公司參數為 snake_case 的 ac_uuid，與其他端點慣用的 companyUuid 不同（依 api.md 記載）。
 */
export function identifyInvoiceOne(params: { file: File; isBuy: boolean }): Promise<InvoiceIdentificationDto> {
  const formData = new FormData();
  formData.append('ac_uuid', COMPANY_UUID);
  formData.append('isbuy', String(params.isBuy));
  formData.append('file', params.file);
  return apiFetch<InvoiceIdentificationDto>('/ael/invoice/identification/one', {
    method: 'POST',
    body: formData,
  });
}
