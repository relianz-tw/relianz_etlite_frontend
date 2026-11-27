/**
 * 「銷售管道規則」端點封裝（/ael/payment/channelRules，見 sale.md 內嵌 OpenAPI 規格）。
 * 自動帶入 companyUuid，呼叫端（ChannelRuleSection/ChannelRuleDialog）不需重複組裝。
 */
import { buildQuery, apiFetch } from './client';
import { COMPANY_UUID } from './config';
import type { ChannelRuleDto, CreateChannelRuleBody, UpdateChannelRuleBody } from './types';

export function listChannelRules(): Promise<ChannelRuleDto[]> {
  return apiFetch<ChannelRuleDto[]>(`/ael/payment/channelRules${buildQuery({ companyUuid: COMPANY_UUID })}`);
}

export function createChannelRule(body: Omit<CreateChannelRuleBody, 'companyUuid'>): Promise<ChannelRuleDto> {
  return apiFetch<ChannelRuleDto>('/ael/payment/channelRules', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/**
 * 建立系統預設的「其他」銷售管道，用來歸類沒有特別指定管道的銷售款項。
 * 各公司的 uuid 不同、名稱固定為「其他」，後端之後只允許更新 receivingAccountUuid。
 * 入帳規則給「每週固定星期一」（settlementStyle 1 = SETTLEMENT_STYLE.WEEKLY）當合理預設，
 * 常數定義在 features/settings/data.ts，api 層不能反向 import，故此處用字面值。
 */
export function createDefaultOtherChannel(receivingAccountUuid: string): Promise<ChannelRuleDto> {
  return createChannelRule({
    channelName: '其他',
    settlementStyle: 1,
    settlementAmount: 1,
    receivingAccountUuid,
    remark: '',
    isActive: true,
    initDefaultOther: true,
  });
}

export function updateChannelRule(body: Omit<UpdateChannelRuleBody, 'companyUuid'>): Promise<ChannelRuleDto> {
  return apiFetch<ChannelRuleDto>('/ael/payment/channelRules', {
    method: 'PATCH',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}
