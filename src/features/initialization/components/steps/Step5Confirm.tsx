'use client';

import { useInitialization } from '../../state/InitializationContext';
import { toOpeningBalancePayload } from '../../reports/balanceSheetMapping';
import { saveInitializationCompany, saveOpeningBalance } from '@/api/initialization';
import { StepPageHeader } from '@/components/initialization/StepPageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';

export function Step5Confirm() {
  const { state, dispatch } = useInitialization();
  const balanceSheetFields = state.reports.CIT_BALANCE_SHEET.fields;
  const totalAssets = Number(balanceSheetFields.BS_1000?.value) || 0; // 資產總計
  const totalLiabilitiesAndEquity = Number(balanceSheetFields.BS_9000?.value) || 0; // 負債及權益總計
  const isBalanced = totalAssets === totalLiabilitiesAndEquity;
  const hasReports = state.operatingStatus === 'over_one_year';

  const handleConfirm = () => {
    // TODO: /ael/initialization/* 後端上線後，改回 await + try/catch 並在失敗時擋住不前進
    // （避免重蹈 cashflow /startUp 失敗仍照樣前進的問題）；目前後端未提供，先不擋流程
    saveInitializationCompany({
      userUuid: state.userUuid,
      orgType: state.company.orgType,
      taxId: state.company.taxId,
      companyName: state.company.name,
      representative: state.company.representative,
      address: state.company.address,
      phone: state.company.phone,
      taxRegNo: state.company.taxRegNo,
      industryId: state.company.industryId,
      isOperating: state.company.isOperating,
      openDate: state.company.openDate,
    }).catch(() => {});
    if (hasReports) {
      saveOpeningBalance({
        userUuid: state.userUuid,
        baseDate: state.openingBalance.baseDate,
        ...toOpeningBalancePayload(balanceSheetFields),
      }).catch(() => {});
    }
    dispatch({ type: 'NEXT_STEP' });
  };

  return (
    <>
      <StepPageHeader
        kicker='確認'
        title='確認開帳'
        nav={{ onPrev: () => dispatch({ type: 'PREV_STEP' }), onNext: handleConfirm, nextLabel: '確認開帳' }}
      >
        <p className='text-sm text-neutral-mid'>確認以下資料無誤後即完成開帳設定，開帳基準日設定後將作為日後記帳的起點。</p>
      </StepPageHeader>

      <>

        <SectionCard title='公司資料'>
          <dl className='grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm'>
            <dt className='text-neutral-mid'>組織型態</dt>
            <dd className='text-neutral-dark'>{state.company.orgType || '—'}</dd>
            <dt className='text-neutral-mid'>統一編號</dt>
            <dd className='text-neutral-dark'>{state.company.taxId || '—'}</dd>
            <dt className='text-neutral-mid'>公司名稱</dt>
            <dd className='text-neutral-dark'>{state.company.name || '—'}</dd>
            <dt className='text-neutral-mid'>代表人</dt>
            <dd className='text-neutral-dark'>{state.company.representative || '—'}</dd>
            <dt className='text-neutral-mid'>地址</dt>
            <dd className='text-neutral-dark'>{state.company.address || '—'}</dd>
            <dt className='text-neutral-mid'>負責人電話</dt>
            <dd className='text-neutral-dark'>{state.company.phone || '—'}</dd>
            <dt className='text-neutral-mid'>稅籍編號</dt>
            <dd className='text-neutral-dark'>{state.company.taxRegNo || '—'}</dd>
            <dt className='text-neutral-mid'>行業別</dt>
            <dd className='text-neutral-dark'>{state.company.industryName || '—'}</dd>
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
