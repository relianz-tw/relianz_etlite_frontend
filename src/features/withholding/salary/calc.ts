import type { PayrollItem, PayrollMonthSummary } from './types';

/** PayrollItem 的給薪年月日欄位 → Date，供 DatePicker 顯示（缺值回傳 undefined） */
export function paymentDateOf(item: PayrollItem): Date | undefined {
  if (!item.paymentYear || !item.paymentMonth || !item.paymentDay) return undefined;
  return new Date(item.paymentYear, item.paymentMonth - 1, item.paymentDay);
}

/** DatePicker 選取結果 → 回填 PayrollItem 的給薪年月日欄位 */
export function withPaymentDate(item: PayrollItem, date: Date | undefined): PayrollItem {
  if (!date) return { ...item, paymentYear: undefined, paymentMonth: undefined, paymentDay: undefined };
  return { ...item, paymentYear: date.getFullYear(), paymentMonth: date.getMonth() + 1, paymentDay: date.getDate() };
}

/** 單一員工單月應付薪資：加項合計 − 減項合計（純前端算術，不需後端） */
export function calculatePayable(item: PayrollItem): number {
  const additions =
    item.fixedSalary +
    item.nonFixedSalary +
    item.overtimePay +
    item.mealAllowance +
    item.customItems.filter(c => !c.isDeduction).reduce((sum, c) => sum + c.amount, 0);
  const deductions =
    item.leaveDeduction +
    item.selfPension +
    item.withholding +
    item.laborEmployeeAmount +
    item.nhiEmployeeAmount +
    item.secondHealthInsuranceFee +
    item.customItems.filter(c => c.isDeduction).reduce((sum, c) => sum + c.amount, 0);
  return additions - deductions;
}

/** 月份彙總卡片用的四個統計數字，計算方式沿用原版公式說明文字 */
export function summarizeMonth(items: PayrollItem[]): PayrollMonthSummary {
  let declareSalaryTotal = 0;
  let fixedSalaryTotal = 0;
  let nonFixedSalaryTotal = 0;
  let payableSalaryTotal = 0;

  for (const item of items) {
    const customAdditions = item.customItems.filter(c => !c.isDeduction).reduce((sum, c) => sum + c.amount, 0);
    const customDeductions = item.customItems.filter(c => c.isDeduction).reduce((sum, c) => sum + c.amount, 0);

    // 申報薪資總額：固定＋非固定＋自訂加項－請假－勞退自提－自訂減項
    declareSalaryTotal += item.fixedSalary + item.nonFixedSalary + customAdditions - item.leaveDeduction - item.selfPension - customDeductions;
    // 固定薪資總計：固定薪資－請假
    fixedSalaryTotal += item.fixedSalary - item.leaveDeduction;
    // 非固定薪資總計：非固定薪資
    nonFixedSalaryTotal += item.nonFixedSalary;
    // 應付薪資總計：calculatePayable 的總和
    payableSalaryTotal += calculatePayable(item);
  }

  return { declareSalaryTotal, fixedSalaryTotal, nonFixedSalaryTotal, payableSalaryTotal };
}
