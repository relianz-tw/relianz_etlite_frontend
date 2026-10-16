'use client';

import { useInitialization } from '../state/InitializationContext';
import { StepPageHeader } from '@/components/initialization/StepPageHeader';
import type { StepNavProps } from '@/components/initialization/StepPageHeader';
import { StepProgress, type StepProgressValue } from '@/components/initialization/StepProgress';
import Label from '@/components/ui/Label';
import MoneyInput from '@/components/ui/MoneyInput';
import SectionCard from '@/components/ui/SectionCard';
import TextInput from '@/components/ui/TextInput';
import { fmtCurrency } from '@/lib/utils';
import { Plus, TriangleAlert, X } from 'lucide-react';
import { useEffect } from 'react';
import type { Partner } from '../state/initializationReducer';

const EMPTY_OWNER: Partner = { title: '負責人', name: '', idNo: '', address: '', capital: 0 };
const EMPTY_PARTNER: Partner = { title: '合夥人', name: '', idNo: '', address: '', capital: 0 };

/** 負責人（獨資）或負責人及合夥人（合夥）的基本資料與出資額 */
export function PartnersPage({ kicker, nav, progress }: { kicker: string; nav: Omit<StepNavProps, 'nextDisabled'>; progress: StepProgressValue }) {
  const { state, dispatch } = useInitialization();
  const isPartnership = state.orgType === 'partnership';
  const partners = state.partners.length > 0 ? state.partners : [EMPTY_OWNER];

  // 負責人姓名預設帶封面的負責人（只補空白，不覆蓋使用者已輸入的值）；寫進 state 才會被保存與送出
  const coverOwnerName = String(state.reports.CIT_COVER?.fields.HDR_OWNER_NAME?.value ?? '');
  useEffect(() => {
    if (!coverOwnerName) return;
    const owner = partners.find(p => p.title === '負責人');
    if (owner?.name) return;
    dispatch({ type: 'SET_PARTNERS', payload: partners.map(p => (p.title === '負責人' ? { ...p, name: coverOwnerName } : p)) });
    // partners 變動不需重跑，只在封面負責人變動或首次進入時補值
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverOwnerName]);

  // 出資額加總應等於資產負債表 3110 欄（資本額）；資產負債表尚未填（為 0）時無從比對，不擋
  const totalCapital = partners.reduce((sum, p) => sum + p.capital, 0);
  const balanceCapital = Number(state.reports.CIT_BALANCE_SHEET?.fields.BS_3110?.value) || 0;
  const mismatch = balanceCapital !== 0 && totalCapital !== balanceCapital;

  const update = (index: number, patch: Partial<Partner>) => dispatch({ type: 'SET_PARTNERS', payload: partners.map((p, i) => (i === index ? { ...p, ...patch } : p)) });

  return (
    <>
      <StepPageHeader kicker={kicker} title={isPartnership ? '負責人及合夥人基本資料' : '負責人基本資料'} badges={['給客戶填寫']} nav={{ ...nav, nextDisabled: mismatch }}>
        <p className='text-sm text-neutral-mid'>{isPartnership ? '合夥需填負責人及每位合夥人，出資額加總應等於資產負債表資本額 (3110)。' : '請填寫負責人資料與出資額。'}</p>
        <StepProgress {...progress} />
        {mismatch && (
          <p className='text-xs text-semantic-error'>
            出資額合計 {fmtCurrency(totalCapital)} 與資產負債表資本額 {fmtCurrency(balanceCapital)} 不符，請調整後再前往下一份。
          </p>
        )}
      </StepPageHeader>

      {partners.map((p, index) => (
        <SectionCard key={index} title={p.title === '負責人' ? '負責人' : `合夥人 ${index}`}>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6'>
            <Field label='姓名'>
              <TextInput value={p.name} onChange={e => update(index, { name: e.target.value })} />
            </Field>
            <Field label='身分證字號'>
              <TextInput value={p.idNo} onChange={e => update(index, { idNo: e.target.value.toUpperCase() })} />
            </Field>
            <Field label='戶籍地址'>
              <TextInput value={p.address} onChange={e => update(index, { address: e.target.value })} />
            </Field>
            <Field label='出資額'>
              <MoneyInput value={p.capital} onChange={value => update(index, { capital: value })} />
            </Field>
          </div>
          {index > 0 && (
            <button
              type='button'
              onClick={() => dispatch({ type: 'SET_PARTNERS', payload: partners.filter((_, i) => i !== index) })}
              className='flex items-center gap-1 self-end text-[13px] text-neutral-mid hover:text-semantic-error'
            >
              <X size={14} />
              移除此合夥人
            </button>
          )}
        </SectionCard>
      ))}

      {isPartnership && (
        <button
          type='button'
          onClick={() => dispatch({ type: 'SET_PARTNERS', payload: [...partners, EMPTY_PARTNER] })}
          className='flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-blue-gray/50 py-3 text-sm font-medium text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5'
        >
          <Plus size={16} />
          新增合夥人
        </button>
      )}

      <SectionCard>
        <div className='flex flex-wrap items-center justify-between gap-2 text-sm'>
          <span>
            出資額合計 <strong className='font-bold'>{fmtCurrency(totalCapital)}</strong>
          </span>
          {balanceCapital !== 0 && (
            <span className={mismatch ? 'flex items-center gap-1.5 font-bold text-semantic-error' : 'font-bold text-semantic-success'}>
              {mismatch && <TriangleAlert size={16} />}
              {mismatch ? `與資產負債表資本額 ${fmtCurrency(balanceCapital)} 不符` : '與資產負債表資本額相符'}
            </span>
          )}
        </div>
      </SectionCard>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <Label className='!mb-0'>{label}</Label>
      {children}
    </div>
  );
}
