'use client';

import { useInitialization } from '../../state/InitializationContext';
import { useFormMetadata } from '../../hooks/useFormMetadata';
import { ORG_TYPE_LABEL, getCurrentOpenYear, getDefaultFormYear, getFormItem, getPageLabel, isPageFilled, resolveReportPage, resolveToday } from '../../reports';
import { getRegistrationDocs } from '../../reports/registrationDocs';
import { toOpeningBalancePayload } from '../../reports/balanceSheetMapping';
import { buildConfirmForms } from '../../reports/confirmPayload';
import { saveInitializationCompany, saveOpeningBalance } from '@/api/initialization';
import { confirmCit, saveOpeningDate } from '@/api/peit';
import { StepPageHeader } from '@/components/initialization/StepPageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency, formatYyyymmddRoc, toRocYyyMmDd } from '@/lib/utils';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function Step5Confirm() {
  const { state, dispatch } = useInitialization();
  const [submitting, setSubmitting] = useState(false);
  const balanceSheetFields = state.reports.CIT_BALANCE_SHEET.fields;
  const totalAssets = Number(balanceSheetFields.BS_1000?.value) || 0; // 資產總計
  const totalLiabilitiesAndEquity = Number(balanceSheetFields.BS_9000?.value) || 0; // 負債及權益總計
  const isBalanced = totalAssets === totalLiabilitiesAndEquity;
  const hasReports = state.operatingStatus === 'over_one_year';
  const openYear = state.openYear ?? getCurrentOpenYear(resolveToday(state.simulatedDate));

  // 期初餘額的科目清單取自資產負債表 metadata（與步驟 4 同年度，快取命中不會重打 API）
  const balanceYear = state.reportYears.CIT_BALANCE_SHEET ?? getDefaultFormYear('CIT_BALANCE_SHEET', openYear);
  const { page: balancePage } = useFormMetadata(getFormItem('CIT_BALANCE_SHEET').formNo, balanceYear);

  // 尚未填寫的頁面：只提醒不阻擋，點了可跳回該頁補填（補完用「下一份」走回確認頁）
  const missingPages = hasReports
    ? state.reportPages.flatMap((spec, index) => {
        let filled: boolean;
        if (spec.kind === 'registration') filled = getRegistrationDocs(state.orgType).every(doc => state.registrationFiles[doc.code]);
        else if (spec.kind === 'partners') filled = state.partners.length > 0;
        else filled = isPageFilled(state.reports, resolveReportPage(spec, state.vatChoices).reportKey);
        return filled ? [] : [{ index, label: getPageLabel(spec, state.vatChoices) }];
      })
    : [];

  // 組織型態由步驟 2 決定
  const orgTypeLabel = state.orgType ? ORG_TYPE_LABEL[state.orgType] : '';

  const handleConfirm = async () => {
    // 逐頁核對的資料先寫入後端；失敗就擋在這一步，避免使用者以為已存但實際沒存
    setSubmitting(true);
    try {
      const forms = await buildConfirmForms(state);
      if (forms.length > 0) await confirmCit(forms);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, '開帳資料儲存失敗，請稍後再試'));
      setSubmitting(false);
      return;
    }

    // 開帳日（步驟 2 的開帳基準日）重送會覆寫，故重試安全
    const openingDate = toRocYyyMmDd(state.openingBalance.baseDate);

    if (!hasReports) {
      // 未滿一年：公司資料與開帳日是這條路線僅有的寫入，失敗就擋在這一步
      // （避免重蹈 cashflow /startUp 失敗仍照樣前進的問題）
      try {
        await saveInitializationCompany({
          orgType: state.orgType ?? '',
          taxId: state.company.taxId,
          companyName: state.company.name,
          representative: state.company.representative,
          address: state.company.address,
          phone: state.company.phone,
          taxRegNo: state.company.taxRegNo,
          zipCode: state.company.zipCode,
          contactName: state.company.contactName,
          contactPhone: state.company.contactPhone,
          contactEmail: state.company.contactEmail,
        });
        await saveOpeningDate(openingDate);
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error, '公司資料儲存失敗，請稍後再試'));
        setSubmitting(false);
        return;
      }
    } else {
      // 滿一年不送 company：這條路線沒有郵寄區號與聯絡人欄位，後端必填驗證必然回 400
      saveOpeningDate(openingDate).catch(() => {});
      saveOpeningBalance({
        userUuid: state.userUuid,
        baseDate: state.openingBalance.baseDate,
        ...toOpeningBalancePayload(balanceSheetFields, balancePage),
      }).catch(() => {});
    }
    setSubmitting(false);
    dispatch({ type: 'NEXT_STEP' });
  };

  return (
    <>
      <StepPageHeader
        kicker='確認'
        title='確認開帳'
        nav={{ onPrev: () => dispatch({ type: 'PREV_STEP' }), onNext: handleConfirm, nextLabel: submitting ? '儲存中…' : '確認開帳', nextDisabled: submitting }}
      >
        <p className='text-sm text-neutral-mid'>確認以下資料無誤後即完成開帳設定，開帳基準日設定後將作為日後記帳的起點。</p>
      </StepPageHeader>

      <>
        {missingPages.length > 0 && (
          <div className='flex items-start gap-2 rounded-md border border-brand-tan/40 bg-brand-tan/10 p-3 text-semantic-warm-dark'>
            <TriangleAlert size={16} className='mt-0.5 shrink-0' />
            <div className='flex flex-col gap-1.5'>
              <span className='text-sm font-bold'>以下 {missingPages.length} 份尚未填寫</span>
              <span className='text-[13px] leading-relaxed'>不影響確認開帳，需要時可點選回去補填，補完按「下一份」即可走回此頁。</span>
              <ul className='flex flex-wrap gap-x-4 gap-y-1 text-[13px]'>
                {missingPages.map(page => (
                  <li key={page.index}>
                    <button
                      type='button'
                      onClick={() => dispatch({ type: 'GO_TO_STEP', payload: { step: 4, reportIndex: page.index } })}
                      className='font-medium text-brand-blue underline-offset-2 hover:underline'
                    >
                      {page.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <SectionCard title='公司資料'>
          <dl className='grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm'>
            <dt className='text-neutral-mid'>組織型態</dt>
            <dd className='text-neutral-dark'>{orgTypeLabel || '—'}</dd>
            <dt className='text-neutral-mid'>統一編號</dt>
            <dd className='text-neutral-dark'>{state.company.taxId || '—'}</dd>
            <dt className='text-neutral-mid'>公司名稱</dt>
            <dd className='text-neutral-dark'>{state.company.name || '—'}</dd>
            <dt className='text-neutral-mid'>負責人</dt>
            <dd className='text-neutral-dark'>{state.company.representative || '—'}</dd>
            <dt className='text-neutral-mid'>地址</dt>
            <dd className='text-neutral-dark'>{state.company.address || '—'}</dd>
            <dt className='text-neutral-mid'>負責人電話</dt>
            <dd className='text-neutral-dark'>{state.company.phone || '—'}</dd>
            <dt className='text-neutral-mid'>稅籍編號</dt>
            <dd className='text-neutral-dark'>{state.company.taxRegNo || '—'}</dd>
            {hasReports ? (
              <>
                <dt className='text-neutral-mid'>行業別</dt>
                <dd className='text-neutral-dark'>{state.company.industryName || '—'}</dd>
              </>
            ) : (
              <>
                {/* 未滿一年的公司資料表單沒有行業別輸入，改顯示郵寄區號與聯絡人 */}
                <dt className='text-neutral-mid'>郵寄區號</dt>
                <dd className='text-neutral-dark'>{state.company.zipCode || '—'}</dd>
                <dt className='text-neutral-mid'>聯絡人姓名</dt>
                <dd className='text-neutral-dark'>{state.company.contactName || '—'}</dd>
                <dt className='text-neutral-mid'>聯絡人電話</dt>
                <dd className='text-neutral-dark'>{state.company.contactPhone || '—'}</dd>
                <dt className='text-neutral-mid'>聯絡人信箱</dt>
                <dd className='text-neutral-dark'>{state.company.contactEmail || '—'}</dd>
              </>
            )}
            <dt className='text-neutral-mid'>開帳基準日</dt>
            <dd className='font-semibold text-brand-blue'>
              {state.openingBalance.baseDate ? formatYyyymmddRoc(state.openingBalance.baseDate) : '—'}
            </dd>
          </dl>
        </SectionCard>

        {hasReports && (
          <SectionCard title='期初試算表摘要'>
            <dl className='grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm'>
              <dt className='text-neutral-mid'>資產總計</dt>
              <dd className='text-neutral-dark'>{fmtCurrency(totalAssets)}</dd>
              <dt className='text-neutral-mid'>負債及業主權益總計</dt>
              <dd className='text-neutral-dark'>{fmtCurrency(totalLiabilitiesAndEquity)}</dd>
            </dl>
            {!isBalanced && (
              <p className='mt-2 text-xs text-semantic-error'>
                借貸尚未平衡（差額 {fmtCurrency(totalAssets - totalLiabilitiesAndEquity)}），建議返回上一步調整。
              </p>
            )}
          </SectionCard>
        )}
      </>
    </>
  );
}
