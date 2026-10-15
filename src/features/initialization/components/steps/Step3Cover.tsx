'use client';

import { useInitialization } from '../../state/InitializationContext';
import { getCurrentOpenYear, getDefaultFormYear, resolveToday, type ReportPageSpec } from '../../reports';
import { ReportPageView } from '../ReportPageView';
import { useEffect } from 'react';
import type { InitializationState } from '../../state/initializationReducer';

/** 封面欄位 fieldCode → 步驟 5 確認頁與送出 API 使用的公司資料欄位 */
const COVER_TO_COMPANY: Record<string, keyof Pick<InitializationState['company'], 'taxId' | 'name' | 'representative' | 'address' | 'phone' | 'taxRegNo' | 'industryName'>> = {
  HDR_VAT_NO: 'taxId',
  HDR_COMPANY_NAME: 'name',
  HDR_OWNER_NAME: 'representative',
  HDR_ADDRESS: 'address',
  HDR_PHONE: 'phone',
  HDR_TAX_REG_NO: 'taxRegNo',
  HDR_INDUSTRY_CODE: 'industryName',
};

/** onboarding 已蒐集的公司資料 → 封面對應欄位，首次進入且該欄位仍空白時預填，減少重複輸入 */
const ONBOARDING_TO_COVER = {
  taxId: 'HDR_VAT_NO',
  name: 'HDR_COMPANY_NAME',
  representative: 'HDR_OWNER_NAME',
  address: 'HDR_ADDRESS',
} as const;

/** 從 onboarding sessionStorage 讀取已填過的公司資料 */
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

/** 步驟 3：封面頁，所有欄位依 metadata API（formNo 1）動態呈現，下一步時再把封面值整理成公司資料供確認頁使用 */
export function Step3Cover() {
  const { state, dispatch } = useInitialization();
  const isOverOneYear = state.operatingStatus === 'over_one_year';
  const coverYear = state.reportYears.CIT_COVER ?? getDefaultFormYear('CIT_COVER', state.openYear ?? getCurrentOpenYear(resolveToday(state.simulatedDate)));
  const coverSpec: ReportPageSpec = { key: 'CIT_COVER', formCode: 'CIT_COVER', taxYear: coverYear, required: false };

  // 首次進入時帶入 onboarding 已填的公司資料（只補空白欄位，不覆蓋已輸入或辨識帶入的值）
  useEffect(() => {
    const prefill = readOnboardingCompany();
    if (!prefill) return;
    const coverFields = state.reports.CIT_COVER.fields;
    for (const [companyKey, fieldCode] of Object.entries(ONBOARDING_TO_COVER)) {
      const value = prefill[companyKey as keyof typeof ONBOARDING_TO_COVER];
      if (value && !coverFields[fieldCode]?.value) dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId: 'CIT_COVER', key: fieldCode, value } });
    }
    // 僅首次掛載時預填
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    const fields = state.reports.CIT_COVER.fields;
    const company: Partial<InitializationState['company']> = {};
    for (const [fieldCode, companyKey] of Object.entries(COVER_TO_COMPANY)) {
      const value = fields[fieldCode]?.value;
      if (value !== undefined && value !== '') company[companyKey] = String(value);
    }
    dispatch({ type: 'SET_COMPANY', payload: company });
    dispatch({ type: 'NEXT_STEP' });
  };

  return (
    <ReportPageView
      spec={coverSpec}
      taxYear={coverYear}
      kicker='封面'
      // 封面頁尚未開始逐頁核對，進度為 0；一年內新設立無需核對各表，不顯示進度與上傳區
      progress={isOverOneYear ? { value: 0, max: state.reportPages.length } : undefined}
      showIdentify={isOverOneYear}
      nextLabel='下一步'
      onNext={handleNext}
    />
  );
}
