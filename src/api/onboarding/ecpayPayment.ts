import { apiFetch, buildQuery } from '@/api/client';

/** 拿取交易編碼 */
export function getMerchantTradeCode(): Promise<string> {
  return apiFetch<string>('/ael/onboarding/ecpay/merchantCode');
}

/** 抓取待購清單 */
export function getProductUnpaid(
  uuid: string
): Promise<{ productUnpaid: string[] }> {
  return apiFetch<{ productUnpaid: string[] }>(
    `/ael/onboarding/ecpay/productUnpaid${buildQuery({ uuid })}`
  );
}

/** 新增待購清單 */
export function createProductUnpaid(data: {
  userUuid: string;
  productIds: string[];
}): Promise<unknown> {
  return apiFetch('/ael/onboarding/ecpay/productUnpaid', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 刪除待購清單 */
export function deleteProductUnpaid(uuid: string): Promise<unknown> {
  return apiFetch(`/ael/onboarding/ecpay/productUnpaid${buildQuery({ uuid })}`, {
    method: 'DELETE',
  });
}

/** 建立交易紀錄（onboarding 命名空間；與 onboardingBind route handler 用的一般 ecpay 命名空間為不同端點） */
export function createTradeRecord(data: {
  merchantTradeNo: string;
  tradeNo: string;
  productId: string[];
  amount: number;
  processDate: string;
  userUuid: string;
}): Promise<unknown> {
  return apiFetch('/ael/onboarding/ecpay/tradeRecord', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 建立訂閱清單紀錄 */
export function createSubscriptionList(data: {
  userUuid: string;
  merchantTradeNo: string;
}): Promise<unknown> {
  return apiFetch('/ael/onboarding/ecpay/subscriptionList', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 取得本次購買商品清單列表 */
export function getShopList(merchantTradeNo: string): Promise<string[]> {
  return apiFetch<string[]>(
    `/ael/onboarding/ecpay/shoplist${buildQuery({ merchantTradeNo })}`
  );
}

/** 購買電子發票系統時初始化電子發票的用戶資料 */
export function initEInvoiceBasicSet(userUuid: string): Promise<unknown> {
  return apiFetch('/ael/onboarding/ecpay/eInvoiceBasicSet', {
    method: 'POST',
    body: JSON.stringify({ userUuid }),
  });
}

export interface SubscriptionItem {
  userUuid: string;
  productId: string;
  costAction: number;
  totalSuccessTime: number;
  totalSuccessAmount: number;
  merchantCodeList: string[];
  currentPaymentDate: string;
  nextPaymentDate: string;
  active: number;
  stopDate: string | null;
  isTrial: number;
  trialStartTime: string | null;
  trialEndTime: string | null;
}

/** 取得訂閱清單（含試用期資訊） */
export function getSubscriptionList(
  userUuid: string
): Promise<SubscriptionItem[]> {
  return apiFetch<SubscriptionItem[]>(
    `/ael/onboarding/ecpay/subscription/list${buildQuery({ userUuid })}`
  );
}

/** 建立後台使用者（在開立帳單前呼叫） */
export function createBehindTrade(data: {
  uuid: string;
  merchantTradeNo: string;
  email: string;
}): Promise<unknown> {
  return apiFetch('/ael/onboarding/user/create/behindTrade', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 開立帳單 */
export function setupAutopaymentBill(data: {
  uuid: string;
  merchantTradeNo: string;
}): Promise<unknown> {
  return apiFetch('/ael/onboarding/cms/bill/autopayment/bill/setup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
