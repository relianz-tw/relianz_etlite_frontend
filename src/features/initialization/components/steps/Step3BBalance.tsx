'use client';

import { useInitialization } from '../../state/InitializationContext';
import { calcBalanceTotals } from '../../utils/openingBalance';
import { BalanceCheckBar } from '../BalanceCheckBar';
import { OpeningBalanceForm } from '../OpeningBalanceForm';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import Label from '@/components/ui/Label';
import { formatLocalDate } from '@/lib/utils';
import type { BalanceGroup } from '../../state/initializationReducer';

export function Step3BBalance() {
  const { state, dispatch } = useInitialization();
  const totals = calcBalanceTotals(state.openingBalance);

  return (
    <div className='flex flex-col flex-1 min-h-0 p-5 md:p-12 md:overflow-y-auto'>
      <div className='flex flex-col gap-5'>
        <div>
          <h1 className='text-xl md:text-2xl font-bold text-neutral-dark mb-2 font-notoSerif'>核對期初資料</h1>
          <p className='text-sm text-neutral-mid'>綠框欄位為文件辨識自動帶入，請逐項核對；其餘欄位可直接手動輸入。</p>
        </div>

        <div className='max-w-xs'>
          <Label className='mb-2'>開帳基準日</Label>
          <DatePicker
            value={state.openingBalance.baseDate ? new Date(state.openingBalance.baseDate) : undefined}
            onChange={date => dispatch({ type: 'SET_BALANCE_BASE_DATE', payload: date ? formatLocalDate(date) : '' })}
          />
        </div>

        <OpeningBalanceForm
          balance={state.openingBalance}
          onChangeField={(group: BalanceGroup, key: string, value: number) => dispatch({ type: 'SET_BALANCE_FIELD', payload: { group, key, value } })}
        />

        <BalanceCheckBar totals={totals} onApplyAdjustment={() => dispatch({ type: 'APPLY_OWNER_ADJUSTMENT', payload: { amount: totals.diff } })} />
      </div>

      <MobileFixedBottom>
        <Button onClick={() => dispatch({ type: 'NEXT_STEP' })} className='w-full'>
          下一步：確認開帳
        </Button>
      </MobileFixedBottom>
    </div>
  );
}
