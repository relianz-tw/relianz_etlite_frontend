import type { MockFile } from '../components/mockFile';

/** 員工在職狀態 */
export type EmploymentStatus = 'active' | 'inactive';

/** 員工投保級距（健保／勞保／勞退，皆為同一結構的假資料表） */
export interface InsuranceGrade {
  id: number;
  /** 0 代表「無投保」 */
  grade: number;
  salaryMin: number;
  salaryMax: number | null;
}

export interface Employee {
  id: string;
  name: string;
  idNumber: string;
  jobTitle: string;
  phoneNumber: string;
  email: string;
  householdAddress: string;
  contactAddress: string;
  /** 健保投保級距 id（對應 NHI_GRADES） */
  nhiGradeId: number;
  hasDependents: boolean;
  nhiDependents: number;
  /** 勞保投保級距 id（對應 LABOR_GRADES） */
  laborGradeId: number;
  laborInsuranceStartDate: string;
  hasVoluntaryPension: boolean;
  voluntaryPensionRate: number;
  /** 勞退月提投保級距 id（對應 LABOR_PENSION_GRADES） */
  laborPensionGradeId: number;
  onboardDate: string;
  status: EmploymentStatus;
  quitDate: string;
  isHead: boolean;
}

/** 薪資項目自訂欄位（加項／減項） */
export interface CustomSalaryItem {
  id: string;
  name: string;
  amount: number;
  isDeduction: boolean;
}

/** 單一員工單月的薪資明細列 */
export interface PayrollItem {
  employeeId: string;
  name: string;
  idNumber: string;
  paymentYear?: number;
  paymentMonth?: number;
  paymentDay?: number;
  fixedSalary: number;
  nonFixedSalary: number;
  overtimePay: number;
  mealAllowance: number;
  leaveDeduction: number;
  customItems: CustomSalaryItem[];
  /** 以下欄位原為後端試算結果，無後端時改為可手動輸入的欄位（見計畫說明） */
  selfPension: number;
  withholding: number;
  laborEmployeeAmount: number;
  nhiEmployeeAmount: number;
  secondHealthInsuranceFee: number;
}

/** 單一年月的薪資明細彙總（申報薪資總額／應付薪資總計／固定／非固定） */
export interface PayrollMonthSummary {
  declareSalaryTotal: number;
  fixedSalaryTotal: number;
  nonFixedSalaryTotal: number;
  payableSalaryTotal: number;
}

/** 單一年月的繳款書／申報狀態（模擬檔案，見 mockFile.ts） */
export interface PayrollMonthDocs {
  withholdingFiles: MockFile[];
  withholdingProofFiles: MockFile[];
  withholdingPaid: boolean;
  nhiFiles: MockFile[];
  nhiProofFiles: MockFile[];
  nhiPaid: boolean;
  nhiDeclared: boolean;
}
