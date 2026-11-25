'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { lookupCompany } from '@/api/onboarding/companyLookup';
import { StepPageHeader } from '@/components/initialization/StepPageHeader';
import Button from '@/components/ui/Button';
import SectionCard from '@/components/ui/SectionCard';
import TextInput from '@/components/ui/TextInput';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { Loader2, Search } from 'lucide-react';
import { useInitialization } from '../../state/InitializationContext';
import type { InitializationState } from '../../state/initializationReducer';
import { inferOrgType } from '../../reports/registrationDocs';
import { readOnboardingCompany } from '../../utils/onboardingCompany';

type PaymentKey = keyof InitializationState['payment'];

/** 必填：公司名稱決定下一頁要上傳哪一組登記文件，所以不能留白 */
const REQUIRED_KEYS: PaymentKey[] = ['taxId', 'companyName', 'representative', 'address', 'email', 'phone'];

/** 簡單格式檢查：有 @ 且網域含 .，不做完整 RFC 驗證（與 Step3CompanyInfo 一致） */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^09\d{8}$/;

/** 付款資料 → 封面欄位（各份文件共用的公司識別欄位，寫進封面會自動同步到其餘報表） */
const PAYMENT_TO_COVER: Partial<Record<PaymentKey, string>> = {
  taxId: 'HDR_VAT_NO',
  companyName: 'HDR_COMPANY_NAME',
  representative: 'HDR_OWNER_NAME',
  address: 'HDR_ADDRESS',
};

/** 付款資料 → state.company（未滿一年那條路線沒有封面，公司資料直接讀這裡） */
type CompanyTextKey = keyof Pick<InitializationState['company'], 'taxId' | 'name' | 'representative' | 'address' | 'contactEmail' | 'contactPhone'>;
const PAYMENT_TO_COMPANY: Record<PaymentKey, CompanyTextKey> = {
  taxId: 'taxId',
  companyName: 'name',
  representative: 'representative',
  address: 'address',
  // 這一步收的是聯絡用的信箱與手機，不是負責人市話（company.phone）
  email: 'contactEmail',
  phone: 'contactPhone',
};

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className='mb-1.5 block text-sm font-semibold text-neutral-dark'>
        {label}
        {required && <span className='ml-0.5 text-semantic-error'>*</span>}
      </label>
      {children}
      {hint && <p className='mt-1 text-xs text-neutral-mid'>{hint}</p>}
    </div>
  );
}

/**
 * 步驟 2：付款資料（測試用）。
 * 正式流程在開帳前會有付款環節，那裡已經拿得到這些公司資料，但還沒串接（付款完成頁甚至會先把
 * onboarding 的暫存清掉），所以先做這一頁讓人手動輸入。這裡的統一編號決定下一頁要上傳哪一組登記文件。
 */
