'use client';

import { useInitialization } from '../../state/InitializationContext';
import { readOnboardingCompany } from '../../utils/onboardingCompany';
import { StepPageHeader } from '@/components/initialization/StepPageHeader';
import SectionCard from '@/components/ui/SectionCard';
import TextInput from '@/components/ui/TextInput';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { InitializationState } from '../../state/initializationReducer';

type CompanyKey = keyof InitializationState['company'];

/** 必填欄位；統一編號與稅籍編號對剛成立的公司可能尚未取得，允許留白 */
const REQUIRED_KEYS: CompanyKey[] = ['name', 'representative', 'address', 'zipCode', 'phone', 'contactName', 'contactPhone', 'contactEmail'];

/** 簡單格式檢查：有 @ 且網域含 .，不做完整 RFC 驗證 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

/** 步驟 3（尚未結算申報過）：沒有申報書可辨識，改填固定的公司基本資料與聯絡人 */
export function Step3CompanyInfo() {
  const { state, dispatch } = useInitialization();
  const { company } = state;

  // 首次進入時帶入 onboarding 已填的公司資料（只補空白欄位，不覆蓋已輸入的值）
  useEffect(() => {
    const prefill = readOnboardingCompany();
    if (!prefill) return;
    const patch: Partial<InitializationState['company']> = {};
    if (prefill.taxId && !company.taxId) patch.taxId = prefill.taxId;
    if (prefill.name && !company.name) patch.name = prefill.name;
    if (prefill.representative && !company.representative) patch.representative = prefill.representative;
    if (prefill.address && !company.address) patch.address = prefill.address;
    if (Object.keys(patch).length > 0) dispatch({ type: 'SET_COMPANY', payload: patch });
    // 僅首次掛載時預填
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bind = (key: CompanyKey) => ({
    value: String(company[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_COMPANY', payload: { [key]: e.target.value } }),
  });

  const emailInvalid = company.contactEmail !== '' && !EMAIL_PATTERN.test(company.contactEmail.trim());
  const missingRequired = REQUIRED_KEYS.some(key => String(company[key]).trim() === '');

  return (
    <>
      <StepPageHeader
        kicker='公司資料'
        title='請填寫公司基本資料'
        nav={{
          onPrev: () => dispatch({ type: 'PREV_STEP' }),
          onNext: () => dispatch({ type: 'NEXT_STEP' }),
          nextLabel: '下一步',
          nextDisabled: missingRequired || emailInvalid,
        }}
      >
        <p className='text-sm text-neutral-mid'>公司尚未結算申報過，沒有申報書可以核對，請直接填寫以下資料。標示 * 為必填。</p>
      </StepPageHeader>

      <SectionCard title='公司資料'>
        <div className='grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-2'>
          <Field label='統一編號' hint='若尚未取得，可留白'>
            <TextInput {...bind('taxId')} inputMode='numeric' maxLength={8} />
          </Field>
          <Field label='登記名稱' required>
            <TextInput {...bind('name')} />
          </Field>
          <Field label='負責人全名' required>
            <TextInput {...bind('representative')} />
          </Field>
          <Field label='負責人電話' required>
            <TextInput {...bind('phone')} inputMode='tel' />
          </Field>
          <Field label='稅籍編號' hint='若尚未取得，可留白'>
            <TextInput {...bind('taxRegNo')} />
          </Field>
        </div>
        <div className='grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-[120px_1fr]'>
          <Field label='郵寄區號' required>
            <TextInput {...bind('zipCode')} inputMode='numeric' maxLength={6} />
          </Field>
          <Field label='登記地址' required>
            <TextInput {...bind('address')} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title='聯絡人'>
        <div className='grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-2'>
          <Field label='聯絡人姓名' required>
            <TextInput {...bind('contactName')} />
          </Field>
          <Field label='聯絡人電話' required>
            <TextInput {...bind('contactPhone')} inputMode='tel' />
          </Field>
          <Field label='聯絡人信箱' required>
            <TextInput {...bind('contactEmail')} type='email' />
            {emailInvalid && <p className='mt-1 text-xs text-semantic-error'>請輸入正確的電子郵件格式</p>}
          </Field>
        </div>
      </SectionCard>
    </>
  );
}
