/**
 * 投保級距相關端點封裝（/ael/salary/insurance*，2026-09-10 後端新增，見 Apifox「薪資/各式保險計算」分類）。
 */
import { apiFetch, buildQuery } from './client';
import type { InsuranceGradesResult } from './types';

/** 取得指定西元年的健保／勞保／勞退投保級距全表（GET /ael/salary/insurance） */
export function fetchInsuranceGrades(year: number): Promise<InsuranceGradesResult> {
  return apiFetch<InsuranceGradesResult>(`/ael/salary/insurance${buildQuery({ year })}`);
}

/**
 * 取得負責人健保投保最低級距金額（GET /ael/salary/insurance/nhi/head，西元年）。
 * 法規要求：負責人之健保投保金額不得低於已投保員工中的最高投保金額，回傳值即為該門檻金額。
 */
export function fetchNhiHeadMinGrade(year: number): Promise<number> {
  return apiFetch<number>(`/ael/salary/insurance/nhi/head${buildQuery({ year })}`);
}
