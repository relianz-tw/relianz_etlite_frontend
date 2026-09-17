import { apiFetch } from '@/api/client';

export interface TaxEstimateRequest {
  costAndExpense: number;
  employeeSalary: number;
  expandedAuditProfitRate: number;
  industryIncomeId: number;
  isAdvanced: boolean;
  netProfitRate: number;
  otherExpense: number;
  personalRent: number;
  revenue: number;
  [property: string]: any;
}

export interface TaxEstimateResponse {
  biPhaselyBusinessTax: { amount: number };
  annualIncomeTax: {
    bookReview: { amount: number };
    documentReview: { amount: number };
  };
}

/** 預估應納稅金（簡易/進階模式統一使用此 API）*/
export function estimateTax(
  data: TaxEstimateRequest
): Promise<TaxEstimateResponse> {
  return apiFetch<TaxEstimateResponse>('/ael/onboarding/tax/estimate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
