'use client';

import { companySchema, type CompanyFormData } from '../../schemas';
import { useInitialization } from '../../state/InitializationContext';
import { COVER_LEFT, COVER_RIGHT } from '../../reports/cover';
import { ReportColumn } from '../ReportColumn';
import { ReportFieldRow } from '../ReportFieldRow';
import { getTaxIndustries, type Industry } from '@/api/onboarding/taxIndustries';
import { SplitPanel } from '@/components/initialization/SplitPanel';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import DatePicker from '@/components/ui/DatePicker';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { formatLocalDate } from '@/lib/utils';
import { Fragment, useEffect, useState } from 'react';

/** 與 ReportFieldRow 同款的 grid label，讓公司基本資料與下方補充資料欄位左側對齊在同一欄寬 */
function RowLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className='whitespace-nowrap text-sm font-medium text-neutral-dark'>
      {children}
      {required && (
        <span aria-hidden='true' className='ml-0.5 text-semantic-error'>
          *
        </span>
      )}
    </span>
  );
}

type FieldErrors = Partial<Record<keyof CompanyFormData, string>>;

/** 從 onboarding sessionStorage 讀取已填過的公司資料，減少客戶重複輸入 */
function readOnboardingCompany(): { taxId?: string; name?: string; representative?: string; address?: string } | null {
  try {
    const raw = sessionStorage.getItem('etlite_onboarding_state');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { taxId?: string; company?: { name?: string; representative?: string; address?: string } };
    return { taxId: parsed.taxId, ...parsed.company };
  } catch {
    return null;
  }
}

