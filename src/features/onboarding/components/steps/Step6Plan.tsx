'use client';

import { useOnboarding } from '../../state/OnboardingContext';
import type { BillingCycleType } from '../../state/onboardingReducer';
import { leftPanelMobileTop, optionSelected } from '../../styles';
import { mapStateToProducts } from '../../utils/productMapping';
import { createProductUnpaid } from '@/api/onboarding/ecpayPayment';
import {
  getPaymentServiceList,
  type PaymentService,
} from '@/api/onboarding/paymentServices';
import Button from '@/components/ui/Button';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import { Check, ChevronLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const mediaList = ['/etlite/moneyudn_logo.png', '/etlite/MNEWS_logo.png'];

const PLAN_FEATURES = [
  {
    category: '線上記帳',
    items: [
      '超方便雲端帳簿',
      '免對帳自動化應收應付系統',
      '薪資系統',
      '勞報單系統',
      '電子發票系統（加購）',
      '財務儀表板',
    ],
  },
  {
    category: '報稅系統',
    items: ['營業稅申報系統', '各類扣繳申報系統', '營所稅申報系統'],
  },
];

function formatPrice(price: number): string {
  return `$${price.toLocaleString('zh-TW')}`;
}

function actionLabel(action: number): string {
  if (action === 1) return '/ 月';
  if (action === 2) return '/ 年';
  return '（一次性）';
}

export function Step6Plan() {
  const { state, dispatch } = useOnboarding();
  const { billingCycle, selectedPlanId, selectedAddOnCodes } = state;

  const [services, setServices] = useState<{
    acYearSer: PaymentService[];
    acMonthSer: PaymentService[];
  } | null>(null);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getPaymentServiceList()
      .then(res => setServices(res))
      .catch(() => toast.error('取得服務清單失敗，請重新整理'))
      .finally(() => setLoadingServices(false));
  }, []);

  // 依計費週期取得對應服務清單，並同步設定主方案 ID
  const currentList: PaymentService[] = services
    ? billingCycle === 1
      ? services.acYearSer ?? []
      : services.acMonthSer ?? []
    : [];

  const mainService = currentList.find(s => s.needed);
  const addOnServices = currentList.filter(s => !s.needed);

  // 主方案 ID 跟著計費週期自動更新
  useEffect(() => {
    if (mainService && mainService.code !== selectedPlanId) {
      dispatch({ type: 'SET_SELECTED_PLAN_ID', payload: mainService.code });
    }
  }, [mainService?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCycleChange = (cycle: BillingCycleType) => {
    // 切換前記錄電子發票與一次性項目是否已勾選
    const currentEinvoiceCode = billingCycle === 1 ? 'B004' : 'B003';
    const hadEinvoice = selectedAddOnCodes.includes(currentEinvoiceCode);
    const hadB005 = selectedAddOnCodes.includes('B005');
    const hadB006 = selectedAddOnCodes.includes('B006');

    // SET_BILLING_CYCLE 會清空 selectedAddOnCodes
    dispatch({ type: 'SET_BILLING_CYCLE', payload: cycle });

    // 帶入對應週期的電子發票代碼（B003↔B004），一次性費用原樣保留
    if (hadEinvoice) {
      dispatch({
        type: 'TOGGLE_ADD_ON',
        payload: cycle === 1 ? 'B004' : 'B003',
      });
    }
    if (hadB005) dispatch({ type: 'TOGGLE_ADD_ON', payload: 'B005' });
    if (hadB006) dispatch({ type: 'TOGGLE_ADD_ON', payload: 'B006' });
  };

  // 電子發票主項目：名稱含「電子發票」但不含「字軌」與「設定費」
  const isEinvoiceMain = (name: string) =>
    name.includes('電子發票') &&
    !name.includes('字軌') &&
    !name.includes('設定費');

  // 電子發票相依項目：開通設定費、電子發票字軌申請
  const isEinvoiceDependent = (name: string) =>
    name.includes('開通設定費') || name.includes('字軌申請');

  const einvoiceService = addOnServices.find(s => isEinvoiceMain(s.name));
  const einvoiceChecked = einvoiceService
    ? selectedAddOnCodes.includes(einvoiceService.code)
    : false;

  // 當電子發票已勾選時，相依項目的 code 集合（用於 UI disabled 判斷）
  const forcedCodes = new Set(
    einvoiceChecked
      ? addOnServices.filter(s => isEinvoiceDependent(s.name)).map(s => s.code)
      : []
  );

  const handleToggleAddOn = (code: string) => {
    const service = addOnServices.find(s => s.code === code);
    if (!service) return;

    // 相依項目在電子發票勾選時不可單獨操作
    if (forcedCodes.has(code)) return;

    const isCurrentlyChecked = selectedAddOnCodes.includes(code);
    dispatch({ type: 'TOGGLE_ADD_ON', payload: code });

    // 若操作的是電子發票主項目，同步處理相依項目
    if (isEinvoiceMain(service.name)) {
      const dependentCodes = addOnServices
        .filter(s => isEinvoiceDependent(s.name))
        .map(s => s.code);

      for (const depCode of dependentCodes) {
        const depChecked = selectedAddOnCodes.includes(depCode);
        if (!isCurrentlyChecked && !depChecked) {
          // 電子發票從未選→選：加入相依項目
          dispatch({ type: 'TOGGLE_ADD_ON', payload: depCode });
        } else if (isCurrentlyChecked && depChecked) {
          // 電子發票從選→未選：移除相依項目
          dispatch({ type: 'TOGGLE_ADD_ON', payload: depCode });
        }
      }
    }
  };

  return (
    <div className='flex flex-col md:flex-row min-h-full md:flex-1 md:min-h-0'>
      {/* 左欄：方案功能列表 */}
      <div className={`${leftPanelMobileTop} order-2 md:order-1 gap-6`}>
        <button
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          className='hidden md:flex items-center gap-1 text-sm text-neutral-dark/60 hover:text-neutral-dark transition-colors'
        >
          <ChevronLeft size={16} /> 上一頁
        </button>
        <h2 className='text-xl md:text-2xl font-semibold font-notoSerif'>
          EasyTax 領航方案
        </h2>

        {PLAN_FEATURES.map(section => (
          <div key={section.category}>
            <p className='text-base md:text-lg font-semibold mb-2'>
              {section.category}
            </p>
            <ul className='space-y-1'>
              {section.items.map(item => (
                <li
                  key={item}
                  className='text-sm md:text-base text-neutral-dark/70 flex items-center gap-2'
                >
                  <Check size={16} className='shrink-0 text-brand-tan' />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className='pt-4 border-t border-surface-cream flex flex-col gap-1'>
          <p className='text-sm md:text-base text-neutral-dark/50'>
            7 天免費試用
          </p>
        </div>

        {/* 手機版媒體報導 */}
        <div className='md:hidden flex items-center justify-center gap-4 pt-2'>
          <p className='text-xs font-bold text-neutral-dark/50 shrink-0'>
            媒體報導
          </p>
          {mediaList.map(pic => (
            <div key={pic} className='relative w-[72px] h-6 shrink-0'>
              {/* 全站慣例用原生 img，不使用 next/image */}
              <img
                src={pic}
                alt='媒體 logo'
                className='absolute inset-0 w-full h-full object-contain'
              />
            </div>
          ))}
        </div>
      </div>

      {/* 右欄：操作區 */}
      <div className='order-1 md:order-2 w-full md:w-3/5 bg-white flex flex-col p-5 md:p-12 md:overflow-y-auto'>
        <div className='flex flex-col gap-6 md:mt-8 mt-0'>
          <h1 className='text-xl md:text-2xl font-bold text-neutral-dark font-notoSerif'>
            準備好跟手動記帳報稅說
            <br />
            Bye Bye 了嗎？
          </h1>

          {/* 計費週期切換 */}
          <div className='flex items-center gap-3'>
            <div className='flex rounded-lg border border-surface-cream overflow-hidden'>
              {([0, 1] as BillingCycleType[]).map(cycle => (
                <button
                  key={cycle}
                  onClick={() => handleCycleChange(cycle)}
                  className={`px-6 py-2 text-sm font-medium transition-colors ${
                    billingCycle === cycle
                      ? optionSelected
                      : 'bg-white text-neutral-dark hover:bg-surface-off-white'
                  }`}
                >
                  {cycle === 0 ? '月繳' : '年繳'}
                </button>
              ))}
            </div>

            <span className='inline-flex items-center gap-1 rounded-full bg-semantic-success/10 border border-semantic-success/30 px-3 py-1 text-sm font-semibold text-semantic-success whitespace-nowrap'>
              年繳省 23%
            </span>
          </div>

          {/* 服務清單 */}
          {loadingServices ? (
            <div className='flex items-center gap-2 text-sm text-neutral-dark/50'>
              <Loader2 size={14} className='animate-spin' /> 載入服務清單...
            </div>
          ) : (
            <div className='flex flex-col gap-3'>
              {/* 必選方案 */}
              {mainService && (
                <div className='rounded-xl border-2 border-brand-blue p-4 flex flex-col gap-2'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex flex-col gap-1 flex-1'>
                      <div className='flex items-center gap-2'>
                        <p className='text-sm font-semibold text-neutral-dark'>
                          {mainService.name}
                        </p>
                        <span className='text-[11px] bg-brand-blue/10 text-brand-blue rounded px-1.5 py-0.5 font-medium'>
                          必選
                        </span>
                      </div>
                      <p className='text-xs text-neutral-dark/60 leading-relaxed'>
                        {mainService.content}
                      </p>
                    </div>
                    <div className='text-right shrink-0'>
                      <p className='text-base md:text-xl font-bold text-neutral-dark'>
                        {formatPrice(mainService.price)}
                        <span className='text-xs font-normal text-neutral-dark/50 ml-1'>
                          {actionLabel(mainService.action)}
                        </span>
                      </p>
                      {mainService.action === 2 && (
                        <p className='text-xs text-neutral-dark/40 mt-0.5'>
                          {formatPrice(Math.round(mainService.price / 12))} / 月
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 加購項目 */}
              {addOnServices.length > 0 && (
                <div className='flex flex-col gap-2'>
                  <p className='text-xs font-medium text-neutral-dark/50'>
                    加購項目（可選）
                  </p>
                  {addOnServices.map(service => {
                    const checked = selectedAddOnCodes.includes(service.code);
                    const isForced = forcedCodes.has(service.code);
                    return (
                      <label
                        key={service.code}
                        className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                          isForced
                            ? 'border-brand-blue/40 bg-brand-blue/5 cursor-default'
                            : checked
                              ? 'border-brand-blue bg-brand-blue/5 cursor-pointer'
                              : 'border-surface-cream hover:border-neutral-blue-gray/50 cursor-pointer'
                        }`}
                      >
                        <input
                          type='checkbox'
                          checked={checked}
                          disabled={isForced}
                          onChange={() => handleToggleAddOn(service.code)}
                          className='mt-0.5 accent-brand-blue shrink-0'
                        />
                        <div className='flex flex-col gap-0.5 flex-1 min-w-0'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <p className='text-sm font-medium text-neutral-dark'>
                              {service.name}
                            </p>
                            {isForced && (
                              <span className='text-[11px] bg-brand-blue/10 text-brand-blue rounded px-1.5 py-0.5 font-medium whitespace-nowrap shrink-0'>
                                電子發票必選
                              </span>
                            )}
                          </div>
                          <p className='text-xs text-neutral-dark/60 leading-relaxed'>
                            {service.content}
                          </p>
                        </div>
                        <div className='text-right shrink-0'>
                          <p className='text-sm md:text-base font-semibold text-neutral-dark whitespace-nowrap'>
                            {formatPrice(service.price)}
                            <span className='ml-1 text-xs font-normal text-neutral-dark/50'>
                              {actionLabel(service.action)}
                            </span>
                          </p>
                          {service.action === 2 && (
                            <p className='text-xs text-neutral-dark/40 mt-0.5'>
                              {formatPrice(Math.round(service.price / 12))} / 月
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 電子發票提示 */}
              {einvoiceChecked && (
                <div className='rounded-lg border border-brand-tan/40 bg-brand-tan/10 p-4'>
                  <p className='text-sm text-neutral-dark leading-relaxed'>
                    <span className='font-semibold'>電子發票注意事項：</span>
                    電子發票需向國稅局申請專屬字軌。系統於試用期間暫不開放此功能，將在您的試用期結束、正式啟用後，立即為您啟動申請流程。
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 免責文字 */}
          <div className='text-xs text-neutral-dark/40 space-y-1'>
            <p>方案可隨時取消，試用期後會開始自動扣款</p>
            <p>首年優惠價格僅限於 EasyTax 領航方案</p>
          </div>
        </div>

        <MobileFixedBottom>
          <Button
            onClick={async () => {
              if (!services || !selectedPlanId) return;
              const mapping = mapStateToProducts(
                { billingCycle, selectedPlanId, selectedAddOnCodes },
                services
              );
              if (mapping.productIds.length === 0) {
                toast.error('尚未選擇方案，請重新整理');
                return;
              }
              setSubmitting(true);
              try {
                const uuid = uuidv4();
                await createProductUnpaid({
                  userUuid: uuid,
                  productIds: mapping.productIds,
                });
                dispatch({ type: 'SET_USER_UUID', payload: uuid });
                dispatch({ type: 'NEXT_STEP' });
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : '建立訂單失敗，請重試'
                );
              } finally {
                setSubmitting(false);
              }
            }}
            className='w-full'
            disabled={loadingServices || !selectedPlanId || submitting}
          >
            {submitting ? '處理中...' : '立即開始免費 7 天試用'}
          </Button>
        </MobileFixedBottom>
      </div>
    </div>
  );
}
