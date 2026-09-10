/** 員工在職狀態 */
export type EmploymentStatus = 'active' | 'inactive';

/** 畫面用員工資料，由 EmployeeDto 轉換而來（見 data.ts mapEmployeeDto），id 對齊後端改為 number */
export interface Employee {
  id: number;
  name: string;
  idNumber: string;
  jobTitle: string;
  phoneNumber: string;
  email: string;
  /** 身分證正面，GCS object path */
  idCardFront: string;
  /** 身分證反面，GCS object path */
  idCardBack: string;
  householdAddress: string;
  contactAddress: string;
  /** 健保投保級距 id；null＝無投保 */
  nhiLevelId: number | null;
  nhiDependents: number;
  /** 勞保投保級距 id；null＝無投保 */
  laborLevelId: number | null;
  /** YYYY-MM-DD；無投保時為空字串 */
  laborInsuranceStartDate: string;
  voluntaryPensionRate: number;
  /** 勞退月提投保級距 id；null＝無自提 */
  laborPensionLevelId: number | null;
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
  employeeId: number;
  name: string;
  idNumber: string;
  /** 健保投保級距 id；null＝無投保。用於判斷是否為「兼職」（無投保，見 data.ts isNhiUninsured） */
  nhiLevelId: number | null;
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
