import type { InsuranceGrade } from './types';

/**
 * 健保／勞保／勞退投保級距假資料（比照台灣現行級距表的代表性區間，非最新公告全表）。
 * 待後端提供 GET 級距 API 後改為串接真實資料，本檔僅供介面示範選單使用。
 */
export const NHI_GRADES: InsuranceGrade[] = [
  { id: 0, grade: 0, salaryMin: 0, salaryMax: 0 },
  { id: 1, grade: 1, salaryMin: 0, salaryMax: 28590 },
  { id: 2, grade: 2, salaryMin: 28591, salaryMax: 30300 },
  { id: 3, grade: 3, salaryMin: 30301, salaryMax: 32e3 },
  { id: 4, grade: 4, salaryMin: 32001, salaryMax: 34800 },
  { id: 5, grade: 5, salaryMin: 34801, salaryMax: 38200 },
  { id: 6, grade: 6, salaryMin: 38201, salaryMax: 41900 },
  { id: 7, grade: 7, salaryMin: 41901, salaryMax: 45800 },
];

export const LABOR_GRADES: InsuranceGrade[] = [
  { id: 0, grade: 0, salaryMin: 0, salaryMax: 0 },
  { id: 1, grade: 1, salaryMin: 0, salaryMax: 11100 },
  { id: 2, grade: 2, salaryMin: 11101, salaryMax: 12540 },
  { id: 3, grade: 3, salaryMin: 12541, salaryMax: 13500 },
  { id: 4, grade: 4, salaryMin: 13501, salaryMax: 15840 },
  { id: 5, grade: 5, salaryMin: 15841, salaryMax: 18780 },
  { id: 6, grade: 6, salaryMin: 18781, salaryMax: 21009 },
  { id: 7, grade: 7, salaryMin: 21010, salaryMax: 25250 },
  { id: 8, grade: 8, salaryMin: 25251, salaryMax: 27470 },
  { id: 9, grade: 9, salaryMin: 27471, salaryMax: 30300 },
  { id: 10, grade: 10, salaryMin: 30301, salaryMax: 36300 },
  { id: 11, grade: 11, salaryMin: 36301, salaryMax: 45800 },
];

export const LABOR_PENSION_GRADES: InsuranceGrade[] = [
  { id: 1, grade: 1, salaryMin: 0, salaryMax: 11100 },
  { id: 2, grade: 2, salaryMin: 11101, salaryMax: 15840 },
  { id: 3, grade: 3, salaryMin: 15841, salaryMax: 21009 },
  { id: 4, grade: 4, salaryMin: 21010, salaryMax: 27470 },
  { id: 5, grade: 5, salaryMin: 27471, salaryMax: 36300 },
  { id: 6, grade: 6, salaryMin: 36301, salaryMax: 45800 },
  { id: 7, grade: 7, salaryMin: 45801, salaryMax: 150000 },
];

/** 依級距 id 找出投保金額（無投保時回傳 0） */
export function gradeAmountById(grades: InsuranceGrade[], id: number): number {
  const grade = grades.find(g => g.id === id);
  if (!grade || grade.grade === 0) return 0;
  return grade.salaryMax ?? grade.salaryMin;
}

/** 自提比例選項（1%～6%） */
export const VOLUNTARY_PENSION_RATES = [1, 2, 3, 4, 5, 6];

/** 有薪資資料的可選年度（民國年轉西元年），無後端時固定近三年 */
export function availableYears(): number[] {
  const currentYear = 2026; // 對齊專案假資料基準年（見 CLAUDE.md currentDate）
  return [currentYear, currentYear - 1, currentYear - 2];
}
