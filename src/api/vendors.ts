/**
 * 帳簿區「廠商名單」端點封裝（/ael/vendors，見 ledger.html 內嵌 OpenAPI 規格）。
 * 自動帶入 companyUuid，呼叫端（VendorSection/VendorDialog）不需重複組裝。
 */
import { buildQuery, apiFetch } from './client';
import { COMPANY_UUID } from './config';
import type { CreateVendorBody, UpdateVendorBody, VendorDto, VendorExistsResult } from './types';

/** balance 欄位後端偶見以字串回傳（見 api.md GET /ael/vendors 回應示例），統一正規化為 number 供畫面直接運算 */
export async function listVendors(): Promise<VendorDto[]> {
  const list = await apiFetch<VendorDto[]>(`/ael/vendors${buildQuery({ companyUuid: COMPANY_UUID })}`);
  return list.map(v => ({ ...v, balance: Number(v.balance) || 0 }));
}

export function createVendor(body: Omit<CreateVendorBody, 'companyUuid'>): Promise<VendorDto> {
  return apiFetch<VendorDto>('/ael/vendors', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

export function updateVendor(body: Omit<UpdateVendorBody, 'companyUuid'>): Promise<VendorDto> {
  return apiFetch<VendorDto>('/ael/vendors', {
    method: 'PATCH',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** taxId／name 擇一查詢，用於新增廠商送出前檢查是否已存在 */
export function vendorExists(params: { taxId?: string; name?: string }): Promise<VendorExistsResult> {
  return apiFetch<VendorExistsResult>(
    `/ael/vendors/exists${buildQuery({ companyUuid: COMPANY_UUID, taxId: params.taxId, name: params.name })}`
  );
}
