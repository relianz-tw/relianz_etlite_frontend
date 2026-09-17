import { apiFetch } from '@/api/client';
import { ApiError } from '@/lib/errors';

// ==================== 扣繳稅額 ====================

export interface WithholdingPreviewRequest {
  fixedSalary: number;
  incomeCode: string;
  month: number;
  payDate: string;
  variableSalary: number;
  year: number;
}

export interface WithholdingPreviewData {
  fixedSalary: number;
  fixedSalaryTaxWithheldSum: number;
  incomeMonth: number;
  incomeYearROC: number;
  nonFixedSalaryTaxWithheldSum: number;
  paymentDay: number;
  paymentMonth: number;
  paymentYearROC: number;
  totalSalary: number;
  totalTaxWithheld: number;
  variableSalary: number;
}

export function previewWithholding(
  data: WithholdingPreviewRequest
): Promise<WithholdingPreviewData> {
  return apiFetch<WithholdingPreviewData>('/ael/onboarding/preview/withholding', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==================== 二代健保 ====================

export interface NhiPreviewRequest {
  fixedSalary: number;
  incomeCode: string;
  isNhi: boolean;
  month: number;
  nhiGradeId: number;
  variableSalary: number;
  year: number;
}

export interface NhiPreviewData {
  incomeCategory: string;
  incomeCode: string;
  incomeMonth: number;
  incomeYearROC: number;
  insuranceFee: number;
  type: string;
}

export function previewNhi(data: NhiPreviewRequest): Promise<NhiPreviewData> {
  return apiFetch<NhiPreviewData>('/ael/onboarding/preview/nhi', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 後端以 errorCode '0006' 表示「金額為 0，無需繳費」，屬正常業務結果而非錯誤 */
const NO_PAYMENT_NEEDED_CODE = '0006';

/** 檢查是否需要繳納扣繳稅額（errorCode 0006 = 金額為 0，無需繳費）
 *  fail-open：非 0006 的任何錯誤一律視為「需要繳費」，避免漏掉真正該繳款的情況 */
export async function checkWithholdingNeeded(
  data: WithholdingPreviewRequest
): Promise<boolean> {
  try {
    await previewWithholding(data);
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.errorCode === NO_PAYMENT_NEEDED_CODE) {
      return false;
    }
    return true;
  }
}

export interface NhiSupplementaryResult {
  fee: number;
  required: boolean;
}

/** 試算二代健保補充保費，errorCode 0006 視為「無需繳納」，回傳 fee=0 */
export async function previewNhiSafe(
  data: NhiPreviewRequest
): Promise<NhiSupplementaryResult> {
  try {
    const result = await previewNhi(data);
    return { fee: result.insuranceFee, required: true };
  } catch (err) {
    if (err instanceof ApiError && err.errorCode === NO_PAYMENT_NEEDED_CODE) {
      return { fee: 0, required: false };
    }
    throw err;
  }
}

/** 檢查是否需要繳納二代健保（errorCode 0006 = 金額為 0，無需繳費）
 *  fail-open：非 0006 的任何錯誤一律視為「需要繳費」 */
export async function checkNhiNeeded(data: NhiPreviewRequest): Promise<boolean> {
  try {
    await previewNhi(data);
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.errorCode === NO_PAYMENT_NEEDED_CODE) {
      return false;
    }
    return true;
  }
}
