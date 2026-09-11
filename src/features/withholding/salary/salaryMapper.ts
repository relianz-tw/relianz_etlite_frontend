import type { SalaryRowDto } from '@/api/types';
import type { CustomSalaryItem, Employee, PayrollItem } from './types';

/** 依序嘗試多種可能欄位名，取不到回傳 undefined（不是 0）；數字可為 number 或可完整 parse 的字串 */
function pickNumber(row: SalaryRowDto, ...aliases: string[]): number | undefined {
  for (const key of aliases) {
    const value = row[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function pickString(row: SalaryRowDto, ...aliases: string[]): string | undefined {
  for (const key of aliases) {
    const value = row[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return undefined;
}

type AmountField = 'fixedSalary' | 'nonFixedSalary' | 'overtimePay' | 'mealAllowance' | 'leaveDeduction' | 'selfPension' | 'withholding' | 'secondHealthInsuranceFee';

/**
 * 前端 PayrollItem 金額欄位 ↔ 後端別名對照（camelCase／snake_case 皆嘗試）。
 * laborEmployeeAmount／nhiEmployeeAmount 因後端 GET 回應同時存在「POST 存入的原值」與「依員工目前
 * 投保級距即時算出的參考值」兩種同義欄位（實測 + 比對姊妹專案 EASYTAX 規格確認），不放在此表內，
 * 另外於 mapSalaryRowsToPayrollItems 特別處理。
 */
const FIELD_ALIASES: { key: AmountField; aliases: string[]; label: string }[] = [
  { key: 'fixedSalary', aliases: ['fixedSalary', 'fixed_salary'], label: '固定薪資' },
  { key: 'nonFixedSalary', aliases: ['nonFixedSalary', 'non_fixed_salary'], label: '非固定薪資' },
  { key: 'overtimePay', aliases: ['overtimePay', 'overtime_pay'], label: '免稅加班費' },
  { key: 'mealAllowance', aliases: ['mealAllowance', 'meal_allowance'], label: '免稅伙食費' },
  { key: 'leaveDeduction', aliases: ['attendanceDeduction', 'attendance_deduction'], label: '請假/遲到/早退' },
  { key: 'selfPension', aliases: ['volPension', 'vol_pension', 'voluntaryPensionAmount', 'voluntary_pension_amount'], label: '勞退自提' },
  { key: 'withholding', aliases: ['taxWithheld', 'tax_withheld'], label: '薪資扣繳稅款' },
  { key: 'secondHealthInsuranceFee', aliases: ['secondHealthInsuranceFee', 'second_health_insurance_fee'], label: '二代健保' },
];

/**
 * 前端 PayrollItem 金額欄位 ↔ 後端「POST 存入原值」欄位 ↔「依員工目前級距即時算出」的參考欄位，優先序：前者。
 * 後端已確認此優先序方向正確（2026-09-11）：healthInsurance 為員工負擔（負責人另內含公司＋政府份），
 * nhiEmployeeAmount 僅 EmployeeAmount×(眷屬+1)、不含公司/政府份，兩者語意不同不能互換，
 * 負責人的話兩欄可能不一致，一律以 healthInsurance（存檔試算值）為準。
 */
const DUAL_SOURCE_FIELDS: { key: 'laborEmployeeAmount' | 'nhiEmployeeAmount'; primary: string[]; fallback: string[]; label: string }[] = [
  { key: 'laborEmployeeAmount', primary: ['laborInsurance', 'labor_insurance'], fallback: ['laborEmployeeAmount', 'labor_employee_amount'], label: '勞保費(員工)' },
  { key: 'nhiEmployeeAmount', primary: ['healthInsurance', 'health_insurance'], fallback: ['nhiEmployeeAmount', 'nhi_employee_amount'], label: '健保費(員工)' },
];

/** 後端 extraFields 格式：{ 項目名稱: { addSub: '+'|'-', value: number } } → 畫面用 CustomSalaryItem[] */
function parseExtraFields(row: SalaryRowDto): CustomSalaryItem[] {
  const raw = row['extraFields'];
  if (!raw || typeof raw !== 'object') return [];
  return Object.entries(raw as Record<string, unknown>).map(([name, entry], index) => {
    const e = (entry ?? {}) as { addSub?: unknown; value?: unknown };
    const amount = typeof e.value === 'number' && Number.isFinite(e.value) ? e.value : Number(e.value) || 0;
    return { id: `extra-${index}-${name}`, name, amount, isDeduction: e.addSub === '-' };
  });
}

const DATE_KEY_PATTERN = /^\d{8}$/;

function parsePaymentDateKey(key: string): { paymentYear: number; paymentMonth: number; paymentDay: number } | undefined {
  if (!DATE_KEY_PATTERN.test(key)) return undefined;
  const paymentYear = Number(key.slice(0, 4));
  const paymentMonth = Number(key.slice(4, 6));
  const paymentDay = Number(key.slice(6, 8));
  if (paymentMonth < 1 || paymentMonth > 12 || paymentDay < 1 || paymentDay > 31) return undefined;
  return { paymentYear, paymentMonth, paymentDay };
}

export interface MapSalaryRowsResult {
  items: PayrollItem[];
  /** employeeId → 取不到值、已以 0 顯示的欄位中文名清單 */
  missingFieldsByEmployee: Map<number, string[]>;
  /** 需留意的資料落差（如 laborInsurance／laborEmployeeAmount 不一致、無法辨識的給付日 key），供 dev 環境提示用 */
  unmappedKeys: string[];
  /** 連 employeeId 都取不到而整列丟棄的筆數 */
  droppedRowCount: number;
}

/**
 * 將 GET /ael/salary 的 { 給付日YYYYMMDD: SalaryRowDto[] } 攤平成畫面用 PayrollItem[]。
 * 內層 schema 雖已正式文件化（見 SalaryRowDto 型別註解），仍維持防禦性別名探測，避免日後欄位命名
 * 再變動時整批壞掉（本次的 id→uuid 主鍵變更就是活生生的例子）：
 * - 取不到的金額欄位仍以 0 填入（滿足 PayrollItem 型別必填），但同時記錄在 missingFieldsByEmployee，
 *   事實不被隱藏，交由呼叫端在畫面上提示。
 * - name／idNumber 一律以 employeeId 對照在職員工清單取得，不直接信任 row 內容（row 雖然現在也帶員工
 *   快照欄位，但可能是建立當下的舊值）；對照不到時視為已離職員工，仍保留該列並標記。
 */
export function mapSalaryRowsToPayrollItems(byPaymentDate: Record<string, SalaryRowDto[]>, activeEmployees: Employee[]): MapSalaryRowsResult {
  const employeeById = new Map(activeEmployees.map(e => [e.id, e]));
  const missingFieldsByEmployee = new Map<number, string[]>();
  const unmappedKeys = new Set<string>();
  let droppedRowCount = 0;
  const items: PayrollItem[] = [];

  for (const [dateKey, rows] of Object.entries(byPaymentDate)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;
    // 實測證實：'00000000' 底下是後端為「該月尚無薪資列的員工」自動產生的佔位列（id 為 null、金額多為 0，
    // 但仍會回傳員工快照欄位），並非真實薪資資料，整組略過，避免被誤判為「已有薪資列」而鎖住試算欄位
    if (dateKey === '00000000') continue;

    const dateParts = parsePaymentDateKey(dateKey);
    if (!dateParts) {
      unmappedKeys.add(`無法辨識的給付日 key：${dateKey}`);
    }

    for (const row of rows) {
      const employeeId = pickNumber(row, 'employeeId', 'employee_id');
      if (employeeId === undefined) {
        droppedRowCount += 1;
        continue;
      }

      const missing: string[] = [];
      const values = {} as Record<AmountField, number>;
      for (const field of FIELD_ALIASES) {
        const value = pickNumber(row, ...field.aliases);
        if (value === undefined) missing.push(field.label);
        values[field.key] = value ?? 0;
      }

      // 實測證實：GET 回應會將 POST /ael/salary 送出的欄位原樣存回（如 laborInsurance／healthInsurance），
      // laborEmployeeAmount／nhiEmployeeAmount 則是依員工「目前」投保級距即時算出的參考值，即使無真實
      // 薪資列也會有值（見上方 '00000000' 佔位列的實測）。故優先採用 POST 原值欄位，避免員工級距異動後
      // 歷史資料被覆蓋。
      const dualSourceValues = {} as Record<'laborEmployeeAmount' | 'nhiEmployeeAmount', number>;
      for (const field of DUAL_SOURCE_FIELDS) {
        const primaryRaw = pickNumber(row, ...field.primary);
        const fallbackRaw = pickNumber(row, ...field.fallback);
        const value = primaryRaw ?? fallbackRaw;
        if (value === undefined) missing.push(field.label);
        dualSourceValues[field.key] = value ?? 0;
        if (primaryRaw !== undefined && fallbackRaw !== undefined && primaryRaw !== fallbackRaw) {
          unmappedKeys.add(`${field.primary[0]} 與 ${field.fallback[0]} 同時存在且不相等`);
        }
      }

      const employee = employeeById.get(employeeId);
      const rowName = pickString(row, 'employee_name', 'employeeName', 'name');
      const name = employee ? employee.name : rowName ? `${rowName}（已離職）` : `員工 #${employeeId}（已離職）`;
      const idNumber = employee?.idNumber ?? '';

      if (missing.length > 0) missingFieldsByEmployee.set(employeeId, missing);

      items.push({
        employeeId,
        name,
        idNumber,
        nhiLevelId: employee?.nhiLevelId ?? null,
        paymentYear: dateParts?.paymentYear,
        paymentMonth: dateParts?.paymentMonth,
        paymentDay: dateParts?.paymentDay,
        fixedSalary: values.fixedSalary,
        nonFixedSalary: values.nonFixedSalary,
        overtimePay: values.overtimePay,
        mealAllowance: values.mealAllowance,
        leaveDeduction: values.leaveDeduction,
        selfPension: values.selfPension,
        withholding: values.withholding,
        laborEmployeeAmount: dualSourceValues.laborEmployeeAmount,
        nhiEmployeeAmount: dualSourceValues.nhiEmployeeAmount,
        secondHealthInsuranceFee: values.secondHealthInsuranceFee,
        customItems: parseExtraFields(row),
      });
    }
  }

  return { items, missingFieldsByEmployee, unmappedKeys: [...unmappedKeys], droppedRowCount };
}