/** 步驟 3：封面頁，核心公司資料（強型別驗證）＋文件辨識補充欄位／營業收入調節說明（reports.cover 通用欄位） */
export function Step3Cover() {
  const { state, dispatch } = useInitialization();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState({
    taxId: state.company.taxId,
    companyName: state.company.name,
    representative: state.company.representative,
    address: state.company.address,
    industryId: state.company.industryId,
    isOperating: state.company.isOperating,
    openDate: state.company.openDate,
    baseDate: state.openingBalance.baseDate,
  });

  useEffect(() => {
    getTaxIndustries()
      .then(setIndustries)
      .catch(() => {
        // 行業別清單取得失敗不擋流程，僅無法選擇
      });
  }, []);

  // 首次進入且尚未填過時，帶入 onboarding 流程已蒐集的公司資料
  useEffect(() => {
    if (form.companyName) return;
    const prefill = readOnboardingCompany();
    if (!prefill) return;
    setForm(prev => ({
      ...prev,
      taxId: prefill.taxId ?? prev.taxId,
      companyName: prefill.name ?? prev.companyName,
      representative: prefill.representative ?? prev.representative,
      address: prefill.address ?? prev.address,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 步驟二辨識結果非同步帶入 state.company，需同步回表單（表單初始值僅在掛載時讀取一次）
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      taxId: prev.taxId || state.company.taxId,
      companyName: prev.companyName || state.company.name,
      representative: prev.representative || state.company.representative,
      address: prev.address || state.company.address,
      openDate: prev.openDate || state.company.openDate,
      isOperating: prev.isOperating || state.company.isOperating,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.company]);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleNext = () => {
    const result = companySchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const industryName = industries.find(i => String(i.id) === form.industryId)?.industryName ?? '';
    dispatch({
      type: 'SET_COMPANY',
      payload: {
        taxId: form.taxId,
        name: form.companyName,
        representative: form.representative,
        address: form.address,
        industryId: form.industryId,
        industryName,
        isOperating: form.isOperating,
        openDate: form.openDate,
      },
    });
    dispatch({ type: 'SET_BALANCE_BASE_DATE', payload: form.baseDate });
    dispatch({ type: 'NEXT_STEP' });
  };

  const coverFields = state.reports.cover.fields;

  const left = (
    <div className='flex flex-col gap-5'>
      <h1 className='text-xl font-bold text-neutral-dark font-notoSerif'>公司基本資料</h1>

      <div className='grid grid-cols-[auto,1fr] items-center gap-x-4 gap-y-4'>
        <RowLabel>統一編號</RowLabel>
        <div>
          <TextInput
            value={form.taxId}
            onChange={e => setField('taxId', e.target.value.replace(/\D/g, '').slice(0, 8))}
            maxLength={8}
            inputMode='numeric'
            className={errors.taxId ? '!border-semantic-error' : ''}
          />
          {errors.taxId && <p className='pt-1 text-xs text-semantic-error'>{errors.taxId}</p>}
        </div>

        <RowLabel required>公司名稱</RowLabel>
        <div>
          <TextInput value={form.companyName} onChange={e => setField('companyName', e.target.value)} className={errors.companyName ? '!border-semantic-error' : ''} />
          {errors.companyName && <p className='pt-1 text-xs text-semantic-error'>{errors.companyName}</p>}
        </div>

        <RowLabel required>代表人姓名</RowLabel>
        <div>
          <TextInput
            value={form.representative}
            onChange={e => setField('representative', e.target.value)}
            className={errors.representative ? '!border-semantic-error' : ''}
          />
          {errors.representative && <p className='pt-1 text-xs text-semantic-error'>{errors.representative}</p>}
        </div>

        <RowLabel required>公司地址</RowLabel>
        <div>
          <TextInput value={form.address} onChange={e => setField('address', e.target.value)} className={errors.address ? '!border-semantic-error' : ''} />
          {errors.address && <p className='pt-1 text-xs text-semantic-error'>{errors.address}</p>}
        </div>

        <RowLabel required>行業別</RowLabel>
        <div>
          <Select value={form.industryId} onValueChange={v => setField('industryId', v)}>
            <option value=''>請選擇行業別</option>
            {industries.map(i => (
              <option key={i.id} value={String(i.id)}>
                {i.industryName}
              </option>
            ))}
          </Select>
          {errors.industryId && <p className='pt-1 text-xs text-semantic-error'>{errors.industryId}</p>}
        </div>

        <div className='col-span-2'>
          <label className='flex items-center gap-2 cursor-pointer'>
            <Checkbox checked={form.isOperating} onChange={() => setField('isOperating', !form.isOperating)} aria-label='目前已開業' />
            <span className='text-sm text-neutral-dark'>目前已開業</span>
          </label>
        </div>

        {form.isOperating && (
          <>
            <RowLabel>開業日期</RowLabel>
            <DatePicker value={form.openDate ? new Date(form.openDate) : undefined} onChange={date => setField('openDate', date ? formatLocalDate(date) : '')} />
          </>
        )}

        <RowLabel required>開帳基準日</RowLabel>
        <div>
          <DatePicker value={form.baseDate ? new Date(form.baseDate) : undefined} onChange={date => setField('baseDate', date ? formatLocalDate(date) : '')} />
          <p className='pt-1 text-xs text-neutral-mid'>作為日後記帳與期初餘額的起點，之後仍可在核對期初資料時調整</p>
          {errors.baseDate && <p className='pt-1 text-xs text-semantic-error'>{errors.baseDate}</p>}
        </div>

        {COVER_LEFT.sections.map((section, index) => (
          <Fragment key={section.title}>
            <h3 className={`col-span-2 text-sm font-semibold text-neutral-dark ${index > 0 ? 'mt-1' : ''}`}>{section.title}</h3>
            {section.fields.map(field => (
              <ReportFieldRow
                key={field.key}
                field={field}
                data={coverFields[field.key] ?? { value: '', aiFilled: false }}
                onChange={value => dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId: 'cover', key: field.key, value } })}
              />
            ))}
          </Fragment>
        ))}
      </div>

      <MobileFixedBottom>
        <Button onClick={handleNext} className='w-full'>
          下一步
        </Button>
      </MobileFixedBottom>
    </div>
  );

  const right = <ReportColumn reportId='cover' column={COVER_RIGHT} />;

  return <SplitPanel left={left} right={right} />;
}
