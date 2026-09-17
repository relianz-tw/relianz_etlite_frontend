/**
 * 綠界（ECPay）AES-128-CBC 加解密與 API 呼叫核心邏輯。
 * 從 route.ts 抽出成可直接 import 的函式，讓 refundFlow.ts 等伺服器端程式碼
 * 能直接呼叫，不需要再繞一次 HTTP 打自家 route（原 cashflow 版本的作法）。
 *
 * onboarding 只用到 4 個操作：getTokenByBindingCard／createBindCard（綁卡）、
 * getCreditDetail／creditDoAction（退還驗證金）。其餘操作（createPayment 等）
 * 屬於訂閱制付款/幕後授權，onboarding 流程不需要，故不搬。
 */
import crypto from 'crypto';

const hashKey = process.env.ECPAY_HASHKEY;
const hashIv = process.env.ECPAY_HASHIV;
const merchantID = process.env.ECPAY_MERCHANTID;
const apiLink = process.env.NEXT_PUBLIC_ECPAY_API;
const apiLink2 = process.env.NEXT_PUBLIC_ECPAY_API_2;
const baseUrl = process.env.NEXT_PUBLIC_URL;

function encryptData(jsonData: unknown, key: string, iv: string): string {
  const jsonString = JSON.stringify(jsonData);
  const urlEncodedData = encodeURIComponent(jsonString);
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  let encryptedData = cipher.update(urlEncodedData, 'utf8', 'base64');
  encryptedData += cipher.final('base64');
  return encryptedData;
}

function decryptData(encryptedData: string, key: string, iv: string): unknown {
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  let decryptedData = decipher.update(encryptedData, 'base64', 'utf8');
  decryptedData += decipher.final('utf8');
  const urlDecodedData = decodeURIComponent(decryptedData);
  return JSON.parse(urlDecodedData);
}

/** 加密請求資料並打綠界 API，解密回應後回傳 */
async function callEcpay(url: string, jsonData: unknown): Promise<unknown> {
  if (!hashKey || !hashIv || !merchantID) {
    throw new Error('Missing required environment variables');
  }
  const timeS = Math.floor(Date.now() / 1000);
  const requestData = {
    MerchantID: merchantID,
    RqHeader: { Timestamp: timeS },
    Data: encryptData(jsonData, hashKey, hashIv),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData),
  });
  const body = (await res.json()) as { Data: string };
  return decryptData(body.Data, hashKey, hashIv);
}

/** 取得廠商驗證碼（onboarding 綁卡第一步） */
export function getTokenByBindingCard(params: {
  ConsumerInfo: unknown;
  OrderInfo: unknown;
  path: string;
  CustomField?: unknown;
}): Promise<unknown> {
  const jsonData: Record<string, unknown> = {
    MerchantID: merchantID,
    ConsumerInfo: params.ConsumerInfo,
    OrderInfo: params.OrderInfo,
    OrderResultURL: `${baseUrl}${params.path}`,
  };
  if (params.CustomField) jsonData.CustomField = params.CustomField;
  return callEcpay(`${apiLink}/Merchant/GetTokenbyBindingCard`, jsonData);
}

/** 建立綁定信用卡交易（onboarding 綁卡第二步） */
export function createBindCard(params: {
  BindCardPayToken: string;
  MerchantMemberID: string;
}): Promise<unknown> {
  return callEcpay(`${apiLink}/Merchant/CreateBindCard`, {
    MerchantID: merchantID,
    BindCardPayToken: params.BindCardPayToken,
    MerchantMemberID: params.MerchantMemberID,
  });
}

/** 查詢信用卡單筆明細紀錄（退款流程用） */
export function getCreditDetail(params: {
  MerchantTradeNo: string;
}): Promise<unknown> {
  return callEcpay(`${apiLink2}/1.0.0/CreditDetail/QueryTrade`, {
    MerchantID: merchantID,
    MerchantTradeNo: params.MerchantTradeNo,
  });
}

/** 信用卡請退款（放棄授權 N／退刷 R／取消關帳 E） */
export function creditDoAction(params: {
  MerchantTradeNo: string;
  TradeNo: string;
  Action: 'N' | 'R' | 'E';
  TotalAmount: number;
}): Promise<unknown> {
  return callEcpay(`${apiLink2}/1.0.0/Credit/DoAction`, {
    MerchantID: merchantID,
    MerchantTradeNo: params.MerchantTradeNo,
    TradeNo: params.TradeNo,
    Action: params.Action,
    TotalAmount: params.TotalAmount,
  });
}
