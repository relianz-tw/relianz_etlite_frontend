'use client';

import { useInitialization } from '../state/InitializationContext';
import type { ReportKey } from '../state/initializationReducer';
import { fmtCurrency } from '@/lib/utils';
import { CircleCheck, Wallet } from 'lucide-react';

/** 本期結果卡讀取的欄位：應實繳稅額、累積留抵稅額（值由後端算出或辨識帶入，前端不計算） */
const PAYABLE_KEY = 'TAX_PAYABLE';
const CARRY_CREDIT_KEY = 'TAX_CARRY_CREDIT';

/** 營業稅 401／403 底部結果卡：應繳大於 0 顯示本期應實繳稅額，否則顯示累積留抵稅額 */
export function VatResultCard({ reportId }: { reportId: ReportKey }) {
  const { state } = useInitialization();
  const data = state.reports[reportId]?.fields ?? {};
  const payable = Number(data[PAYABLE_KEY]?.value) || 0;
  const carryCredit = Number(data[CARRY_CREDIT_KEY]?.value) || 0;

  return (
    <section aria-live='polite' className='flex items-center gap-3 rounded-lg border border-neutral-blue-gray/30 bg-surface-cream px-4 py-3'>
      {payable > 0 ? <Wallet size={20} className='shrink-0 text-brand-blue' /> : <CircleCheck size={20} className='shrink-0 text-semantic-success' />}
      <div className='flex min-w-0 flex-col'>
        <span className='text-[13px] font-bold text-neutral-dark'>{payable > 0 ? '本期應實繳稅額' : '本期累積留抵稅額'}</span>
        <span className='text-lg font-bold tabular-nums text-neutral-dark'>{fmtCurrency(payable > 0 ? payable : carryCredit)}</span>
        <span className='text-xs text-neutral-mid'>
          {payable > 0 ? '申報前請先持營業稅繳款書繳納，並附繳款書申報聯' : '留抵稅額將自動帶入下期「上期累積留抵稅額」'}
        </span>
      </div>
    </section>
  );
}
