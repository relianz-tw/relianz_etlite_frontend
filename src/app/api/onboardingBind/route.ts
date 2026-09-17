import {
  createTradeRecord,
  createTradeRecordError,
  updatePaymentUser,
} from '@/api/ecpay/onboardingTrade';
import { safeRefundAuthorization } from '@/api/ecpay/refundFlow';
import { retryAsync } from '@/lib/retry';
import { notifyTeams } from '@/lib/teamsNotify';
import { logTradeRecordError } from '@/lib/tradeRecordLogger';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const ROUTE_TAG = 'api/onboardingBind/route.ts';
const hashKey = process.env.ECPAY_HASHKEY;
const hashIv = process.env.ECPAY_HASHIV;

function decryptData(encryptedData: string, key: string, iv: string) {
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  let decryptedData = decipher.update(encryptedData, 'base64', 'utf8');
  decryptedData += decipher.final('utf8');
  const urlDecodedData = decodeURIComponent(decryptedData);
  return JSON.parse(urlDecodedData);
}

export async function POST(req: NextRequest) {
  const data = await req.text();
  const encodedJson = new URLSearchParams(data).get('ResultData');

  if (!encodedJson) {
    return new Response('Receive!');
  }

  const decodedJsonString = decodeURIComponent(decodeURIComponent(encodedJson));
  const jsonObject = JSON.parse(decodedJsonString);
  const encryptedData = decryptData(
    jsonObject.Data,
    hashKey || '',
    hashIv || ''
  );

  if (encryptedData.RtnCode !== 1) {
    const msg = encodeURIComponent(encryptedData.RtnMsg ?? '付款失敗，請重試');
    const rtnCode = encryptedData.RtnCode ?? '';
    const processDate = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const cardErrorPayload = {
      merchantTradeNo: encryptedData.OrderInfo?.MerchantTradeNo ?? '',
      tradeNo: encryptedData.OrderInfo?.TradeNo ?? '',
      productId: ['CARD'],
      processDate,
      amount: encryptedData.OrderInfo?.TradeAmt ?? 0,
      userUuid: encryptedData.MerchantMemberID ?? '',
      rtnCode: encryptedData.RtnCode,
      rtnMsg: encryptedData.RtnMsg ?? '',
    };
    try {
      await createTradeRecordError(
        cardErrorPayload.merchantTradeNo,
        cardErrorPayload.tradeNo,
        cardErrorPayload.productId,
        cardErrorPayload.processDate,
        cardErrorPayload.amount,
        cardErrorPayload.userUuid,
        cardErrorPayload.rtnCode,
        cardErrorPayload.rtnMsg
      );
    } catch (recordError) {
      logTradeRecordError(
        ROUTE_TAG,
        'createTradeRecordError(CARD)',
        cardErrorPayload,
        recordError
      );
    }
    await notifyTeams(
      `【Onboarding 綁卡失敗】\n` +
        `會員：${encryptedData.MerchantMemberID ?? '（無）'}\n` +
        `訂單編號：${encryptedData.OrderInfo?.MerchantTradeNo ?? '（無）'}\n` +
        `綠界交易編號：${
          encryptedData.OrderInfo?.TradeNo ?? '（無，授權未成功建立）'
        }\n` +
        `金額：${
          encryptedData.OrderInfo?.TradeAmt !== undefined
            ? `NT$${encryptedData.OrderInfo.TradeAmt}`
            : '（無，授權未成功建立）'
        }\n` +
        `RtnCode：${encryptedData.RtnCode}\n` +
        `RtnMsg：${encryptedData.RtnMsg ?? '（無）'}`
    );
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/onboarding/payment/fail?msg=${msg}&uuid=${encryptedData.MerchantMemberID}&rtnCode=${rtnCode}`,
      303
    );
  }

  const { MerchantMemberID, BindCardID, CardInfo, OrderInfo } = encryptedData;

  // 交易紀錄用的處理時間，綁卡與退款共用同一時間點
  const processDate = new Date().toISOString().replace('T', ' ').slice(0, 19);

  // 安全退費：查詢明細 → 依狀態決定 Action → 最多重試 3 次
  const performRefund = async () => {
    const result = await safeRefundAuthorization({
      merchantTradeNo: OrderInfo.MerchantTradeNo,
      tradeNo: OrderInfo.TradeNo,
      amount: OrderInfo.TradeAmt,
    });

    if (result.status === 'failed') {
      // 重試 3 次仍失敗，記錄退款失敗交易紀錄並通知 Teams 人工處理
      const refundErrorPayload = {
        merchantTradeNo: OrderInfo.MerchantTradeNo,
        tradeNo: OrderInfo.TradeNo,
        productId: ['REFUND'],
        processDate,
        amount: -OrderInfo.TradeAmt,
        userUuid: MerchantMemberID,
        rtnCode: -1,
        rtnMsg: result.detail,
      };
      try {
        await createTradeRecordError(
          refundErrorPayload.merchantTradeNo,
          refundErrorPayload.tradeNo,
          refundErrorPayload.productId,
          refundErrorPayload.processDate,
          refundErrorPayload.amount,
          refundErrorPayload.userUuid,
          refundErrorPayload.rtnCode,
          refundErrorPayload.rtnMsg
        );
      } catch (recordError) {
        logTradeRecordError(
          ROUTE_TAG,
          'createTradeRecordError(REFUND)',
          refundErrorPayload,
          recordError
        );
      }
      await notifyTeams(
        `【Onboarding 綁卡驗證金退款失敗】\n` +
          `會員：${MerchantMemberID}\n` +
          `訂單編號：${OrderInfo.MerchantTradeNo}\n` +
          `綠界交易編號：${OrderInfo.TradeNo}\n` +
          `金額：NT$${OrderInfo.TradeAmt}\n` +
          `原因：${result.detail}`
      );
      return;
    }

    // refunded / no_action_needed / skipped_blackout：非明確失敗，記錄退款交易紀錄
    const refundRecordPayload = {
      merchantTradeNo: OrderInfo.MerchantTradeNo,
      tradeNo: OrderInfo.TradeNo,
      productId: ['REFUND'],
      processDate,
      amount: -OrderInfo.TradeAmt,
      userUuid: MerchantMemberID,
    };
    try {
      await createTradeRecord(
        refundRecordPayload.merchantTradeNo,
        refundRecordPayload.tradeNo,
        refundRecordPayload.productId,
        refundRecordPayload.processDate,
        refundRecordPayload.amount,
        refundRecordPayload.userUuid
      );
    } catch (recordError) {
      logTradeRecordError(
        ROUTE_TAG,
        'createTradeRecord(REFUND)',
        refundRecordPayload,
        recordError
      );
    }

    if (result.status === 'skipped_blackout') {
      // 落在每日自動關帳時段，退費略過，通知 Teams 人工後續處理
      await notifyTeams(
        `【Onboarding 綁卡驗證金退費待處理】\n` +
          `會員：${MerchantMemberID}\n` +
          `訂單編號：${OrderInfo.MerchantTradeNo}\n` +
          `綠界交易編號：${OrderInfo.TradeNo}\n` +
          `金額：NT$${OrderInfo.TradeAmt}\n` +
          `原因：關帳時段（20:15~20:30）略過，請於 20:30 後人工確認退刷`
      );
    }
    // refunded / no_action_needed 為正常結果，無需特別通知
  };

  try {
    // 更新付款用戶卡片資訊（套用 3 次重試）
    await retryAsync(
      () =>
        updatePaymentUser(
          MerchantMemberID,
          BindCardID,
          CardInfo.CardValidYY,
          CardInfo.CardValidMM,
          CardInfo.Gwsr,
          CardInfo.Card6No,
          CardInfo.Card4No
        ),
      {
        maxAttempts: 3,
        delayMs: 1000,
        onRetry: (error, attempt) => {
          console.error(
            `[updatePaymentUser 重試 ${attempt}/3] MerchantMemberID=${MerchantMemberID}，錯誤：`,
            error
          );
        },
      }
    );

    // 步驟 4: 記錄綁卡交易
    const cardRecordPayload = {
      merchantTradeNo: OrderInfo.MerchantTradeNo,
      tradeNo: OrderInfo.TradeNo,
      productId: ['CARD'],
      processDate,
      amount: OrderInfo.TradeAmt,
      userUuid: MerchantMemberID,
    };
    try {
      await createTradeRecord(
        cardRecordPayload.merchantTradeNo,
        cardRecordPayload.tradeNo,
        cardRecordPayload.productId,
        cardRecordPayload.processDate,
        cardRecordPayload.amount,
        cardRecordPayload.userUuid
      );
    } catch (recordError) {
      logTradeRecordError(
        ROUTE_TAG,
        'createTradeRecord(CARD)',
        cardRecordPayload,
        recordError
      );
    }

    // 綁卡成功，退還 NT$5 驗證金
    await performRefund();

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/onboarding/payment/check?no=${OrderInfo.MerchantTradeNo}&tno=${OrderInfo.TradeNo}&uuid=${MerchantMemberID}&amt=${OrderInfo.TradeAmt}`,
      303
    );
  } catch (error) {
    console.error('綁卡業務操作失敗:', error);
    // 卡片已授權，業務操作失敗時仍須嘗試退款
    await performRefund();
    return NextResponse.redirect(
      `${
        process.env.NEXT_PUBLIC_URL
      }/onboarding/payment/fail?msg=${encodeURIComponent(
        '系統處理異常，NT$5 已自動退回，請重新嘗試'
      )}&uuid=${MerchantMemberID}`,
      303
    );
  }
}
