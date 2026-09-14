/**
 * 公司行號負擔二代健保相關端點封裝（/ael/withholding/insurance/burdenSummary、
 * /ael/withholding/healthInsurance/*，見 Apifox EasyTax_Lite 專案「各類扣繳/公司負擔二代健保」分類）。
 * 自動帶入 companyUuid，呼叫端不需重複組裝。
 *
 * ⚠️ 年制：全部收民國年（x-apidog 範例值皆為民國，如 114/3），對外統一收西元、這裡用 toRocYear() 換算，
 * 比照 salary.ts 的 generateHealthInsuranceDocument。
 *
 * 2026-09-14 後端補齊「應繳納」計算與繳款書端點，本模組現涵蓋投保總額存取＋差額計算＋繳款書產生／查詢。
 * 另有 GET /ael/withholding/healthInsurance/calculate（計算全年彙總）本次未串接——目前畫面沒有對應的
 * 年度彙總區塊可用它，且此端點回應**不符合**全站固定信封格式（無 data／errorCode，欄位直接攤平在最外層，
 * 見下方型別註解），刻意先不接，待有實際 UI 需求再處理。
 */
import { ApiError } from '@/lib/errors';
import { apiFetch, buildQuery } from './client';
import { COMPANY_UUID } from './config';
import type {
  GenerateNhiBurdenPdfBody,
  NhiBurdenCalculateResult,
  NhiBurdenPdfDto,
  NhiBurdenPdfUrlDto,
  NhiBurdenSummaryDto,
  SaveNhiBurdenSummaryBody,
} from './types';

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

/**
 * 計算並新增當月公司負擔差額（POST /ael/withholding/healthInsurance/calculate/month，對外收西元年）。
 * 回傳 calculateMonthlyRemain 即畫面「應繳納」金額；呼叫端應在已設定投保總額（fetchNhiBurdenSummary
 * 有回傳值）時才呼叫，未設定時打這支語意不明，未實測過行為。
 */
export function calculateNhiBurdenMonth(params: { year: number; month: number }): Promise<NhiBurdenCalculateResult> {
  return apiFetch<NhiBurdenCalculateResult>('/ael/withholding/healthInsurance/calculate/month', {
    method: 'POST',
    body: JSON.stringify({ companyUuid: COMPANY_UUID, year: toRocYear(params.year), month: params.month }),
  });
}

/**
 * 查詢已產生的公司負擔二代健保繳費書 URL（GET /ael/withholding/healthInsurance/company/pdf，對外收西元年）。
 * ⚠️ 尚未產生過時的回應形態未實測確認，比照 fetchNhiBurdenSummary 的處理方式：非 'F' 開頭的業務錯誤碼
 * 一律視為「尚未產生」回傳 null，不視為錯誤。
 */
export async function fetchNhiBurdenPdfUrl(params: { year: number; month: number }): Promise<string | null> {
  try {
    const result = await apiFetch<NhiBurdenPdfUrlDto | null>(
      `/ael/withholding/healthInsurance/company/pdf${buildQuery({ acUuid: COMPANY_UUID, year: toRocYear(params.year), month: params.month })}`,
    );
    return result?.pdf_url ?? null;
  } catch (err) {
    if (err instanceof ApiError && !err.errorCode.startsWith('F')) return null;
    throw err;
  }
}

/**
 * 產生公司負擔二代健保繳費書（POST /ael/withholding/download/healthInsurance/company/pdf，對外收西元年）。
 * ⚠️ 後端會驗證 amount 須 >0 且等於當次 calculateNhiBurdenMonth 算出的 calculateMonthlyRemain，
 * 呼叫端需自行確保帶入的金額是最新試算結果，不要用畫面上可能過期的快取值。
 */
export function generateNhiBurdenPdf(body: GenerateNhiBurdenPdfBody): Promise<NhiBurdenPdfDto> {
  return apiFetch<NhiBurdenPdfDto>('/ael/withholding/download/healthInsurance/company/pdf', {
    method: 'POST',
    body: JSON.stringify({ acUuid: COMPANY_UUID, year: toRocYear(body.year), month: body.month, amount: body.amount }),
  });
}
