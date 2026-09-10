import type { EmployeeDto, InsuranceGradeDto, SaveEmployeeBody } from '@/api/types';
import type { Employee, EmploymentStatus } from './types';

/** 自提比例選項（1%～6%） */
export const VOLUNTARY_PENSION_RATES = [1, 2, 3, 4, 5, 6];

/**
 * 有薪資資料的可選年度後備清單（西元年，近三年），供 useAvailableYears（見 useEmployees.ts）
 * 查詢 GET /ael/employee/form 前的載入中畫面、或查詢失敗時使用。
 */
export function fallbackAvailableYears(): number[] {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear - 1, currentYear - 2];
}

/**
 * 員工在職狀態 API DTO → 畫面用值。
 * ⚠️ employmentStatus 規格未寫明語意，依回應範例（employmentStatus: 1 且 quitDate: null）判定 1=在職／0=離職，
 * 若實測相反，改這裡與 toEmploymentStatusCode 即可。
 */
function toEmploymentStatus(employmentStatus: number): EmploymentStatus {
  return employmentStatus === 1 ? 'active' : 'inactive';
}

function toEmploymentStatusCode(status: EmploymentStatus): number {
  return status === 'active' ? 1 : 0;
}

/** ISO 字串 → YYYY-MM-DD，供 DatePicker／表單顯示；空值回傳空字串 */
function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

/** YYYY-MM-DD → unix seconds，供寫入 API；空字串回傳 null */
function dateInputToUnixSeconds(value: string): number | null {
  if (!value) return null;
  return Math.floor(new Date(`${value}T00:00:00+08:00`).getTime() / 1000);
}

/** YYYY-MM-DD → YYYYMMDD，供勞保開始投保日期寫入 API；空字串原樣回傳（後端視為＝到職日） */
function dateInputToCompact(value: string): string {
  return value.replaceAll('-', '');
}

/** API DTO → 畫面用 Employee；後端讀寫語意不對稱的日期欄位皆在此統一轉換，View 只碰 YYYY-MM-DD */
export function mapEmployeeDto(dto: EmployeeDto): Employee {
  return {
    id: dto.id,
    name: dto.name,
    idNumber: dto.idNumber,
    jobTitle: dto.jobTitle ?? '',
    phoneNumber: dto.phoneNumber,
    email: dto.email,
    idCardFront: dto.idCardFront,
    idCardBack: dto.idCardBack,
    householdAddress: dto.householdAddress,
    contactAddress: dto.contactAddress,
    nhiLevelId: dto.nhiLevelId,
    nhiDependents: dto.nhiDependents,
    laborLevelId: dto.laborLevelId,
    laborInsuranceStartDate: isoToDateInput(dto.laborInsuranceStartDate),
    voluntaryPensionRate: dto.voluntaryPensionRate,
    laborPensionLevelId: dto.laborPensionLevelId,
    onboardDate: isoToDateInput(dto.onboardDate),
    status: toEmploymentStatus(dto.employmentStatus),
    quitDate: isoToDateInput(dto.quitDate),
    isHead: dto.isHead,
  };
}

/** 依級距 id 取投保金額（salaryMax 為 null 時取 salaryMin，對齊最高無上限級距的計算基準） */
function gradeAmountById(grades: InsuranceGradeDto[], id: number | null): number {
  if (id === null) return 0;
  const grade = grades.find(g => g.id === id);
  return grade ? (grade.salaryMax ?? grade.salaryMin) : 0;
}

/** 級距下拉顯示文字；部分工時級距加註記避免與一般級距同金額混淆 */
export function gradeLabel(grade: InsuranceGradeDto): string {
  if (grade.grade === 0) return '無投保';
  const amount = grade.salaryMax ?? grade.salaryMin;
  const prefix = grade.salaryMax === null ? `$${grade.salaryMin.toLocaleString('en-US')} 以上` : `$${amount.toLocaleString('en-US')}`;
  return grade.isParttime ? `${prefix}（部分工時）` : prefix;
}

/**
 * 找出金額落在 salaryMin～salaryMax 區間內的級距（salaryMax 為 null 代表最高級距，只比對下限）；
 * 「無投保」（grade === 0）不列入候選。供負責人健保最低投保金額換算對應級距使用。
 */
export function findGradeByAmount(grades: InsuranceGradeDto[], amount: number): InsuranceGradeDto | undefined {
  return grades.find(g => g.grade !== 0 && (g.salaryMax === null ? amount >= g.salaryMin : amount >= g.salaryMin && amount <= g.salaryMax));
}

/** 判斷級距是否低於指定最低金額（級距上限仍低於門檻即視為不合規；salaryMax 為 null 的最高級距一律視為合規） */
export function isGradeBelowMinAmount(grade: InsuranceGradeDto, minAmount: number): boolean {
  return grade.salaryMax !== null && grade.salaryMax < minAmount;
}

/**
 * 判斷員工是否為健保「無投保」（grade === 0，非固定 id，故查表判斷而非直接比對 null；
 * 比照 EmployeeFormView.tsx 的 laborUninsured 判斷方式）。用於區分產生二代健保繳款書時
 * 「正職」與「兼職」員工（兼職走 download/parttime，比對姊妹專案 EASYTAX 的 nhiLevel === 0 邏輯確認）。
 */
export function isNhiUninsured(nhiLevelId: number | null, nhiGrades: InsuranceGradeDto[]): boolean {
  if (nhiLevelId === null) return true;
  return nhiGrades.find(g => g.id === nhiLevelId)?.grade === 0;
}

export interface InsuranceGrades {
  laborGrades: InsuranceGradeDto[];
  laborPensionGrades: InsuranceGradeDto[];
  nhiGrades: InsuranceGradeDto[];
}

/** 表單資料 → 新增／更新員工請求體；級距 id 對應的投保金額（nhiAmount／laborAmount／laborPensionAmount）在此一併帶入 */
export function toSaveEmployeeBody(
  form: Omit<Employee, 'id'>,
  grades: InsuranceGrades,
): Omit<SaveEmployeeBody, 'companyUuid'> {
  return {
    name: form.name.trim(),
    idNumber: form.idNumber.trim(),
    phoneNumber: form.phoneNumber.trim(),
    email: form.email.trim(),
    employmentStatus: toEmploymentStatusCode(form.status),
    idCardFront: form.idCardFront,
    idCardBack: form.idCardBack,
    householdAddress: form.householdAddress.trim(),
    contactAddress: form.contactAddress.trim(),
    nhiLevelId: form.nhiLevelId,
    nhiDependents: form.nhiDependents,
    onboardDate: dateInputToUnixSeconds(form.onboardDate) ?? 0,
    quitDate: dateInputToUnixSeconds(form.quitDate),
    voluntaryPensionRate: form.voluntaryPensionRate,
    laborLevelId: form.laborLevelId,
    laborInsuranceStartDate: dateInputToCompact(form.laborInsuranceStartDate),
    laborPensionLevelId: form.laborPensionLevelId,
    laborAmount: gradeAmountById(grades.laborGrades, form.laborLevelId),
    nhiAmount: gradeAmountById(grades.nhiGrades, form.nhiLevelId),
    laborPensionAmount: gradeAmountById(grades.laborPensionGrades, form.laborPensionLevelId),
    jobTitle: form.jobTitle.trim(),
    isHead: form.isHead,
  };
}
