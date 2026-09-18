'use client';

import { companySchema, type CompanyFormData } from '../../schemas';
import { useInitialization } from '../../state/InitializationContext';
import { groupRecognizedFields } from '../../utils/openingBalance';
import { recognizeInitializationDocument } from '@/api/initialization';
import { getTaxIndustries, type Industry } from '@/api/onboarding/taxIndustries';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import DatePicker from '@/components/ui/DatePicker';
import { DocumentCard } from '../DocumentCard';
import Field from '../Field';
import Label from '@/components/ui/Label';
import Select from '@/components/ui/Select';
import { formatLocalDate } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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

export function Step2Company() {
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

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleRegistrationFile = async (file: File) => {
    dispatch({ type: 'SET_DOCUMENT_STATUS', payload: { category: 'companyRegistration', status: 'recognizing', fileName: file.name, errorMessage: null } });
    try {
      const result = await recognizeInitializationDocument({ userUuid: state.userUuid, category: 'companyRegistration', file });

      // 登記資本額屬於期初表欄位，直接併入 3B 期初表（權益分組）
      const grouped = groupRecognizedFields(result.fields);
      if (grouped.equity) dispatch({ type: 'APPLY_RECOGNIZED_BALANCE', payload: { group: 'equity', fields: grouped.equity } });

      // 公司名稱/代表人/地址/開業日期直接帶入本頁表單（只補尚未填過的欄位，不覆蓋已輸入內容）
      if (result.company) {
        const c = result.company;
        setForm(prev => ({
          ...prev,
          companyName: prev.companyName || c.companyName || prev.companyName,
          representative: prev.representative || c.representative || prev.representative,
          address: prev.address || c.address || prev.address,
          openDate: prev.openDate || c.openDate || prev.openDate,
          isOperating: prev.openDate || c.openDate ? true : prev.isOperating,
        }));
        toast.success('已從公司登記資料帶入公司基本資料，請確認欄位內容');
      }

      dispatch({ type: 'SET_DOCUMENT_STATUS', payload: { category: 'companyRegistration', status: 'done', fileName: file.name, errorMessage: null } });
    } catch (err) {
      dispatch({
        type: 'SET_DOCUMENT_STATUS',
        payload: {
          category: 'companyRegistration',
          status: 'error',
          fileName: file.name,
          errorMessage: err instanceof Error ? err.message : '辨識失敗，請重試或改用手動輸入',
        },
      });
    }
  };

  const handleRegistrationRemove = () => {
    dispatch({ type: 'SET_DOCUMENT_STATUS', payload: { category: 'companyRegistration', status: 'empty', fileName: null, errorMessage: null } });
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

  return (
    <div className='flex flex-col flex-1 min-h-0 p-5 md:p-12 md:overflow-y-auto'>
      <div className='flex flex-col gap-5'>
        <h1 className='text-xl font-bold text-neutral-dark font-notoSerif'>公司基本資料</h1>

        <DocumentCard
          label='公司登記資料（選填）'
          hint='商工登記公示或設立登記表，上傳後自動帶入下方欄位（PDF）'
          accept='.pdf'
          slot={state.documents.companyRegistration}
          onFileSelect={handleRegistrationFile}
          onRemove={handleRegistrationRemove}
        />
        <p className='-mt-3 text-xs text-neutral-mid'>沒有文件也沒關係，以下欄位可直接手動輸入</p>

        <Field
          label='統一編號'
          value={form.taxId}
          onChange={e => setField('taxId', e.target.value.replace(/\D/g, '').slice(0, 8))}
          maxLength={8}
          inputMode='numeric'
          error={!!errors.taxId}
          errorMessage={errors.taxId}
        />

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

        <div className='flex flex-col flex-1'>
          <Label required className='mb-2'>
            行業別
          </Label>
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

        <label className='flex items-center gap-2 cursor-pointer'>
          <Checkbox checked={form.isOperating} onChange={() => setField('isOperating', !form.isOperating)} aria-label='目前已開業' />
          <span className='text-sm text-neutral-dark'>目前已開業</span>
        </label>

        {form.isOperating && (
          <div className='flex flex-col flex-1'>
            <Label className='mb-2'>開業日期</Label>
            <DatePicker
              value={form.openDate ? new Date(form.openDate) : undefined}
              onChange={date => setField('openDate', date ? formatLocalDate(date) : '')}
            />
          </div>
        )}

        <div className='flex flex-col flex-1'>
          <Label required className='mb-2'>
            開帳基準日
          </Label>
          <DatePicker value={form.baseDate ? new Date(form.baseDate) : undefined} onChange={date => setField('baseDate', date ? formatLocalDate(date) : '')} />
          <p className='pt-1 text-xs text-neutral-mid'>作為日後記帳與期初餘額的起點，之後仍可在核對期初資料時調整</p>
          {errors.baseDate && <p className='pt-1 text-xs text-semantic-error'>{errors.baseDate}</p>}
        </div>
      </div>

      <MobileFixedBottom>
        <Button onClick={handleNext} className='w-full'>
          下一步
        </Button>
      </MobileFixedBottom>
    </div>
  );
}
