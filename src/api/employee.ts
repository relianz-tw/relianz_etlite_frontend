/**
 * 員工相關端點封裝（/ael/employee、/ael/employees/*，見 Apifox EasyTax_Lite 專案「員工」分類）。
 * 自動帶入 companyUuid，呼叫端不需重複組裝。
 */
import { apiFetch, apiFetchEnvelope, buildQuery } from './client';
import { COMPANY_UUID } from './config';
import type { EmployeeDto, EmployeeIdCardUploadResult, EmployeeListResult, SalaryYearMonthDto, SaveEmployeeBody } from './types';

export interface FetchEmployeesParams {
  /** 1 在職／0 離職，留空查全部 */
  employmentStatus?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 撈取員工列表（GET /ael/employee）。
 * ⚠️ 此端點的 pagination 與 data 同級（不在 data 內），改用 apiFetchEnvelope 取整個信封物件。
 */
export async function fetchEmployees(params: FetchEmployeesParams): Promise<EmployeeListResult> {
  const envelope = await apiFetchEnvelope<{
    success: boolean;
    data: EmployeeDto[] | null;
    errorCode: string;
    errorcode?: string;
    message: string;
    pagination: EmployeeListResult['pagination'];
  }>(`/ael/employee${buildQuery({ companyUuid: COMPANY_UUID, ...params })}`);
  return { list: envelope.data ?? [], pagination: envelope.pagination };
}

/** 撈單筆員工（GET /ael/employees/id） */
export function getEmployeeById(id: number): Promise<EmployeeDto> {
  return apiFetch<EmployeeDto>(`/ael/employees/id${buildQuery({ id, companyUuid: COMPANY_UUID })}`);
}

/** 新增員工（POST /ael/employee） */
export function createEmployee(body: Omit<SaveEmployeeBody, 'companyUuid'>): Promise<null> {
  return apiFetch<null>('/ael/employee', { method: 'POST', body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }) });
}

/** 更新員工（PATCH /ael/employee）；body 需含 id */
export function updateEmployee(body: Omit<SaveEmployeeBody, 'companyUuid'> & { id: number }): Promise<null> {
  return apiFetch<null>('/ael/employee', { method: 'PATCH', body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }) });
}

/** 刪除員工（DELETE /ael/employee） */
export function deleteEmployee(id: number): Promise<null> {
  return apiFetch<null>(`/ael/employee${buildQuery({ id })}`, { method: 'DELETE' });
}

/** 上傳員工身分證（POST /ael/employees/upload，multipart/form-data） */
export function uploadEmployeeIdCard(file: File): Promise<EmployeeIdCardUploadResult> {
  const formData = new FormData();
  formData.append('img', file);
  return apiFetch<EmployeeIdCardUploadResult>('/ael/employees/upload', { method: 'POST', body: formData });
}

/**
 * 取得公司有薪資資料的年月，供薪資單年月下拉使用（GET /ael/employee/form）。
 * ⚠️ 路徑為單數 employee（不是 employees，2026-09-10 後端修復），query 參數名為 uuid（非 companyUuid）。
 * ⚠️ 實測發現：刪除薪資列後，這支回傳的年月清單不會跟著移除（疑似未隨刪除同步更新），
 * 前端只拿來當「還有哪些年份可選」的參考，不依賴它判斷「該月是否仍有資料」。
 */
export function fetchSalaryYearMonths(): Promise<SalaryYearMonthDto[]> {
  return apiFetch<SalaryYearMonthDto[]>(`/ael/employee/form${buildQuery({ uuid: COMPANY_UUID })}`);
}
