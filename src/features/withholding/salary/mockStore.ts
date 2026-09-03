import type { CustomSalaryItem, Employee, PayrollItem, PayrollMonthDocs } from './types';

/**
 * 前端暫存假資料，僅存於記憶體，重新整理頁面會重置。
 * 待後端 API 就緒後，本檔的函式改為呼叫真實 API，呼叫端（View）的介面不需變動。
 */

let employees: Employee[] = [
  {
    id: 'e1',
    name: '王小明',
    idNumber: 'A123456789',
    jobTitle: '會計專員',
    phoneNumber: '0912345678',
    email: 'wang@example.com',
    householdAddress: '台北市中正區重慶南路一段1號',
    contactAddress: '台北市中正區重慶南路一段1號',
    nhiGradeId: 4,
    hasDependents: false,
    nhiDependents: 0,
    laborGradeId: 7,
    laborInsuranceStartDate: '2023-03-01',
    hasVoluntaryPension: false,
    voluntaryPensionRate: 0,
    laborPensionGradeId: 4,
    onboardDate: '2023-03-01',
    status: 'active',
    quitDate: '',
    isHead: false,
  },
  {
    id: 'e2',
    name: '陳雅婷',
    idNumber: 'B234567890',
    jobTitle: '業務經理',
    phoneNumber: '0922333444',
    email: 'chen@example.com',
    householdAddress: '新北市板橋區文化路二段10號',
    contactAddress: '新北市板橋區文化路二段10號',
    nhiGradeId: 6,
    hasDependents: true,
    nhiDependents: 2,
    laborGradeId: 11,
    laborInsuranceStartDate: '2021-07-15',
    hasVoluntaryPension: true,
    voluntaryPensionRate: 6,
    laborPensionGradeId: 6,
    onboardDate: '2021-07-15',
    status: 'active',
    quitDate: '',
    isHead: false,
  },
  {
    id: 'e3',
    name: '李建國',
    idNumber: 'C345678901',
    jobTitle: '負責人',
    phoneNumber: '0933444555',
    email: 'lee@example.com',
    householdAddress: '台北市大安區敦化南路一段50號',
    contactAddress: '台北市大安區敦化南路一段50號',
    nhiGradeId: 7,
    hasDependents: false,
    nhiDependents: 0,
    laborGradeId: 0,
    laborInsuranceStartDate: '',
    hasVoluntaryPension: false,
    voluntaryPensionRate: 0,
    laborPensionGradeId: 7,
    onboardDate: '2018-01-01',
    status: 'active',
    quitDate: '',
    isHead: true,
  },
];

const emptyCustomItems = (): CustomSalaryItem[] => [];

let payrollByMonth: Record<string, PayrollItem[]> = {
  '2026-1': [
    {
      employeeId: 'e1',
      name: '王小明',
      idNumber: 'A123456789',
      paymentYear: 2026,
      paymentMonth: 1,
      paymentDay: 5,
      fixedSalary: 42000,
      nonFixedSalary: 0,
      overtimePay: 1200,
      mealAllowance: 2400,
      leaveDeduction: 0,
      customItems: emptyCustomItems(),
      selfPension: 0,
      withholding: 0,
      laborEmployeeAmount: 1096,
      nhiEmployeeAmount: 812,
      secondHealthInsuranceFee: 0,
    },
    {
      employeeId: 'e2',
      name: '陳雅婷',
      idNumber: 'B234567890',
      paymentYear: 2026,
      paymentMonth: 1,
      paymentDay: 5,
      fixedSalary: 65000,
      nonFixedSalary: 5000,
      overtimePay: 0,
      mealAllowance: 2400,
      leaveDeduction: 0,
      customItems: emptyCustomItems(),
      selfPension: 4200,
      withholding: 590,
      laborEmployeeAmount: 1103,
      nhiEmployeeAmount: 1213,
      secondHealthInsuranceFee: 0,
    },
  ],
};

let nextEmployeeId = employees.length + 1;

export function listEmployees(): Employee[] {
  return employees;
}

export function getEmployee(id: string): Employee | undefined {
  return employees.find(e => e.id === id);
}

export function addEmployee(data: Omit<Employee, 'id'>): Employee {
  const employee: Employee = { ...data, id: `e${nextEmployeeId++}` };
  employees = [...employees, employee];
  return employee;
}

export function updateEmployee(id: string, data: Omit<Employee, 'id'>): void {
  employees = employees.map(e => (e.id === id ? { ...data, id } : e));
}

export function deleteEmployee(id: string): void {
  employees = employees.filter(e => e.id !== id);
}

function monthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

/** 取得指定年月的薪資明細；缺漏員工不補空列，由畫面依 listEmployees() 對照顯示「尚未新增」 */
export function getPayrollMonth(year: number, month: number): PayrollItem[] {
  return payrollByMonth[monthKey(year, month)] ?? [];
}

export function savePayrollMonth(year: number, month: number, items: PayrollItem[]): void {
  payrollByMonth = { ...payrollByMonth, [monthKey(year, month)]: items };
}

export function deletePayrollMonth(year: number, month: number): void {
  const { [monthKey(year, month)]: _removed, ...rest } = payrollByMonth;
  payrollByMonth = rest;
  const { [monthKey(year, month)]: _removedDocs, ...restDocs } = docsByMonth;
  docsByMonth = restDocs;
}

const EMPTY_DOCS: PayrollMonthDocs = {
  withholdingFiles: [],
  withholdingProofFiles: [],
  withholdingPaid: false,
  nhiFiles: [],
  nhiProofFiles: [],
  nhiPaid: false,
  nhiDeclared: false,
};

let docsByMonth: Record<string, PayrollMonthDocs> = {};

export function getPayrollMonthDocs(year: number, month: number): PayrollMonthDocs {
  return docsByMonth[monthKey(year, month)] ?? EMPTY_DOCS;
}

function updateDocs(year: number, month: number, patch: Partial<PayrollMonthDocs>): void {
  const key = monthKey(year, month);
  const current = docsByMonth[key] ?? EMPTY_DOCS;
  docsByMonth = { ...docsByMonth, [key]: { ...current, ...patch } };
}

export { updateDocs as updatePayrollMonthDocs };
