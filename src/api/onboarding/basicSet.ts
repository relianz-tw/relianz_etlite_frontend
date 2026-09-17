import { apiFetch } from '@/api/client';

export interface OnboardingBasicSetRequest {
  /** 帳號 uuid（ac_uuid） */
  uuid: string;
  companyName: string;
  companyAddr: string;
  /** 代表人姓名 */
  headName: string;
  /** 統一編號 */
  taxIdNumber: string;
  /** 公司簡介、業務性質及銷售管道 */
  introduction: string;
  /** 主要銷售模式：0=實體、1=網路、2=都有 */
  salesMode: number;
}

/** 建立 Onboarding 公司基本設定（公司簡介與銷售模式） */
export function createOnboardingBasicSet(
  data: OnboardingBasicSetRequest
): Promise<unknown> {
  return apiFetch('/ael/onboarding/basicSet/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
