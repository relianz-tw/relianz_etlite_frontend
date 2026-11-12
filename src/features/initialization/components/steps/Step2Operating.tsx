'use client';

import { useInitialization } from '../../state/InitializationContext';
import { FORM_LIST, ORG_TYPE_LABEL, buildReportPages, describePeriods, getOpenYearOptions, isFormApplicable, isSoleOrPartnership, resolveToday, toGregorianYear } from '../../reports';
import { getRegistrationDocs } from '../../reports/registrationDocs';
import { StepPageHeader, type StepNavProps } from '@/components/initialization/StepPageHeader';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DatePicker from '@/components/ui/DatePicker';
import SegmentedControl from '@/components/ui/SegmentedControl';
import TextInput from '@/components/ui/TextInput';
import { cn, formatLocalDate } from '@/lib/utils';
import { useIsNavDesktop } from '@/lib/useNavBreakpoint';
import { CircleCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { OperatingStatus, OrgType } from '../../state/initializationReducer';

// 測試用「模擬今天日期」只在開發環境顯示；其他環境（如 staging）需設 NEXT_PUBLIC_ENABLE_DATE_SIMULATOR=true 才開
const SHOW_DATE_SIMULATOR = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DATE_SIMULATOR === 'true';

const STATUS_OPTIONS: { value: Exclude<OperatingStatus, null>; title: string; desc: string }[] = [
  { value: 'under_one_year', title: '尚未結算申報過', desc: '公司營運未滿一年' },
  { value: 'over_one_year', title: '穩定經營超過一年以上', desc: '已有前一年度的結算申報資料' },
];

const ORG_OPTIONS: { value: Exclude<OrgType, null>; title: string; desc: string }[] = [
  { value: 'share', title: ORG_TYPE_LABEL.share, desc: '需備登記事項表、公司章程與股東名簿' },
  { value: 'limited', title: ORG_TYPE_LABEL.limited, desc: '需備登記事項表、公司章程與股東名簿' },
  { value: 'sole', title: ORG_TYPE_LABEL.sole, desc: '改填負責人資料，需備商業抄本' },
  { value: 'partnership', title: ORG_TYPE_LABEL.partnership, desc: '改填負責人及合夥人資料，需備商業抄本與合夥契約' },
];


/** 步驟編號圓章：已完成為實心藍，進行中為藍框 */
function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        done ? 'bg-brand-blue text-white' : 'border-[1.5px] border-brand-blue bg-white text-brand-blue'
      )}
    >
      {n}
    </span>
  );
}

