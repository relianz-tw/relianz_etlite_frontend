/**
 * 公司行號負擔二代健保相關端點封裝（/ael/withholding/insurance/burdenSummary，
 * 見 Apifox EasyTax_Lite 專案「各類扣繳/公司負擔二代健保」分類）。
 * 自動帶入 companyUuid，呼叫端不需重複組裝。
 *
 * ⚠️ 年制：三支皆收民國年（x-apidog 範例值皆為民國，如 114/3），對外統一收西元、這裡用 toRocYear() 換算，
 * 比照 salary.ts 的 generateHealthInsuranceDocument。
 *
 * ⚠️ 本模組目前只負責「受僱者投保金額總額」的存取，不含「應繳納」金額計算——
 * 後端尚未提供對應計算 API（姊妹專案 relianz_cashflow_frontend 對應的是
 * ac/withholding/healthInsurance/calculate/month，此專案尚無此端點），見
 * project_pending_backend_features 備忘。
 */
import { ApiError } from '@/lib/errors';
import { apiFetch, buildQuery } from './client';
import { COMPANY_UUID } from './config';
import type { NhiBurdenSummaryDto, SaveNhiBurdenSummaryBody } from './types';

const toRocYear = (year: number) => year - 1911;

/**
 * 查詢單月受僱者投保金額總額（GET /ael/withholding/insurance/burdenSummary，對外收西元年）。
 * ⚠️ 該月尚未設定時的回應形態尚未實測確認，此處假設後端會以業務錯誤碼（非 '0000'）回應，
 * 一律視為「查無資料」回傳 null，不視為錯誤；若實測發現後端其實回 success:true/data:null，
 * apiFetch 會直接回傳 null，此函式行為不受影響。
 * 僅吞掉後端業務錯誤碼，網路失敗／回應非 JSON（'F' 開頭的前端自產碼）仍視為真正錯誤往外拋，
 * 避免斷網時被誤判成「尚未設定」。
 */
export async function fetchNhiBurdenSummary(params: { year: number; month: number }): Promise<NhiBurdenSummaryDto | null> {
  try {
    const result = await apiFetch<NhiBurdenSummaryDto | null>(
      `/ael/withholding/insurance/burdenSummary${buildQuery({ companyUuid: COMPANY_UUID, year: toRocYear(params.year), month: params.month })}`,
    );
    return result ?? null;
  } catch (err) {
    if (err instanceof ApiError && !err.errorCode.startsWith('F')) return null;
    throw err;
  }
}

/** 新增或更新單月受僱者投保金額總額（POST /ael/withholding/insurance/burdenSummary，對外收西元年） */
export function saveNhiBurdenSummary(body: SaveNhiBurdenSummaryBody): Promise<void> {
  return apiFetch<void>('/ael/withholding/insurance/burdenSummary', {
    method: 'POST',
    body: JSON.stringify({
      companyUuid: COMPANY_UUID,
      year: toRocYear(body.year),
      month: body.month,
      totalInsuredAmount: body.totalInsuredAmount,
    }),
  });
}

/** 依 uuid 刪除一筆公司負擔二代健保總額（DELETE /ael/withholding/insurance/burdenSummary） */
export function deleteNhiBurdenSummary(nhiBurdenSummaryUuid: string): Promise<void> {
  return apiFetch<void>(`/ael/withholding/insurance/burdenSummary${buildQuery({ nhiBurdenSummaryUuid })}`, { method: 'DELETE' });
}
