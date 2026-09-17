import { apiFetch, buildQuery } from '@/api/client';

export interface OnboardingPaymentUserRequest {
  uuid: string;
  companyAddr: string;
  companyName: string;
  companyTaxId: string;
  email: string;
  phone: string;
  userName: string;
}

export interface OnboardingPaymentUserInfo {
  bindCardId: string;
  card4No: string;
  card6No: string;
  cardValidMm: string;
  cardValidYy: string;
  companyAddr: string;
  companyName: string;
  companyTaxId: string;
  createTime: string;
  email: string;
  gwsr: number;
  id: number;
  phone: string;
  userName: string;
  userUuid: string;
}

/** 建立 Onboarding 付款使用者（合併原 createPaymentUser + recordBasicInfo） */
export function setupOnboardingPaymentUser(
  data: OnboardingPaymentUserRequest
): Promise<{ userInfo: OnboardingPaymentUserInfo }> {
  return apiFetch<{ userInfo: OnboardingPaymentUserInfo }>(
    '/ael/onboarding/ecpay/paymentUser',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

/** 取得 Onboarding 付款使用者資料 */
export function getOnboardingPaymentUser(
  uuid: string
): Promise<{ userInfo: OnboardingPaymentUserInfo }> {
  return apiFetch<{ userInfo: OnboardingPaymentUserInfo }>(
    `/ael/onboarding/ecpay/paymentUser${buildQuery({ uuid })}`
  );
}
