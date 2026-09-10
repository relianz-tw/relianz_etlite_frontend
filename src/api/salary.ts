/**
 * 薪資明細相關端點封裝（/ael/salary/*，見 Apifox EasyTax_Lite 專案「薪資」分類）。
 * 自動帶入 companyUuid，呼叫端不需重複組裝。
 *
 * ⚠️ 年制對照（詳見 types.ts 薪資明細區塊開頭註解）：
 *   fetchSalaryMonth／fetchSalaryDeclareMonth／calculateSalaryInsurance／calculateSalaryOther／
 *   fetchAllSalary／calculateSalaryRateValue 全部收西元年、直接送出不換算
 *   （2026-09-10 後端已將 allsalary 的 year、calculateSalaryRateValue 的 paymentYear 皆由民國改為西元，
 *   已實測確認：後者傳民國值會被拒絕，回 errorCode 0003）；
 *   saveSalaryRow 的 year／paymentYear 皆已確認西元（見 SaveSalaryBody 註解）；
 *   generateWithholdingDocument／generateHealthInsuranceDocument／generateParttimeDocument／
 *   fetchSalaryDocuments 這幾支繳款書端點對外一樣只收西元年，但後端本身仍收民國，函式內部用
 *   toRocYear() 換算（尚未跟上西元化）。
 */
import { apiFetch, apiFetchEnvelope, buildQuery } from './client';
import { COMPANY_UUID } from './config';
import type {
  AllSalaryResult,
  AllSalarySummaryDto,
  DeleteSalaryResult,
  GenerateHealthInsuranceDocumentBody,
  GenerateParttimeDocumentBody,
  GenerateSalaryDocumentResult,
  GenerateWithholdingDocumentBody,
  SalaryDeclareMonthResult,
  SalaryDocumentDto,
  SalaryDocumentType,
  SalaryInsuranceCalcBody,
  SalaryInsuranceCalcResult,
  SalaryMonthResult,
  SalaryOtherCalcBody,
  SalaryOtherCalcResult,
  SalaryRateValueBody,
  SalaryRateValueResult,
  SalaryRowDto,
  SaveSalaryBody,
  SaveSalaryResult,
} from './types';

/** 繳款書系列端點（download/*、GET|DELETE /ael/salary/pdf）目前仍收民國年，對外統一收西元、這裡轉換 */
const toRocYear = (year: number) => year - 1911;

/**
 * 瀏覽單月薪資（GET /ael/salary，西元年月）。
 * ⚠️ pagination 與 data 同級（不在 data 內，比照 GET /ael/employee），改用 apiFetchEnvelope 取整個信封物件。
 */
export async function fetchSalaryMonth(params: { year: number; month: number }): Promise<SalaryMonthResult> {
  const envelope = await apiFetchEnvelope<{
    success: boolean;
    data: Record<string, SalaryRowDto[]> | null;
    errorCode: string;
    errorcode?: string;
    message: string;
    pagination: SalaryMonthResult['pagination'];
  }>(`/ael/salary${buildQuery({ companyUuid: COMPANY_UUID, ...params })}`);
  return { byPaymentDate: envelope.data ?? {}, pagination: envelope.pagination };
}

