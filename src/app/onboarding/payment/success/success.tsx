'use client';

import {
  getShopList,
  getSubscriptionList,
} from '@/api/onboarding/ecpayPayment';
import { getPaymentServiceList } from '@/api/onboarding/paymentServices';
import { getOnboardingPaymentUser } from '@/api/onboarding/paymentUser';
import { OnboardingLoader } from '@/features/onboarding/components/OnboardingLoader';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import { CircleCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ShopItem {
  productId: string;
  productName: string;
  price: number;
  cycle: '年' | '月' | '';
}

export default function Success() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const merchantTradeNo = searchParams.get('no') ?? '';
  const uuid = searchParams.get('uuid') ?? '';
  const [data, setData] = useState<ShopItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [paramError, setParamError] = useState(false);
  const [trialEndStr, setTrialEndStr] = useState('');

  useEffect(() => {
    try {
      sessionStorage.removeItem('etlite_onboarding_state');
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem('etlite_onboarding_uuid');
    } catch {
      /* ignore */
    }

    if (!uuid) return;

    getOnboardingPaymentUser(uuid)
      .then(res => {
        const userInfo = res.userInfo;
        if (userInfo?.email) setEmail(userInfo.email);
      })
      .catch(() => {
        /* 取不到用戶資料不影響主要功能 */
      });

    // 從訂閱清單取得試用到期日（B001 或 B002）
    getSubscriptionList(uuid)
      .then(list => {
        const trial = (list ?? []).find(
          item =>
            (item.productId === 'B001' || item.productId === 'B002') &&
            item.trialEndTime
        );
        if (trial?.trialEndTime) {
          setTrialEndStr(trial.trialEndTime.slice(0, 10));
        }
      })
      .catch(() => {
        /* 取不到試用到期日不影響主要功能 */
      });
  }, [uuid]);

  useEffect(() => {
    if (!merchantTradeNo) {
      setParamError(true);
      setIsLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      setIsLoading(false);
      toast.error('載入逾時，請重新整理頁面');
    }, 30000);

    const getData = async () => {
      try {
        const [shopList, serviceResponse] = await Promise.all([
          getShopList(merchantTradeNo),
          getPaymentServiceList(),
        ]);

        const allServices = [
          ...(serviceResponse.acYearSer ?? []).map(s => ({
            ...s,
            cycle: '年' as const,
          })),
          ...(serviceResponse.acMonthSer ?? []).map(s => ({
            ...s,
            cycle: '月' as const,
          })),
        ];

        const items: ShopItem[] = (shopList ?? []).map(code => {
          const svc = allServices.find(s => s.code === code);
          return {
            productId: code,
            productName: svc?.name ?? code,
            price: svc?.price ?? 0,
            cycle: svc?.cycle ?? '',
          };
        });
        setData(items);
      } catch {
        toast.error('載入交易資料時發生錯誤');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    getData().finally(() => clearTimeout(timeout));
  }, [merchantTradeNo]);

  if (isLoading) {
    return (
      <div className='h-svh bg-surface-off-white flex items-center justify-center'>
        <OnboardingLoader description='載入資料中...' />
      </div>
    );
  }

  if (paramError) {
    return (
      <div className='h-svh bg-surface-off-white flex items-center justify-center px-4'>
        <div className='text-center'>
          <p className='text-sm text-neutral-dark/60 mb-4'>
            連結參數有誤，無法載入交易資料。
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

  // 取主要方案（第一個有價格的項目）
  const mainPlan = data?.find(i => i.price > 0);
  const planLabel = mainPlan
    ? `${mainPlan.productName}・NT$${mainPlan.price.toLocaleString('zh-TW')}${
        mainPlan.cycle ? ` / ${mainPlan.cycle}` : ''
      }`
    : '';

  return (
    <div className='h-svh bg-surface-off-white flex flex-col overflow-hidden'>
      {/* 可捲動內容區 */}
      <div className='flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] flex flex-col items-center px-4 pt-8 pb-4'>
        <div className='w-full max-w-lg'>
          {/* 標題 */}
          <h1 className='text-3xl font-bold text-center text-neutral-dark mb-6 font-notoSerif'>
            歡迎加入 EasyTax
          </h1>
          {/* 免費試用卡片 */}
          <div className='bg-white rounded-2xl overflow-hidden mb-4 border border-surface-cream'>
            {/* 標題列 */}
            <div className='bg-semantic-success px-6 py-4'>
              <div className='flex items-center gap-2 mb-1'>
                <span className='text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full'>
                  免費試用
                </span>
              </div>
              <p className='text-white font-semibold text-base'>
                信用卡驗證成功
              </p>
              {email && (
                <p className='text-xs text-white/70 mt-1'>
                  帳號密碼將寄至{' '}
                  <span className='text-white font-medium'>{email}</span>
                </p>
              )}
            </div>

            <div className='px-6 py-5 space-y-5'>
              {/* 試用期時間軸 */}
              <div className='flex items-start gap-4'>
                <div className='flex flex-col items-center pt-1'>
                  <div className='w-2.5 h-2.5 rounded-full bg-semantic-success' />
                  <div className='w-px h-10 bg-surface-cream my-1' />
                  <div className='w-2.5 h-2.5 rounded-full bg-brand-blue' />
                </div>
                <div className='flex-1 space-y-3'>
                  <div>
                    <p className='text-xs text-neutral-dark/50'>今天開始</p>
                    <p className='text-sm font-medium text-neutral-dark'>
                      免費試用 7 天
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-neutral-dark/50'>到期日</p>
                    <p className='text-sm font-semibold text-brand-blue'>
                      {trialEndStr}
                    </p>
                  </div>
                </div>
              </div>

              {/* 分隔線 */}
              <div className='border-t border-surface-cream' />

              {/* 到期後扣款資訊 */}
              <div>
                <p className='text-xs text-neutral-dark/50 mb-1.5'>
                  到期後自動訂閱
                </p>
                {planLabel ? (
                  <p className='text-sm text-neutral-dark font-medium'>
                    {planLabel}
                  </p>
                ) : (
                  <p className='text-sm text-neutral-dark/40'>—</p>
                )}
                <p className='text-xs text-neutral-dark/40 mt-2 leading-relaxed'>
                  如欲調整方案或取消服務，請登入 EasyTax 至{' '}
                  <span className='text-neutral-dark/60 font-medium'>
                    設定 → 方案細節
                  </span>{' '}
                  進行變更。
                </p>
              </div>

              {/* 分隔線 */}
              <div className='border-t border-surface-cream' />

              {/* NT$5 退款 */}
              <div className='flex items-center gap-2'>
                <CircleCheck size={16} className='text-semantic-success shrink-0' />
                <p className='text-xs text-semantic-success font-semibold'>
                  本次驗證信用卡費用 NT$5 已退回
                </p>
              </div>
            </div>
          </div>

          {/* 客服區塊 */}
          <div className='bg-white rounded-2xl px-6 py-4 mb-6 border border-surface-cream'>
            <p className='text-xs text-neutral-dark/50 mb-3'>需要協助？</p>
            <p className='text-sm text-neutral-dark/70 leading-relaxed'>
              如有任何問題，歡迎透過 LINE
              官方帳號提問，或來電洽詢，我們很樂意為您服務！
            </p>
            <div className='flex items-center gap-3 mt-3'>
              <a
                href='https://page.line.me/relianz'
                target='_blank'
                rel='noopener noreferrer'
                className='flex-1 flex items-center justify-center py-2 rounded-lg border border-brand-line text-brand-line text-sm font-medium hover:bg-brand-line/5 transition-colors'
              >
                LINE 官方帳號
              </a>
              <a
                href='tel:+886-2-2659-0355'
                className='text-sm text-neutral-dark/50 hover:text-neutral-dark/70 transition-colors'
              >
                或來電 02-2659-0355
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 底部按鈕（手機版 fixed，桌面版 static） */}
      <MobileFixedBottom className='px-4 md:flex md:justify-center'>
        <button
          onClick={() => router.push('/')}
          className='w-full md:max-w-lg py-3 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue-dark transition-colors'
        >
          開始
        </button>
      </MobileFixedBottom>
    </div>
  );
}
