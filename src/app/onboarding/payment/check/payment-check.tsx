'use client';

import { createOnboardingBasicSet } from '@/api/onboarding/basicSet';
import {
  createBehindTrade,
  createSubscriptionList,
  createTradeRecord,
  deleteProductUnpaid,
  getProductUnpaid,
  initEInvoiceBasicSet,
  setupAutopaymentBill,
} from '@/api/onboarding/ecpayPayment';
import {
  getOnboardingPaymentUser,
  type OnboardingPaymentUserInfo,
} from '@/api/onboarding/paymentUser';
import { OnboardingLoader } from '@/features/onboarding/components/OnboardingLoader';
import type { SalesModeType } from '@/features/onboarding/state/onboardingReducer';
import { retryAsync } from '@/lib/retry';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const EINVOICE_CODES = ['TA003', 'TA004', 'TA005'];

/** 重試設定：最多 3 次、每次間隔 800ms */
const RETRY_OPTIONS = { maxAttempts: 3, delayMs: 800 };

// 銷售模式對照後端數值：0=實體、1=網路、2=都有
const SALES_MODE_CODE: Record<SalesModeType, number> = {
  physical: 0,
  online: 1,
  both: 2,
};

export default function PaymentCheckPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const merchantTradeNo = searchParams.get('no') ?? '';
  const tradeNo = searchParams.get('tno') ?? '';
  const amount = searchParams.get('amt') ?? '';
  const uuid = searchParams.get('uuid') ?? '';
  const [paramError, setParamError] = useState(false);

  useEffect(() => {
    const processPayment = async () => {
      // 0. 取得使用者資料（email 供 createBehindTrade 使用，其餘欄位供 4.6 basicSet 使用）
      let userEmail = '';
      let userInfo: OnboardingPaymentUserInfo | null = null;
      try {
        const userRes = await retryAsync(
          () => getOnboardingPaymentUser(uuid),
          RETRY_OPTIONS
        );
        userInfo = userRes.userInfo ?? null;
        userEmail = userInfo?.email ?? '';
      } catch (error) {
        console.error('[payment-check] getOnboardingPaymentUser 失敗', error);
      }

      // 1. 抓取待購清單（作為 tradeRecord 的 productIds 來源）
      let productIds: string[] = [];
      try {
        const res = await retryAsync(
          () => getProductUnpaid(uuid),
          RETRY_OPTIONS
        );
        productIds = res.productUnpaid ?? [];
      } catch (error) {
        console.error('[payment-check] getProductUnpaid 失敗', error);
        toast.error('取得待購清單失敗，請聯繫客服');
      }

      // 2. 建立交易紀錄
      try {
        const processDate = new Date()
          .toISOString()
          .replace('T', ' ')
          .slice(0, 19);
        await retryAsync(
          () =>
            createTradeRecord({
              merchantTradeNo,
              tradeNo,
              productId: productIds,
              amount: parseInt(amount) || 0,
              processDate,
              userUuid: uuid,
            }),
          RETRY_OPTIONS
        );
      } catch (error) {
        console.error('[payment-check] createTradeRecord 失敗', error);
        toast.error('建立交易紀錄失敗，請聯繫客服');
      }

      // 3. 建立訂閱清單
      try {
        await retryAsync(
          () =>
            createSubscriptionList({
              userUuid: uuid,
              merchantTradeNo,
            }),
          RETRY_OPTIONS
        );
      } catch (error) {
        console.error('[payment-check] createSubscriptionList 失敗', error);
        toast.error('建立訂閱清單失敗，請聯繫客服');
      }

      // 4. 清除待購清單
      try {
        await retryAsync(() => deleteProductUnpaid(uuid), RETRY_OPTIONS);
      } catch (error) {
        console.error('[payment-check] deleteProductUnpaid 失敗', error);
        toast.error('清除待購清單失敗，請聯繫客服');
      }

      // 4.5 建立後台使用者
      try {
        await retryAsync(
          () =>
            createBehindTrade({
              uuid,
              merchantTradeNo,
              email: userEmail,
            }),
          RETRY_OPTIONS
        );
      } catch (error) {
        console.error('[payment-check] createBehindTrade 失敗', error);
        toast.error('建立後台使用者失敗，請聯繫客服');
      }

      // 4.6 儲存公司簡介與銷售模式（session 讀不到銷售模式則略過，失敗不影響後續流程）
      try {
        const raw = sessionStorage.getItem('etlite_onboarding_state');
        const saved = raw ? JSON.parse(raw) : null;
        const salesMode: SalesModeType | null =
          saved?.company?.salesMode ?? null;

        if (salesMode && userInfo) {
          await retryAsync(
            () =>
              createOnboardingBasicSet({
                uuid,
                companyName: userInfo.companyName,
                companyAddr: userInfo.companyAddr,
                headName: userInfo.userName,
                taxIdNumber: userInfo.companyTaxId,
                introduction: saved?.company?.description ?? '',
                salesMode: SALES_MODE_CODE[salesMode],
              }),
            RETRY_OPTIONS
          );
        }
      } catch (error) {
        console.error('[payment-check] createOnboardingBasicSet 失敗', error);
      }

      // 5. 開立帳單
      try {
        await retryAsync(
          () => setupAutopaymentBill({ uuid, merchantTradeNo }),
          RETRY_OPTIONS
        );
      } catch (error) {
        console.error('[payment-check] setupAutopaymentBill 失敗', error);
        toast.error('帳單開立失敗，請聯繫客服');
      }

      // 6. 若有電子發票商品則初始化電子發票用戶資料
      const hasEInvoice = productIds.some(code =>
        EINVOICE_CODES.includes(code)
      );
      if (hasEInvoice) {
        try {
          await retryAsync(() => initEInvoiceBasicSet(uuid), RETRY_OPTIONS);
        } catch (error) {
          console.error('[payment-check] initEInvoiceBasicSet 失敗', error);
          toast.error('電子發票設定失敗，請聯繫客服');
        }
      }

      router.push(
        `/onboarding/payment/success?no=${merchantTradeNo}&uuid=${uuid}`
      );
    };

    if (!merchantTradeNo || !tradeNo || !uuid) {
      setParamError(true);
      return;
    }

    // 超時保護：60 秒後強制導向成功頁（避免卡在處理中）
    // worst case 重試延遲約 9 支 × 2 次 × 0.8s ≈ 14s，遠低於此上限
    const timeout = setTimeout(() => {
      toast.error('處理逾時，請聯繫客服確認訂單狀態');
      router.push(
        `/onboarding/payment/success?no=${merchantTradeNo}&uuid=${uuid}`
      );
    }, 60000);

    processPayment().finally(() => clearTimeout(timeout));
  }, [amount, merchantTradeNo, router, tradeNo, uuid]);

  if (paramError) {
    return (
      <div className='min-h-svh bg-surface-off-white flex items-center justify-center px-4'>
        <div className='text-center'>
          <p className='text-sm text-neutral-dark/60 mb-4'>
            連結參數有誤，無法處理此筆交易。
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className='text-sm text-brand-blue underline'
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-svh bg-surface-off-white flex items-center justify-center'>
      <OnboardingLoader description='交易處理中，請勿離開網頁或重新整理。' />
    </div>
  );
}
