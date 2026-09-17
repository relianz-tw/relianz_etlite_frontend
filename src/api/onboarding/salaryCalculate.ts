import { apiFetch } from '@/api/client';

export interface SalaryCalculateRequest {
  fixedSalary: number;
  laborLevelId: number;
  nhiDependents: number;
  nhiLevelId: number;
  payDate: string;
  variableSalary: number;
  voluntaryPensionId: number;
  voluntaryPensionRate: number;
}

export interface SalaryCalculateResponse {
  withholding: number;
  laborInsurance: {
    companyAmount: number;
    employeeAmount: number;
  };
  healthInsurance: {
    companyAmount: number;
    employeeAmount: number;
    governmentAmount: number;
  };
  volPension: number;
}

/** 計算薪資扣繳與勞健保費用 */
export function calculateSalary(
  data: SalaryCalculateRequest
): Promise<SalaryCalculateResponse> {
  return apiFetch<SalaryCalculateResponse>('/ael/onboarding/salary/calculate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
