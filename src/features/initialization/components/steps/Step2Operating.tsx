'use client';

import { useInitialization } from '../../state/InitializationContext';
import { SettlementExampleDialog } from '../SettlementExampleDialog';
import { FORM_LIST, getCurrentOpenYear, getOpenYearOptions, toGregorianYear } from '../../reports';
import { StepPageHeader } from '@/components/initialization/StepPageHeader';
import SectionCard from '@/components/ui/SectionCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { useEffect, useState } from 'react';
import type { OperatingStatus } from '../../state/initializationReducer';

export function Step2Operating() {
  const { state, dispatch } = useInitialization();
  const [exampleOpen, setExampleOpen] = useState(false);

  const yearOptions = getOpenYearOptions();

  // 第一次進入時依今天日期預設開帳年度（5/31 前算去年、6/1 起算今年）；已選過（含 sessionStorage 還原）則保留
  useEffect(() => {
    if (state.openYear === null) dispatch({ type: 'SET_OPEN_YEAR', payload: getCurrentOpenYear() });
  }, [state.openYear, dispatch]);

  const handleSelectStatus = (status: OperatingStatus) => {
    dispatch({ type: 'SET_OPERATING_STATUS', payload: status });
  };

  return (
    <>
      <SettlementExampleDialog open={exampleOpen} onClose={() => setExampleOpen(false)} />

      <StepPageHeader
        kicker='營運狀況'
        title='開帳設定'
        nav={{
          onPrev: () => dispatch({ type: 'PREV_STEP' }),
          onNext: () => dispatch({ type: 'NEXT_STEP' }),
          nextLabel: '下一步',
          nextDisabled: !state.operatingStatus,
        }}
      />

      <SectionCard title='請選擇要開帳的年度'>
        <SegmentedControl
          options={yearOptions.map(year => ({ value: String(year), label: `${toGregorianYear(year)} 年（民國 ${year} 年）` }))}
          value={String(state.openYear ?? yearOptions[0])}
          onChange={value => dispatch({ type: 'SET_OPEN_YEAR', payload: Number(value) })}
        />
      </SectionCard>

      <SectionCard title='請選擇您的營運狀況'>
        <div className='flex flex-col gap-3'>
          <label className='flex cursor-pointer items-center gap-2'>
            <input
              type='radio'
              name='operatingStatus'
              className='h-4 w-4 accent-brand-blue'
              checked={state.operatingStatus === 'under_one_year'}
              onChange={() => handleSelectStatus('under_one_year')}
            />
            <span className='text-sm text-neutral-dark'>尚未結算申報過（公司營運未滿一年）</span>
          </label>
          <label className='flex cursor-pointer items-center gap-2'>
            <input
              type='radio'
              name='operatingStatus'
              className='h-4 w-4 accent-brand-blue'
              checked={state.operatingStatus === 'over_one_year'}
              onChange={() => handleSelectStatus('over_one_year')}
            />
            <span className='text-sm text-neutral-dark'>穩定經營超過一年以上</span>
          </label>
        </div>
      </SectionCard>

      {state.operatingStatus === 'over_one_year' && (
        <SectionCard title='請先備齊以下文件'>
          <p className='text-sm text-neutral-mid'>接下來會一頁一頁呈現表單，每一頁都可以上傳文件快速帶入資料，也可以直接手動輸入。</p>
          <ul className='list-inside list-disc space-y-1 text-sm text-neutral-mid'>
            {FORM_LIST.map(form => (
              <li key={form.formNo}>
                {form.title}
                {form.optional && '（如有）'}
              </li>
            ))}
          </ul>
          <button type='button' onClick={() => setExampleOpen(true)} className='self-start text-sm text-brand-blue underline underline-offset-2'>
            查看範例
          </button>
        </SectionCard>
      )}
    </>
  );
}