export function PaymentInfoPage() {
  const { state, dispatch } = useInitialization();
  const { payment } = state;
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // 首次進入時帶入 onboarding 已填的公司資料（只補空白欄位，不覆蓋已輸入的值）
  useEffect(() => {
    const prefill = readOnboardingCompany();
    if (!prefill) return;
    const patch: Partial<InitializationState['payment']> = {};
    if (prefill.taxId && !payment.taxId) patch.taxId = prefill.taxId;
    if (prefill.name && !payment.companyName) patch.companyName = prefill.name;
    if (prefill.representative && !payment.representative) patch.representative = prefill.representative;
    if (prefill.address && !payment.address) patch.address = prefill.address;
    if (Object.keys(patch).length > 0) dispatch({ type: 'SET_PAYMENT_INFO', payload: patch });
    // 僅首次掛載時預填
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bind = (key: PaymentKey) => ({
    value: payment[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_PAYMENT_INFO', payload: { [key]: e.target.value } }),
  });

  const handleLookup = async () => {
    setLooking(true);
    setLookupError('');
    try {
      const data = await lookupCompany(payment.taxId);
      // 後端查得到但某幾格缺席是常態（商號常常沒有負責人、地址），缺的留空讓使用者自己填，不清掉已輸入的值
      dispatch({
        type: 'SET_PAYMENT_INFO',
        payload: {
          ...(data.companyName ? { companyName: data.companyName } : {}),
          ...(data.representative ? { representative: data.representative } : {}),
          ...(data.address ? { address: data.address } : {}),
        },
      });
      if (!data.companyName) setLookupError('查無這個統一編號的公司資料，請自行填寫下方欄位');
    } catch (error) {
      // 檢查碼由後端驗，錯誤訊息（如「統一編號格式不正確」）直接給使用者看
      setLookupError(getFriendlyErrorMessage(error, '查詢失敗，請自行填寫下方欄位'));
    } finally {
      setLooking(false);
    }
  };

  const emailInvalid = payment.email !== '' && !EMAIL_PATTERN.test(payment.email.trim());
  const phoneInvalid = payment.phone !== '' && !MOBILE_PATTERN.test(payment.phone.trim());
  const missingRequired = REQUIRED_KEYS.some(key => payment[key].trim() === '');

  const handleNext = () => {
    // 封面是公司資料的主要入口，共用欄位寫進去會自動同步到其餘報表；只補空白，不蓋掉已經填過的值
    const cover = state.reports.CIT_COVER?.fields ?? {};
    for (const [from, to] of Object.entries(PAYMENT_TO_COVER)) {
      const value = payment[from as PaymentKey].trim();
      if (!value || (cover[to]?.value ?? '') !== '') continue;
      dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId: 'CIT_COVER', key: to, value } });
    }
    const patch: Partial<Record<CompanyTextKey, string>> = {};
    for (const [from, to] of Object.entries(PAYMENT_TO_COMPANY) as [PaymentKey, CompanyTextKey][]) {
      const value = payment[from].trim();
      if (value && state.company[to] === '') patch[to] = value;
    }
    if (Object.keys(patch).length > 0) dispatch({ type: 'SET_COMPANY', payload: patch });
    // 依公司名稱預選組織型態（商號先當獨資，傳了合夥契約再改）；使用者自己選過就不會被覆蓋
    dispatch({ type: 'INFER_ORG_TYPE', payload: inferOrgType(payment.companyName, !!state.registrationFiles.PARTNERSHIP_AGREEMENT) });
    dispatch({ type: 'NEXT_STEP' });
  };

  return (
    <>
      <StepPageHeader
        kicker='付款資料'
        title='公司基本資料'
        badges={['測試用']}
        nav={{
          onPrev: () => dispatch({ type: 'PREV_STEP' }),
          onNext: handleNext,
          nextLabel: '下一頁',
          nextDisabled: missingRequired || emailInvalid || phoneInvalid,
        }}
      >
        <p className='text-sm text-neutral-mid'>
          正式流程中這些資料會由付款環節帶入，該環節尚未串接，請先在這裡輸入。標示 * 為必填，公司名稱會決定下一頁要上傳哪一組登記文件。
        </p>
      </StepPageHeader>

      <div className='rounded-lg border border-dashed border-neutral-blue-gray bg-white p-4 text-sm text-neutral-mid'>
        測試用頁面：正式上線後這一步會由付款環節自動帶入，不會出現在使用者面前。
      </div>

      <SectionCard title='公司資料'>
        <Field label='統一編號' required hint='輸入 8 碼後可按「查詢」自動帶入公司名稱、代表人與地址'>
          <div className='flex items-start gap-2'>
            <TextInput {...bind('taxId')} inputMode='numeric' maxLength={8} widthClassName='w-full' />
            <Button variant='outline' size='sm' icon={looking ? undefined : Search} disabled={payment.taxId.length !== 8 || looking} onClick={handleLookup} className='min-h-11 shrink-0 nav:min-h-0'>
              {looking ? (
                <span className='flex items-center gap-1.5'>
                  <Loader2 size={14} className='animate-spin' />
                  查詢中…
                </span>
              ) : (
                '查詢'
              )}
            </Button>
          </div>
          {lookupError && <p className='mt-1 text-sm text-semantic-error'>{lookupError}</p>}
        </Field>

        <div className='grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-2'>
          <Field label='公司名稱' required>
            <TextInput {...bind('companyName')} />
          </Field>
          <Field label='代表人姓名' required>
            <TextInput {...bind('representative')} />
          </Field>
          <Field label='Email' required hint={emailInvalid ? undefined : '開帳相關通知會寄到這個信箱'}>
            <TextInput {...bind('email')} inputMode='email' />
            {emailInvalid && <p className='mt-1 text-sm text-semantic-error'>Email 格式不正確</p>}
          </Field>
          <Field label='手機號碼' required>
            <TextInput {...bind('phone')} inputMode='tel' maxLength={10} />
            {phoneInvalid && <p className='mt-1 text-sm text-semantic-error'>請輸入 09 開頭的 10 碼手機號碼</p>}
          </Field>
        </div>

        <Field label='公司地址' required>
          <TextInput {...bind('address')} />
        </Field>
      </SectionCard>
    </>
  );
}
