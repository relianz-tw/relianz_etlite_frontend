/**
 * 帳簿區「會計科目」端點封裝（/ael/subject/*）。
 * official/list/latest 帶出最新一版官方科目清單；usage 帶出目前公司的常用科目排名。
 */
import { buildQuery, apiFetch } from './client';
import { COMPANY_UUID } from './config';
import type { OfficialSubjectDto, SubjectUsageDto } from './types';

/** 最新版官方費用科目清單；value 為搜尋值（目前由前端過濾，暫傳空字串） */
export function listOfficialSubjects(value = ''): Promise<OfficialSubjectDto[]> {
  return apiFetch<OfficialSubjectDto[]>(`/ael/subject/official/list/latest${buildQuery({ value })}`);
}

/** 使用者常用科目（已依 rank 由高到低排序） */
export function listSubjectUsage(value = ''): Promise<SubjectUsageDto[]> {
  return apiFetch<SubjectUsageDto[]>(`/ael/subject/usage${buildQuery({ acUuid: COMPANY_UUID, value })}`);
}
