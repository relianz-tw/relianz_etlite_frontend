/**
 * 「基本設定」端點封裝（/ael/basic/companySetting，見 basic.html 內嵌 OpenAPI 規格）。
 * 查詢參數為 acUuid（語意同其他端點的 companyUuid，欄位命名沿用後端）。
 */
import { buildQuery, apiFetch } from './client';
import { COMPANY_UUID } from './config';
import type { BasicSettingDto, UpdateBasicSettingBody } from './types';

export function getBasicSetting(): Promise<BasicSettingDto> {
  return apiFetch<BasicSettingDto>(`/ael/basic/companySetting${buildQuery({ acUuid: COMPANY_UUID })}`);
}

export function updateBasicSetting(body: Omit<UpdateBasicSettingBody, 'acUuid'>): Promise<BasicSettingDto> {
  return apiFetch<BasicSettingDto>('/ael/basic/companySetting/reconciliationMethod', {
    method: 'PATCH',
    body: JSON.stringify({ ...body, acUuid: COMPANY_UUID }),
  });
}
