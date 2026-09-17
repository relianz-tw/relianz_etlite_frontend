/**
 * onboardingBind route handler（綠界綁卡回呼）專用的交易紀錄 API。
 *
 * TODO: 後端尚未提供 /ael/ecpay/{updatePaymentUseCardInfo,createTradeRecord,createTradeRecord/error}
 * （實測皆 404，注意這不是 /ael/onboarding/ecpay/* —— 那組已存在；這裡是綁卡回呼
 * 專用的另一個命名空間）。待後端開通對應 ael 端點後，把下方三支的 /ac/ 改為 /ael/ 即可。
 * 只在綁卡回呼結算階段呼叫，不影響 Step1-6 試算與 Step8 綁卡本身。
 */
import { apiFetch } from '@/api/client';

/** 更新付款使用者的信用卡資訊 */
export function updatePaymentUser(
  uuid: string,
  bindCardId: string,
  cardValidYy: string,
  cardValidMm: string,
  Gwsr: number,
  card6No?: string,
  card4No?: string
): Promise<unknown> {
  return apiFetch('/ac/ecpay/updatePaymentUseCardInfo', {
    method: 'POST',
    body: JSON.stringify({
      uuid,
      bindCardId,
      cardValidYy,
      cardValidMm,
      card6No,
      card4No,
      Gwsr,
    }),
  });
}

/** 建立交易紀錄 */
export function createTradeRecord(
  merchantTradeNo: string,
  tradeNo: string,
  productId: string[],
  processDate: string,
  amount: number,
  userUuid: string
): Promise<unknown> {
  return apiFetch('/ac/ecpay/createTradeRecord', {
    method: 'POST',
    body: JSON.stringify({
      merchantTradeNo,
      tradeNo,
      productId,
      processDate,
      amount,
      userUuid,
    }),
  });
}

/** 建立交易錯誤紀錄（綁卡或退款失敗時） */
export function createTradeRecordError(
  merchantTradeNo: string,
  tradeNo: string,
  productId: string[],
  processDate: string,
  amount: number,
  userUuid: string,
  rtnCode: number,
  rtnMsg: string
): Promise<unknown> {
  return apiFetch('/ac/ecpay/createTradeRecord/error', {
    method: 'POST',
    body: JSON.stringify({
      merchantTradeNo,
      tradeNo,
      productId,
      processDate,
      amount,
      userUuid,
      rtnCode,
      rtnMsg,
    }),
  });
}
