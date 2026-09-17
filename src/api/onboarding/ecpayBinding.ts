/**
 * 打自家 Next.js route（/etlite/api/ecpay/request），不是後端 API，
 * 回應是綠界解密後的原始格式（非 {success,data,errorCode,message} 信封），故不使用 apiFetch。
 */

interface EcpayRequestResponse {
  data?: unknown;
  error?: string;
}

// 回傳為綠界原始回應格式，欄位因操作而異，公用底層第三方介接允許 any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callEcpayRequestRoute(
  operation: string,
  params: Record<string, unknown>
): Promise<any> {
  const res = await fetch('/etlite/api/ecpay/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, params }),
  });

  let body: EcpayRequestResponse;
  try {
    body = await res.json();
  } catch {
    throw new Error('綠界服務回應異常，請重新嘗試');
  }

  if (!res.ok || body.data === undefined || body.data === null) {
    throw new Error(body.error ?? '綠界服務連線失敗，請重新嘗試');
  }

  return body.data;
}

/** 取得廠商驗證碼（Onboarding 專用） */
export async function getOnboardingToken(
  ConsumerInfo: { MerchantMemberID: string },
  OrderInfo: {
    MerchantTradeDate: string;
    MerchantTradeNo: string;
    TotalAmount: number;
    TradeDesc: string;
    ItemName: string;
    ReturnURL: string;
  },
  path: string
) {
  try {
    return await callEcpayRequestRoute('getTokenByBindingCard', {
      ConsumerInfo,
      OrderInfo,
      path,
    });
  } catch (error) {
    console.error('getOnboardingToken 錯誤:', error);
    throw error;
  }
}

/** 建立綁定信用卡交易（Onboarding 專用） */
export async function bindOnboardingCard(
  BindCardPayToken: string,
  MerchantMemberID: string
) {
  try {
    return await callEcpayRequestRoute('createBindCard', {
      BindCardPayToken,
      MerchantMemberID,
    });
  } catch (error) {
    console.error('bindOnboardingCard 錯誤:', error);
    throw error;
  }
}