/** Upsert 單筆薪資列（POST /ael/salary） */
export function saveSalaryRow(body: Omit<SaveSalaryBody, 'companyUuid'>): Promise<SaveSalaryResult> {
  return apiFetch<SaveSalaryResult>('/ael/salary', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 刪除單筆薪資列（DELETE /ael/salary）；id 為單筆薪資列主鍵，不是整月 */
export function deleteSalaryRow(id: number): Promise<DeleteSalaryResult> {
  return apiFetch<DeleteSalaryResult>(`/ael/salary${buildQuery({ id })}`, { method: 'DELETE' });
}

/** 單月四個統計數字，由後端計算完成（GET /ael/salary/declare/month，西元年月） */
export function fetchSalaryDeclareMonth(params: { year: number; month: number }): Promise<SalaryDeclareMonthResult> {
  return apiFetch<SalaryDeclareMonthResult>(`/ael/salary/declare/month${buildQuery({ companyUuid: COMPANY_UUID, ...params })}`);
}

/**
 * 年度薪資明細與彙總（GET /ael/salary/allsalary，西元年）。
 * ⚠️ 2026-09-10 後端已將 `year` 參數由民國改為西元，已實測確認（傳西元年才查得到資料）；
 * ⚠️ summary 與 data 同級（實測驗證），改用 apiFetchEnvelope 取整個信封物件。
 */
export async function fetchAllSalary(year: number): Promise<AllSalaryResult> {
  const envelope = await apiFetchEnvelope<{
    success: boolean;
    data: Record<string, Record<string, SalaryRowDto[]>> | null;
    errorCode: string;
    errorcode?: string;
    message: string;
    summary: AllSalarySummaryDto;
  }>(`/ael/salary/allsalary${buildQuery({ companyUuid: COMPANY_UUID, year })}`);
  return { byMonth: envelope.data ?? {}, summary: envelope.summary };
}

/** 試算勞保費／健保費／勞退自提預設值（POST /ael/salary/calculate/insurance） */
export function calculateSalaryInsurance(body: Omit<SalaryInsuranceCalcBody, 'companyUuid'>): Promise<SalaryInsuranceCalcResult> {
  return apiFetch<SalaryInsuranceCalcResult>('/ael/salary/calculate/insurance', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 試算二代健保金額與扣繳稅（POST /ael/salary/calculate/other） */
export function calculateSalaryOther(body: Omit<SalaryOtherCalcBody, 'companyUuid'>): Promise<SalaryOtherCalcResult> {
  return apiFetch<SalaryOtherCalcResult>('/ael/salary/calculate/other', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/**
 * 查詢扣繳／二代健保費率（POST /ael/salary/calculate/rateValue）。
 * ⚠️ 本期主線未呼叫（calculate/other 已內含費率試算），先封裝備用。
 */
export function calculateSalaryRateValue(body: SalaryRateValueBody): Promise<SalaryRateValueResult> {
  return apiFetch<SalaryRateValueResult>('/ael/salary/calculate/rateValue', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** 產生薪資所得扣繳稅額繳款書（POST /ael/salary/insurance/download/rateValue，年制：民國，此函式對外收西元） */
export function generateWithholdingDocument(body: GenerateWithholdingDocumentBody): Promise<GenerateSalaryDocumentResult> {
  return apiFetch<GenerateSalaryDocumentResult>('/ael/salary/insurance/download/rateValue', {
    method: 'POST',
    body: JSON.stringify({
      acUuid: COMPANY_UUID,
      incomeYear: toRocYear(body.incomeYear),
      incomeMonth: body.incomeMonth,
      paymentYear: toRocYear(body.paymentYear),
      paymentMonth: body.paymentMonth,
      paymentDay: body.paymentDay,
      isOverDeadline: body.isOverDeadline,
    }),
  });
}

/** 產生二代健保繳款書（POST /ael/salary/insurance/download/healthInsurance，年制：民國，此函式對外收西元） */
export function generateHealthInsuranceDocument(body: GenerateHealthInsuranceDocumentBody): Promise<GenerateSalaryDocumentResult> {
  return apiFetch<GenerateSalaryDocumentResult>('/ael/salary/insurance/download/healthInsurance', {
    method: 'POST',
    body: JSON.stringify({
      acUuid: COMPANY_UUID,
      supplementaryInsuranceFee: body.supplementaryInsuranceFee,
      year: toRocYear(body.year),
      month: body.month,
    }),
  });
}

/** 產生兼職所得二代健保繳款書（POST /ael/salary/insurance/download/parttime，年制：民國，此函式對外收西元） */
export function generateParttimeDocument(body: GenerateParttimeDocumentBody): Promise<GenerateSalaryDocumentResult> {
  return apiFetch<GenerateSalaryDocumentResult>('/ael/salary/insurance/download/parttime', {
    method: 'POST',
    body: JSON.stringify({
      acUuid: COMPANY_UUID,
      year: toRocYear(body.year),
      month: body.month,
      salary: body.salary,
    }),
  });
}

/** 取得公司該年該月已產生的繳款書（GET /ael/salary/pdf，年制：民國，此函式對外收西元） */
export async function fetchSalaryDocuments(params: { type: SalaryDocumentType; year: number; month: number }): Promise<SalaryDocumentDto[]> {
  const data = await apiFetch<SalaryDocumentDto[] | null>(
    `/ael/salary/pdf${buildQuery({ acUuid: COMPANY_UUID, type: params.type, year: toRocYear(params.year), month: params.month })}`,
  );
  return data ?? [];
}

/** 刪除已產生的繳款書（DELETE /ael/salary/pdf） */
export function deleteSalaryDocument(pdfUuid: string): Promise<void> {
  return apiFetch<void>(`/ael/salary/pdf${buildQuery({ pdfUuid })}`, { method: 'DELETE' });
}
