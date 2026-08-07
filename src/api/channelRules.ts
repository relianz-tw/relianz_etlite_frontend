/**
 * 「銷售管道規則」端點封裝（/ael/payment/channelRules，見 sale.md 內嵌 OpenAPI 規格）。
 * 自動帶入 companyUuid，呼叫端（ChannelRuleSection/ChannelRuleDialog）不需重複組裝。
 */
import { buildQuery, apiFetch } from './client';
import { COMPANY_UUID } from './config';
import type { ChannelRuleDto, CreateChannelRuleBody, UpdateChannelRuleBody } from './types';

/** balance 欄位後端偶見以字串回傳（比照 GET /ael/vendors），統一正規化為 number 供畫面直接運算 */
export async function listChannelRules(): Promise<ChannelRuleDto[]> {
  const list = await apiFetch<ChannelRuleDto[]>(`/ael/payment/channelRules${buildQuery({ companyUuid: COMPANY_UUID })}`);
  return list.map(c => ({ ...c, balance: Number(c.balance) || 0 }));
}

export function createChannelRule(body: Omit<CreateChannelRuleBody, 'companyUuid'>): Promise<ChannelRuleDto> {
  return apiFetch<ChannelRuleDto>('/ael/payment/channelRules', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

export function updateChannelRule(body: Omit<UpdateChannelRuleBody, 'companyUuid'>): Promise<ChannelRuleDto> {
  return apiFetch<ChannelRuleDto>('/ael/payment/channelRules', {
    method: 'PATCH',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}
