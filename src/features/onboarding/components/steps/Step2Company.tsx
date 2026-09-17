'use client';

import { step2Schema, type Step2FormData } from '../../schemas';
import { useOnboarding } from '../../state/OnboardingContext';
import type { SalesModeType } from '../../state/onboardingReducer';
import { optionSelected, optionUnselected, btnBack } from '../../styles';
import Field from '../Field';
import Button from '@/components/ui/Button';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import Textarea from '@/components/ui/Textarea';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

const SALES_MODE_OPTIONS: { value: SalesModeType; label: string }[] = [
  { value: 'physical', label: '實體' },
  { value: 'online', label: '網路' },
  { value: 'both', label: '都有' },
];

type FieldErrors = Partial<Record<keyof Step2FormData, string>>;

export function Step2Company() {
  const { state, dispatch } = useOnboarding();
  const { company } = state;

  const [form, setForm] = useState<Step2FormData>({
    companyName: company.name,
    representative: company.representative,
    address: company.address,
    description: company.description,
    salesMode: company.salesMode ?? 'physical',
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  // Step 1 統編查詢後更新公司資料時，同步到本地 form
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      companyName: company.name !== undefined ? company.name : prev.companyName,
      representative:
        company.representative !== undefined
          ? company.representative
          : prev.representative,
      address: company.address !== undefined ? company.address : prev.address,
    }));
  }, [company.name, company.representative, company.address]);

  const handleNext = () => {
    const result = step2Schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    dispatch({
      type: 'SET_COMPANY',
      payload: {
        name: form.companyName,
        representative: form.representative,
        address: form.address,
        description: form.description,
        salesMode: form.salesMode,
      },
    });
    dispatch({ type: 'NEXT_STEP' });
  };

  const setField = <K extends keyof Step2FormData>(
    name: K,
    value: Step2FormData[K]
  ) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  return (
    <div className='flex flex-col md:flex-row min-h-full md:flex-1 md:min-h-0'>
      {/* 左欄：宣傳圖片 */}
      <div className='hidden md:block md:order-1 md:w-2/5 md:flex-none relative overflow-hidden bg-semantic-success-deep'>
        {/* 全站慣例用原生 img，不使用 next/image */}
        <img
          src='/etlite/promotional2.webp'
          alt='Easytax 服務宣傳圖'
          className='w-full h-80 object-cover object-center md:absolute md:inset-0 md:w-full md:h-full md:object-cover'
        />
        <div className='absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent pointer-events-none' />
        <button
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          className={`${btnBack} !flex absolute top-6 left-6 bg-black/30 backdrop-blur-sm rounded px-2 py-1`}
        >
          <ChevronLeft size={16} /> 上一頁
        </button>
      </div>

      {/* 右欄：操作區 */}
      <div className='md:order-2 w-full md:w-3/5 bg-white flex flex-col p-5 md:p-12 md:overflow-y-auto'>
        {/* 表單內容：靠上方，固定間距 */}
        <div className='flex flex-col gap-5 md:mt-8'>
          <h1 className='text-xl font-bold text-neutral-dark font-notoSerif'>
            公司基本資料
          </h1>

          <Field
            label='公司名稱'
            required
            value={form.companyName}
            onChange={e => setField('companyName', e.target.value)}
            error={!!errors.companyName}
            errorMessage={errors.companyName}
          />

          <Field
            label='代表人姓名'
            required
            value={form.representative}
            onChange={e => setField('representative', e.target.value)}
            error={!!errors.representative}
            errorMessage={errors.representative}
          />

          <Field
            label='公司地址'
            required
            value={form.address}
            onChange={e => setField('address', e.target.value)}
            error={!!errors.address}
            errorMessage={errors.address}
          />

          {/* 產品/服務描述（必填） */}
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium text-neutral-dark'>
              請用白話簡單敘述您主要銷售的產品或服務：
              <span className='ml-1 text-semantic-error'>*</span>
            </label>
            <Textarea
              value={form.description ?? ''}
              onChange={e => setField('description', e.target.value)}
              rows={4}
              placeholder='例：我是一間設計工作室，提供各類設計服務，以平面設計為主（至少 10 字）'
            />
            {errors.description && (
              <p className='text-xs text-semantic-error'>
                {errors.description}
              </p>
            )}
          </div>

          {/* 主要銷售模式 */}
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-neutral-dark'>
              主要銷售模式
            </label>
            <div className='flex gap-2'>
              {SALES_MODE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type='button'
                  onClick={() => setField('salesMode', opt.value)}
                  className={`flex-1 rounded border py-2 text-sm font-medium transition-colors ${
                    form.salesMode === opt.value
                      ? optionSelected
                      : optionUnselected
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.salesMode && (
              <p className='text-xs text-semantic-error'>{errors.salesMode}</p>
            )}
          </div>
        </div>

        <MobileFixedBottom>
          <Button onClick={handleNext} className='w-full'>
            下一步
          </Button>
        </MobileFixedBottom>
      </div>
    </div>
  );
}