export function Step2Operating() {
  const { state, dispatch } = useInitialization();
  const isNavDesktop = useIsNavDesktop();
  // 使用者想改成的年度；已有辨識過的文件時，先跳提示確認才會真的變更
  const [pendingYear, setPendingYear] = useState<number | null>(null);

  const today = resolveToday(state.simulatedDate);
  const yearOptions = getOpenYearOptions(today);
  // 只有一個年度可選時沒有選擇的必要，直接帶入（含修正 sessionStorage 還原的舊年度）
  const onlyYear = yearOptions.length === 1 ? yearOptions[0] : null;
  const hasIdentifiedForms = Object.keys(state.reportYears).length > 0;
  useEffect(() => {
    if (onlyYear === null || state.openYear === onlyYear) return;
    dispatch({ type: 'SET_OPEN_YEAR', payload: onlyYear });
    // 舊年度被修正且有辨識過的文件時，同樣排定「下一頁」時重設文件年度（不另跳提示，因為使用者沒有做選擇）
    if (state.openYear !== null && hasIdentifiedForms) dispatch({ type: 'SCHEDULE_YEAR_RESET' });
  }, [onlyYear, state.openYear, hasIdentifiedForms, dispatch]);

  // 測試用：改模擬日期後，已選的年度若不在新的選項內就清掉，改由使用者重選（只有一個選項時上面的 effect 會自動帶入）
  const handleSimulatedDateChange = (date: string | null) => {
    dispatch({ type: 'SET_SIMULATED_DATE', payload: date });
    const nextOptions = getOpenYearOptions(resolveToday(date));
    if (state.openYear !== null && !nextOptions.includes(state.openYear)) {
      dispatch({ type: 'SET_OPEN_YEAR', payload: null });
      if (hasIdentifiedForms) dispatch({ type: 'SCHEDULE_YEAR_RESET' });
    }
  };

  const handleSelectYear = (year: number) => {
    if (year === state.openYear) return;
    if (state.openYear !== null && hasIdentifiedForms) setPendingYear(year);
    else dispatch({ type: 'SET_OPEN_YEAR', payload: year });
  };

  const handleConfirmYearChange = () => {
    if (pendingYear === null) return;
    dispatch({ type: 'SET_OPEN_YEAR', payload: pendingYear });
    dispatch({ type: 'SCHEDULE_YEAR_RESET' });
  };

  const isOverOneYear = state.operatingStatus === 'over_one_year';
  const hasYear = state.openYear !== null;

  // 穩定經營一年以上固定從開帳年度 1/1 起記帳，基準日自動帶入且不可改（開帳年度變動時跟著更新）
  const autoBaseDate = isOverOneYear && state.openYear !== null ? `${toGregorianYear(state.openYear)}-01-01` : null;
  useEffect(() => {
    if (autoBaseDate !== null && state.openingBalance.baseDate !== autoBaseDate) {
      dispatch({ type: 'SET_BALANCE_BASE_DATE', payload: autoBaseDate });
    }
  }, [autoBaseDate, state.openingBalance.baseDate, dispatch]);

  // 步驟 4 要逐頁核對的頁面（營所稅各表＋營業稅各期）；未滿一年不逐頁核對，為空
  const plan = isOverOneYear && state.openYear !== null ? buildReportPages({ openYear: state.openYear, baseDate: state.openingBalance.baseDate, today, orgType: state.orgType, establishYear: state.establishYear }) : [];
  const vatPages = plan.filter(p => p.period);
  const requiredVat = describePeriods(vatPages.filter(p => p.required));
  const optionalVat = describePeriods(vatPages.filter(p => !p.required));

  const handleNext = () => {
    // 年度變更後第一次前進時，才把已辨識文件的年度重設為新年度的預設值
    if (state.yearResetPending) dispatch({ type: 'APPLY_YEAR_RESET' });
    // 頁面清單在這裡依當下的開帳年度與日期凍結，之後步驟 4 不會因日期變動而增減頁數
    dispatch({ type: 'APPLY_REPORT_PLAN', payload: plan });
    dispatch({ type: 'NEXT_STEP' });
  };

  // 穩定經營需再選年度才算完成；開帳基準日兩種營運狀況都必填（確認開帳時會寫入後端開帳日）
  const hasOrgType = state.orgType !== null;
  const hasBaseDate = state.openingBalance.baseDate !== '';
  // 公司還要填設立年度（民國），要早於開帳年度，才知道有沒有前一年度的未分配盈餘申報書（獨資、合夥沒有這份文件，不用問）
  const asksEstablishYear = isOverOneYear && state.orgType !== null && !isSoleOrPartnership(state.orgType);
  const establishYearValid = state.establishYear !== null && state.openYear !== null && state.establishYear >= 1 && state.establishYear < state.openYear;
  const ready = hasOrgType && hasBaseDate && (state.operatingStatus === 'under_one_year' || (isOverOneYear && hasYear && (!asksEstablishYear || establishYearValid)));
  const registrationDocs = getRegistrationDocs(state.orgType);

  const hint =
    !hasOrgType
      ? '先選擇組織型態，會依型態列出需要準備的文件。'
      : state.operatingStatus === null
      ? '選擇營運狀況後，會顯示接下來需要準備的文件。'
      : isOverOneYear && !hasYear
        ? '選擇開帳年度後，會顯示需要準備的文件。'
        : asksEstablishYear && !establishYearValid
          ? '請填寫公司設立年度（要早於開帳年度），會依此決定要不要前一年度的未分配盈餘申報書。'
          : !hasBaseDate
            ? '請選擇開帳基準日。'
            : '';

  // 此頁不提供「上一頁」
  const nav: StepNavProps = { onNext: handleNext, nextLabel: '下一頁', nextDisabled: !ready };

  return (
    <>
      <ConfirmDialog
        open={pendingYear !== null}
        onClose={() => setPendingYear(null)}
        onConfirm={handleConfirmYearChange}
        title='變更開帳年度'
        message={
          <>
            變更開帳年度後，已辨識文件的年度會重設為新年度的預設值（營利事業所得稅為前一年度、營業稅為開帳年度）。
            重設會在您按下「下一頁」時進行，已填寫的欄位內容不會被清除。
          </>
        }
        confirmLabel='確認變更'
      />

      <StepPageHeader
        kicker='營運狀況'
        title='開帳設定'
        nav={nav}
      />

      {SHOW_DATE_SIMULATOR && (
        <div className='flex flex-col gap-3 rounded-lg border border-dashed border-neutral-blue-gray bg-white p-4 nav:flex-row nav:items-center nav:justify-between'>
          <div className='flex flex-col'>
            <span className='text-sm font-bold text-neutral-dark'>測試用：模擬今天日期</span>
            <span className='text-xs text-neutral-mid'>
              目前使用{state.simulatedDate ? '模擬日期' : '系統日期'}（{formatLocalDate(today)}），會影響可選的開帳年度
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <DatePicker
              value={state.simulatedDate ? today : undefined}
              placeholder='選擇模擬日期'
              keepInputFocus
              onChange={date => date && handleSimulatedDateChange(formatLocalDate(date))}
            />
            {state.simulatedDate && (
              <Button variant='ghost' size='sm' onClick={() => handleSimulatedDateChange(null)}>
                改回系統日期
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 三個步驟放在同一張卡片，用分隔線區分 */}
      <div className='flex flex-col divide-y divide-neutral-blue-gray/30 rounded-lg border border-neutral-blue-gray/30 bg-white px-5 nav:px-6'>
        <div className='flex flex-col gap-4 py-6'>
          <div className='flex items-center gap-3'>
            <StepBadge n={1} done={hasOrgType} />
            <h2 className='text-lg font-bold text-neutral-dark'>請選擇組織型態</h2>
          </div>
          <div role='radiogroup' aria-label='組織型態' className='grid grid-cols-1 gap-3 nav:grid-cols-2'>
            {ORG_OPTIONS.map(option => {
              const selected = state.orgType === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border-[1.5px] p-4 transition-colors',
                    selected ? 'border-brand-blue bg-brand-blue/5' : 'border-neutral-blue-gray/50 bg-white hover:border-brand-blue'
                  )}
                >
                  <input
                    type='radio'
                    name='orgType'
                    className='mt-1 h-[18px] w-[18px] shrink-0 accent-brand-blue'
                    checked={selected}
                    onChange={() => dispatch({ type: 'SET_ORG_TYPE', payload: option.value })}
                  />
                  <span className='flex flex-col gap-0.5'>
                    <span className='text-[15px] font-bold text-neutral-dark'>{option.title}</span>
                    <span className='text-[13px] text-neutral-mid'>{option.desc}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className='flex flex-col gap-4 py-6'>
          <div className='flex items-center gap-3'>
            <StepBadge n={2} done={state.operatingStatus !== null} />
            <h2 className='text-lg font-bold text-neutral-dark'>請選擇您的營運狀況</h2>
          </div>
          <div role='radiogroup' aria-label='營運狀況' className='grid grid-cols-1 gap-3 nav:grid-cols-2'>
            {STATUS_OPTIONS.map(option => {
              const selected = state.operatingStatus === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border-[1.5px] p-4 transition-colors',
                    selected ? 'border-brand-blue bg-brand-blue/5' : 'border-neutral-blue-gray/50 bg-white hover:border-brand-blue'
                  )}
                >
                  <input
                    type='radio'
                    name='operatingStatus'
                    className='mt-1 h-[18px] w-[18px] shrink-0 accent-brand-blue'
                    checked={selected}
                    onChange={() => {
                      // 從穩定經營切回未滿一年時，清掉自動帶入的基準日，改由使用者自己選
                      if (option.value === 'under_one_year' && isOverOneYear) dispatch({ type: 'SET_BALANCE_BASE_DATE', payload: '' });
                      dispatch({ type: 'SET_OPERATING_STATUS', payload: option.value });
                    }}
                  />
                  <span className='flex flex-col gap-0.5'>
                    <span className='text-[15px] font-bold text-neutral-dark'>{option.title}</span>
                    <span className='text-[13px] text-neutral-mid'>{option.desc}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 開帳年度與開帳基準日在桌面並排，手機直向堆疊 */}
        {state.operatingStatus !== null && (
        <div className='grid grid-cols-1 gap-x-8 gap-y-6 py-6 nav:grid-cols-2'>
        {isOverOneYear && (
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-3'>
              <StepBadge n={3} done={hasYear} />
              <div className='flex flex-col'>
                <h2 className='text-lg font-bold text-neutral-dark'>{onlyYear !== null ? '開帳年度' : '請選擇要開帳的年度'}</h2>
                <span className='text-[13px] text-neutral-mid'>從這個年度的期初開始記帳，前一年度的結算申報資料會作為期初餘額</span>
              </div>
            </div>
            {onlyYear !== null ? (
              // 只有一個年度時不需要選擇，改為資訊列，避免看起來像可點的按鈕
              <div className='flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-neutral-blue-gray/30 bg-surface-off-white px-4 py-2'>
                <span className='text-base font-bold text-neutral-dark'>
                  {toGregorianYear(onlyYear)} 年（民國 {onlyYear} 年）
                </span>
                <span className='flex shrink-0 items-center gap-1.5 text-sm font-medium text-semantic-success'>
                  <CircleCheck size={16} />
                  本期開帳年度
                </span>
              </div>
            ) : (
              <SegmentedControl
              size='lg'
              // 手機寬度每個選項只有約 120px，「2025 年（民國 114 年）」放不下，允許換行並縮小字級
              wrapOptions={!isNavDesktop}
              options={yearOptions.map(year => ({ value: String(year), label: `${toGregorianYear(year)} 年（民國 ${year} 年）` }))}
              value={state.openYear === null ? '' : String(state.openYear)}
              onChange={value => handleSelectYear(Number(value))}
              />
            )}
          </div>
        )}

          {asksEstablishYear ? (
            // 穩定經營的開帳基準日固定是開帳年度 1/1（自動帶入），公司這一格改成輸入設立年度
            <div className='flex flex-col gap-4'>
              <div className='flex items-center gap-3'>
                <StepBadge n={4} done={establishYearValid} />
                <div className='flex flex-col'>
                  <h2 className='text-lg font-bold text-neutral-dark'>公司設立年度</h2>
                  <span className='text-[13px] text-neutral-mid'>開帳年度的前一年若就是設立年度，沒有前一年度可申報，就不需要未分配盈餘申報書</span>
                </div>
              </div>
              <div className='flex flex-col gap-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-neutral-dark'>民國</span>
                  <div className='w-28'>
                    <TextInput
                      inputMode='numeric'
                      widthClassName='w-full'
                      value={state.establishYear === null ? '' : String(state.establishYear)}
                      placeholder='例如 110'
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 3);
                        dispatch({ type: 'SET_ESTABLISH_YEAR', payload: digits === '' ? null : Number(digits) });
                      }}
                    />
                  </div>
                  <span className='text-sm text-neutral-dark'>年</span>
                </div>
                {state.establishYear !== null && !establishYearValid && state.openYear !== null && <p className='text-xs text-semantic-error'>設立年度要早於開帳年度（民國 {state.openYear} 年）。</p>}
              </div>
            </div>
          ) : (
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-3'>
              <StepBadge n={isOverOneYear ? 4 : 3} done={state.openingBalance.baseDate !== ''} />
              <div className='flex flex-col'>
                <h2 className='text-lg font-bold text-neutral-dark'>開帳基準日</h2>
                <span className='text-[13px] text-neutral-mid'>
                  {isOverOneYear ? '穩定經營一年以上，固定從開帳年度 1 月 1 日起開始記帳' : '從這一天起開始記帳，作為日後帳務的起點'}
                </span>
              </div>
            </div>
            <div>
              <DatePicker
                className='h-12'
                value={state.openingBalance.baseDate ? new Date(`${state.openingBalance.baseDate}T00:00:00`) : undefined}
                placeholder='選擇開帳基準日'
                keepInputFocus
                disabled={isOverOneYear}
                onChange={date => dispatch({ type: 'SET_BALANCE_BASE_DATE', payload: date ? formatLocalDate(date) : '' })}
              />
            </div>
          </div>
          )}
        </div>
        )}

        {hint && (
          <div className='py-6'>
            <p className='rounded-lg bg-surface-off-white px-4 py-3 text-sm text-neutral-mid'>{hint}</p>
          </div>
        )}

        {isOverOneYear && hasYear && state.openYear !== null && (
          <div className='flex flex-col gap-3.5 py-6'>
            <div className='flex items-center gap-3'>
              <StepBadge n={5} done />
              <h2 className='text-lg font-bold text-neutral-dark'>請先備齊以下文件</h2>
            </div>
            <p className='text-[15px] text-neutral-mid'>
              請準備民國 {state.openYear - 1} 年度的結算申報資料。接下來會一頁一頁呈現表單，每一頁都可以上傳文件快速帶入資料，也可以直接手動輸入。
            </p>
            <ul className='grid list-inside list-disc grid-cols-1 gap-x-8 gap-y-1.5 text-[15px] text-neutral-dark nav:grid-cols-2'>
              {FORM_LIST.filter(form => form.taxType === 'cit' && isFormApplicable(form.formCode, state.orgType, { openYear: state.openYear, establishYear: state.establishYear })).map(form => (
                <li key={form.formNo}>
                  {form.title}
                  {form.optional && '（如有）'}
                </li>
              ))}
              {vatPages.length > 0 && (
                <li className='nav:col-span-2'>
                  營業人銷售額與稅額申報書（每一期擇一填 401 或 403）
                  <ul className='mt-1 flex list-none flex-col gap-0.5 pl-5 text-[13px] text-neutral-mid'>
                    {requiredVat && <li>必備：{requiredVat}</li>}
                    {optionalVat && <li>選填：{optionalVat}</li>}
                  </ul>
                </li>
              )}
            </ul>
            <p className='text-[15px] font-medium text-neutral-dark'>登記資料（逐頁核對的最後會請您上傳）</p>
            <ul className='grid list-inside list-disc grid-cols-1 gap-x-8 gap-y-1.5 text-[15px] text-neutral-dark nav:grid-cols-2'>
              {registrationDocs.map(doc => (
                <li key={doc.code}>{doc.title}</li>
              ))}
              {isSoleOrPartnership(state.orgType) && <li>負責人{state.orgType === 'partnership' ? '及合夥人' : ''}基本資料（姓名、身分證字號、戶籍地址、出資額）</li>}
            </ul>
          </div>
        )}

      </div>
    </>
  );
}
