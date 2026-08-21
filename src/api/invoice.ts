/**
 * 發票相關端點封裝（/ael/invoice/*）。
 */
import { apiFetch, buildQuery } from './client';

interface CheckInvoiceTrackRuleParams {
  track: string;
  year: string;
  phase: string;
}

/** 依字軌＋年＋期別檢查發票字軌是否符合當期規則（GET /ael/invoice/trackRule）；不符合規則時後端回 400 */
export function checkInvoiceTrackRule(params: CheckInvoiceTrackRuleParams): Promise<unknown> {
  return apiFetch<unknown>(`/ael/invoice/trackRule${buildQuery({ track: params.track, year: params.year, phase: params.phase })}`);
}
