import { apiFetch } from '@/api/client';

export interface Industry {
  id: number;
  industryName: string;
  netProfitRate: number;
  defaultRevenue: number;
  costExpenseRate: number;
  employeeSalaryRate: number;
  expandedAuditProfitRate: number;
}

/** 取得所有行業類別及其預設營業額與淨利率 */
export function getTaxIndustries(): Promise<Industry[]> {
  return apiFetch<Industry[]>('/ael/onboarding/tax/industries');
}
