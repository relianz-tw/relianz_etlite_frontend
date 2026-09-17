'use client';

import {
  step8CompanySchema,
  step8Schema,
  type Step8FormData,
} from '../../schemas';
import { useOnboarding } from '../../state/OnboardingContext';
import {
  mapStateToProducts,
  type ProductSummaryItem,
} from '../../utils/productMapping';
import Field from '../Field';
import {
  bindOnboardingCard,
  getOnboardingToken,
} from '@/api/onboarding/ecpayBinding';
import { getMerchantTradeCode } from '@/api/onboarding/ecpayPayment';
import {
  getPaymentServiceList,
  type PaymentServiceList,
} from '@/api/onboarding/paymentServices';
import {
  setupOnboardingPaymentUser,
  getOnboardingPaymentUser,
} from '@/api/onboarding/paymentUser';
import Button from '@/components/ui/Button';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import { ChevronLeft, CreditCard, Info } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type ContactErrors = Partial<Record<keyof Step8FormData, string>>;
type CompanyErrors = Record<string, string>;

function formatPrice(price: number): string {
  return price.toLocaleString('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  });
}

function actionLabel(action: number): string {
  if (action === 1) return ' / 月';
  if (action === 2) return ' / 年';
  return '（一次性）';
}

function formatDate(date: Date) {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}/${MM}/${dd} ${HH}:${mm}:${ss}`;
}

export function Step8Checkout() {
  const { state, dispatch } = useOnboarding();
  const {
    billingCycle,
    selectedPlanId,
    selectedAddOnCodes,
    userUuid,
    company,
    taxId,
  } = state;
  const searchParams = useSearchParams();
  const retryUuid = searchParams.get('uuid'); // 從付款失敗頁帶回的 uuid
  const skipToPayment = searchParams.get('pay') === '1'; // 失敗頁返回時直接跳到 ECPay

  const [serviceList, setServiceList] = useState<PaymentServiceList | null>(
    null
  );
  const [loadingServices, setLoadingServices] = useState(true);
  const [contact, setContact] = useState({ email: '', phone: '' });
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [companyForm, setCompanyForm] = useState({
    taxId: taxId ?? '',
    companyName: company.name ?? '',
    representative: company.representative ?? '',
    address: company.address ?? '',
  });
  const [companyErrors, setCompanyErrors] = useState<CompanyErrors>({});
  const [loading, setLoading] = useState(false);

  const [showBankPopup, setShowBankPopup] = useState(false);
  const bankPopupRef = useRef<HTMLDivElement>(null);

  // ECPay 相關狀態
  const [showECPay, setShowECPay] = useState(skipToPayment);
  const [isJQueryLoaded, setIsJQueryLoaded] = useState(false);
  const [isECPayInitialized, setIsECPayInitialized] = useState(false);
  const [isECPayLoading, setIsECPayLoading] = useState(false);
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);
  const [_merchantTradeNo, setMerchantTradeNo] = useState('');
  const [merchantMemberID, setMerchantMemberID] = useState('');
  const [merchantTradeDate] = useState(() => formatDate(new Date()));

  useEffect(() => {
    getPaymentServiceList()
      .then(res => setServiceList(res))
      .catch(() => toast.error('取得服務清單失敗，請重新整理'))
      .finally(() => setLoadingServices(false));
  }, []);

  useEffect(() => {
    if (!showBankPopup) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        bankPopupRef.current &&
        !bankPopupRef.current.contains(e.target as Node)
      ) {
        setShowBankPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBankPopup]);

  // 從付款失敗頁回來：用 uuid 從 API 取得資料（不依賴 session）
  useEffect(() => {
    let stored = '';
    try {
      stored = localStorage.getItem('etlite_onboarding_uuid') ?? '';
    } catch {
      /* storage 不可用，忽略 */
    }
    const uuid = retryUuid || userUuid || stored;
    if (!uuid) return;
    getOnboardingPaymentUser(uuid)
      .then(res => {
        const d = res.userInfo;
        if (!d) return;
        setCompanyForm({
          taxId: d.companyTaxId ?? '',
          companyName: d.companyName ?? '',
          representative: d.userName ?? '',
          address: d.companyAddr ?? '',
        });
        setContact({
          email: d.email ?? '',
          phone: d.phone ?? '',
        });
      })
      .catch(() => {}); // 取不到資料就讓用戶自行填寫
  }, [retryUuid, userUuid]); // eslint-disable-line react-hooks/exhaustive-deps

  // 從付款失敗頁返回時，自動初始化 ECPay（skipToPayment=true 且 jQuery 已載入且聯絡資訊已取得）
  const hasAutoInitialized = useRef(false);
  useEffect(() => {
    if (!skipToPayment || !isJQueryLoaded || !contact.email) return;
    if (hasAutoInitialized.current) return;

    const uuid = retryUuid || userUuid;
    if (!uuid) return;

    hasAutoInitialized.current = true;
    setMerchantMemberID(uuid);

    const autoInit = async () => {
      try {
        const tradeNo = await getMerchantTradeCode();
        setMerchantTradeNo(tradeNo);
        await initECPay(tradeNo, uuid, contact.email, contact.phone);
      } catch (err) {
        hasAutoInitialized.current = false; // 失敗時允許重試
        toast.error(
          err instanceof Error ? err.message : '付款系統載入失敗，請重試'
        );
      }
    };

    autoInit();
  }, [skipToPayment, isJQueryLoaded, contact.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const mapping = serviceList
    ? mapStateToProducts(
        { billingCycle, selectedPlanId, selectedAddOnCodes },
        serviceList
      )
    : null;

  const updateContact = (key: 'email' | 'phone', value: string) => {
    setContact(prev => ({ ...prev, [key]: value }));
    setContactErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const updateCompany = (key: string, value: string) => {
    setCompanyForm(prev => ({ ...prev, [key]: value }));
    setCompanyErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // 驗證表單並顯示 ECPay
  const handleSubmit = async () => {
    setContactErrors({});
    setCompanyErrors({});

    const companyResult = step8CompanySchema.safeParse(companyForm);
    const contactResult = step8Schema.safeParse(contact);

    let hasError = false;

    if (!companyResult.success) {
      const fe: CompanyErrors = {};
      for (const issue of companyResult.error.issues) {
        const field = String(issue.path[0]);
        if (!fe[field]) fe[field] = issue.message;
      }
      setCompanyErrors(fe);
      hasError = true;
    }

    if (!contactResult.success) {
      const fe: ContactErrors = {};
      for (const issue of contactResult.error.issues) {
        const field = issue.path[0] as keyof Step8FormData;
        if (!fe[field]) fe[field] = issue.message;
      }
      setContactErrors(fe);
      hasError = true;
    }

    if (hasError) return;

    if (!mapping || mapping.productIds.length === 0) {
      toast.error('尚未選擇方案，請返回上一步');
      return;
    }

    setLoading(true);
    try {
      dispatch({ type: 'SET_TAX_ID', payload: companyForm.taxId });
      dispatch({
        type: 'SET_COMPANY',
        payload: {
          name: companyForm.companyName,
          representative: companyForm.representative,
          address: companyForm.address,
        },
      });
      dispatch({
        type: 'SET_CONTACT',
        payload: { email: contact.email, phone: contact.phone },
      });

      // 直接寫入 sessionStorage，避免 React 批次更新在導頁前來不及持久化
      try {
        const raw = sessionStorage.getItem('etlite_onboarding_state');
        const stored = raw ? JSON.parse(raw) : {};
        stored.contact = { email: contact.email, phone: contact.phone };
        sessionStorage.setItem('etlite_onboarding_state', JSON.stringify(stored));
      } catch {
        /* storage 不可用，忽略 */
      }

      // 建立付款用戶並儲存基本資料到後端
      await setupOnboardingPaymentUser({
        uuid: userUuid,
        companyName: companyForm.companyName,
        companyTaxId: companyForm.taxId,
        companyAddr: companyForm.address,
        userName: companyForm.representative,
        phone: contact.phone,
        email: contact.email,
      });

      // 取得交易編號
      const tradeNo = await getMerchantTradeCode();
      setMerchantTradeNo(tradeNo);
      setMerchantMemberID(userUuid);

      // 儲存 uuid 到 localStorage，確保失敗後任何路徑回來都能取得
      try {
        localStorage.setItem('etlite_onboarding_uuid', userUuid);
      } catch {
        /* storage 不可用，忽略 */
      }

      // 切換到 ECPay 畫面後等一個 tick 讓 DOM 更新
      setShowECPay(true);
      await new Promise(resolve => setTimeout(resolve, 50));

      await initECPay(tradeNo, userUuid, contact.email, contact.phone);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : '初始化付款失敗，請重試'
      );
      setLoading(false);
    }
  };

  const initECPay = async (
    tradeNo: string,
    memberID: string,
    email: string,
    phone: string
  ) => {
    setIsECPayLoading(true);
    try {
      const src = process.env.NEXT_PUBLIC_ECPAY_SDK;
      if (!src) throw new Error('ECPay SDK URL 未設定');

      if (typeof window.$ === 'undefined') throw new Error('jQuery 尚未載入');

      if (typeof window.ECPay === 'undefined') {
        document
          .querySelectorAll('script[src*="ecpay"]')
          .forEach(s => s.remove());
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = false;
          script.defer = false;
          script.onload = () => setTimeout(resolve, 100);
          script.onerror = () => reject(new Error('ECPay SDK 載入失敗'));
          document.head.appendChild(script);
        });
      }

      const ConsumerInfo = {
        MerchantMemberID: memberID,
        Email: email,
        Phone: phone,
      };
      const OrderInfo = {
        MerchantTradeDate: merchantTradeDate,
        MerchantTradeNo: tradeNo,
        TotalAmount: 5,
        TradeDesc: 'RELIANZ 友信創新服務費',
        ItemName: 'RELIANZ 友信創新服務費',
        ReturnURL: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ''}/ael`,
      };

      const res = await getOnboardingToken(
        ConsumerInfo,
        OrderInfo,
        '/api/onboardingBind'
      );
      if (!res?.Token) throw new Error('Token 獲取失敗');

      const envi =
        process.env.NEXT_PUBLIC_ECPAY_ENVIRONMENT === 'PROD' ? 'Prod' : 'Stage';

      ECPay.initialize(envi, 1, async function (errMsg: unknown) {
        if (errMsg != null) {
          toast.error('付款系統初始化失敗');
          return;
        }
        ECPay.addBindingCard(
          res.Token,
          ECPay.Language.zhTW,
          function (err: unknown) {
            if (err != null) {
              toast.error('信用卡表單載入失敗');
              return;
            }
            setIsECPayInitialized(true);
            setIsECPayLoading(false);
          }
        );
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '付款系統載入失敗');
      setIsECPayLoading(false);
    }
  };

  // 送出信用卡
  const handleCardSubmit = async () => {
    setIsSubmittingCard(true);
    try {
      const getToken = await new Promise((resolve, reject) => {
        ECPay.getBindCardPayToken(
          (BindCardPayToken: unknown, errMsg: unknown) => {
            if (errMsg != null) {
              reject(errMsg);
              return;
            }
            resolve(BindCardPayToken);
          }
        );
      });

      const res = await bindOnboardingCard(
        (getToken as { BindCardPayToken: string }).BindCardPayToken,
        merchantMemberID
      );

      if (res.RtnCode === 1) {
        window.location.href = res.ThreeDInfo.ThreeDURL;
      } else {
        toast.error('信用卡綁定失敗，請確認卡片資訊');
        setIsSubmittingCard(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '付款失敗，請重試');
      setIsSubmittingCard(false);
    }
  };

  return (
    <div className='flex flex-col md:flex-row min-h-full md:flex-1 md:min-h-0'>
      {/* 左欄：方案與服務內容 */}
      <div className='md:order-1 w-full md:w-2/5 bg-surface-off-white flex flex-col p-5 md:p-12 gap-6 md:overflow-y-auto'>
        <button
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          className='hidden md:flex items-center gap-1 text-sm text-neutral-dark/50 hover:text-neutral-dark transition-colors self-start'
        >
          <ChevronLeft size={16} /> 上一頁
        </button>
        <h1 className='text-xl md:text-2xl font-bold text-neutral-dark font-notoSerif'>
          EasyTax 領航方案
        </h1>

        {loadingServices ? (
          <div className='h-16 rounded-lg bg-surface-cream animate-pulse' />
        ) : mapping ? (
          <div className='flex flex-col rounded-lg border border-surface-cream overflow-hidden'>
            {mapping.productSummary.map(
              (item: ProductSummaryItem, idx: number) => (
                <div
                  key={item.code}
                  className={`flex items-center justify-between px-4 py-3 bg-white ${
                    idx < mapping.productSummary.length - 1
                      ? 'border-b border-surface-cream'
                      : ''
                  }`}
                >
                  <span className='text-sm text-neutral-dark'>{item.name}</span>
                  <span className='text-sm font-semibold text-brand-blue'>
                    {formatPrice(item.price)}
                    {actionLabel(item.action)}
                  </span>
                </div>
              )
            )}
          </div>
        ) : null}

        <p className='text-xs md:text-sm text-neutral-dark/60'>
          訂閱後享有{' '}
          <span className='font-semibold text-brand-blue'>7 天免費試用</span>，
          <strong className='  text-brand-blue'>
            試用期結束後才會開始收費
          </strong>
          ，試用期間不提供稅務申報服務，如需提早轉成正式方案請洽客服。
        </p>
      </div>

      {/* 右欄：表單 or ECPay */}
      <div className='md:order-2 w-full md:w-3/5 bg-white flex flex-col p-5 md:p-12 md:overflow-y-auto'>
        {/* jQuery 預先載入，確保 ECPay SDK 可用 */}
        <Script
          src='https://code.jquery.com/jquery-3.5.1.min.js'
          strategy='afterInteractive'
          onLoad={() => setIsJQueryLoaded(true)}
        />

        {!showECPay ? (
          /* 公司資訊 + 聯絡資訊表單 */
          <div className='flex flex-col gap-5 mt-8'>
            <h2 className='text-lg font-semibold text-neutral-dark'>
              公司資訊
            </h2>

            <Field
              label='統一編號（選填）'
              value={companyForm.taxId}
              onChange={e =>
                updateCompany(
                  'taxId',
                  e.target.value.replace(/\D/g, '').slice(0, 8)
                )
              }
              maxLength={8}
              inputMode='numeric'
              error={!!companyErrors.taxId}
              errorMessage={companyErrors.taxId}
            />
            <Field
              label='公司名稱'
              required
              value={companyForm.companyName}
              onChange={e => updateCompany('companyName', e.target.value)}
              error={!!companyErrors.companyName}
              errorMessage={companyErrors.companyName}
            />
            <Field
              label='代表人姓名'
              required
              value={companyForm.representative}
              onChange={e => updateCompany('representative', e.target.value)}
              error={!!companyErrors.representative}
              errorMessage={companyErrors.representative}
            />
            <Field
              label='Email'
              required
              type='email'
              value={contact.email}
              onChange={e => updateContact('email', e.target.value)}
              error={!!contactErrors.email}
              errorMessage={contactErrors.email}
              placeholder='example@company.com'
            />
            <p className='text-xs text-neutral-dark/50 -mt-3'>
              帳號密碼將寄送至您填寫的 Email，請確認信箱正確。
            </p>
            <Field
              label='手機號碼'
              required
              type='tel'
              value={contact.phone}
              onChange={e =>
                updateContact(
                  'phone',
                  e.target.value.replace(/\D/g, '').slice(0, 10)
                )
              }
              placeholder='0912345678'
              inputMode='numeric'
              error={!!contactErrors.phone}
              errorMessage={contactErrors.phone}
            />
            <Field
              label='公司地址'
              required
              value={companyForm.address}
              onChange={e => updateCompany('address', e.target.value)}
              error={!!companyErrors.address}
              errorMessage={companyErrors.address}
            />
            <MobileFixedBottom className='md:!pt-2'>
              <Button
                onClick={handleSubmit}
                disabled={loading || loadingServices}
                className='w-full'
              >
                {loading ? '處理中...' : '下一步'}
              </Button>
            </MobileFixedBottom>
          </div>
        ) : (
          /* ECPay 付款區塊 */
          <div className='flex flex-col gap-4 mt-4 md:mt-8 flex-1'>
            <h2 className='text-lg font-semibold text-neutral-dark'>
              付款資訊
            </h2>
            <p className='text-sm text-neutral-dark/60 leading-relaxed'>
              為驗證您的付款方式，系統將會發起一筆 NT$5
              的測試扣款，驗證成功後隨即全額退款，請安心操作。
            </p>

            {/* 信用卡品牌 + 支援銀行資訊（lucide 無各卡別品牌圖示，改單一圖示＋文字標示） */}
            <div className='flex items-center gap-2'>
              <CreditCard size={20} className='text-neutral-dark/35' />
              <span className='text-xs text-neutral-dark/50'>
                支援 VISA / MasterCard / JCB
              </span>
              <div
                className='relative'
                ref={bankPopupRef}
                onMouseEnter={() => setShowBankPopup(true)}
                onMouseLeave={() => setShowBankPopup(false)}
              >
                <button
                  onClick={() => setShowBankPopup(v => !v)}
                  className='flex items-center gap-1 text-neutral-dark/35 hover:text-neutral-dark/55 transition-colors'
                  aria-label='查看支援銀行'
                >
                  <Info size={14} />
                  <span className='text-xs'>支援銀行</span>
                </button>
                {showBankPopup && (
                  <div className='absolute left-0 top-full mt-2 z-50 bg-white border border-surface-cream rounded-lg shadow-level1 p-3 w-48'>
                    <p className='text-xs font-medium text-neutral-dark mb-2'>
                      支援信用卡銀行（27間）
                    </p>
                    <div className='grid grid-cols-2 gap-x-2 gap-y-1'>
                      {[
                        '國泰世華',
                        '台新銀行',
                        '中國信託',
                        '台北富邦',
                        '第一銀行',
                        '華南銀行',
                        '合作金庫',
                        '彰化銀行',
                        '玉山銀行',
                        '元大銀行',
                        '永豐銀行',
                        '兆豐銀行',
                        '凱基銀行',
                        'DBS星展',
                        '安泰銀行',
                        '上海商銀',
                        '匯豐銀行',
                        '新光銀行',
                        '遠東商銀',
                        '臺灣企銀',
                        '渣打銀行',
                        '台中銀行',
                        '華泰銀行',
                        '陽信銀行',
                        '三信商銀',
                        '聯邦銀行',
                        '樂天信用卡',
                      ].map(bank => (
                        <span
                          key={bank}
                          className='text-xs text-neutral-dark/65 leading-relaxed'
                        >
                          {bank}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ECPay widget 容器，白色背景 + 圓角 */}
            <div className='bg-white rounded-xl p-2 md:px-4 md:py-4'>
              {isECPayLoading && (
                <div className='flex items-center justify-center py-8'>
                  <span className='text-sm text-neutral-dark/50'>
                    載入付款系統中...
                  </span>
                </div>
              )}
              <div id='ECPayPayment' />
            </div>

            <MobileFixedBottom className='md:!pt-2'>
              <Button
                onClick={handleCardSubmit}
                disabled={!isECPayInitialized || isSubmittingCard}
                className='w-full'
              >
                {isSubmittingCard ? '處理中...' : '開始免費試用'}
              </Button>
            </MobileFixedBottom>
          </div>
        )}
      </div>
    </div>
  );
}
