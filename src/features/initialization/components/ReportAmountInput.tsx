'use client';

import MoneyInput from '@/components/ui/MoneyInput';
import TextInput from '@/components/ui/TextInput';
import type { ReportField } from '../state/initializationReducer';
import type { ReportFieldDef } from '../reports/types';

interface ReportAmountInputProps {
  field: ReportFieldDef;
  data: ReportField;
  onChange: (value: string | number) => void;
}

/** 紙本對照列的數值輸入：金額用 MoneyInput，小數（稅率、比例）用 TextInput。扣除項由列首「−」表示，數值一律填正數 */
export function ReportAmountInput({ field, data, onChange }: ReportAmountInputProps) {
  // 筆數、份數、次數不是金額，不顯示 $ 與千分位格式
  if (field.type === 'decimal' || (field.type === 'money' && /(筆數|份數|次數)$/.test(field.label))) {
    const isCount = field.type === 'money';
    return (
      <TextInput
        widthClassName='w-full'
        inputMode={isCount ? 'numeric' : 'decimal'}
        value={String(data.value)}
        aiFilled={data.aiFilled}
        onChange={e => onChange(isCount ? Number(e.target.value.replace(/\D/g, '')) || 0 : e.target.value.replace(/[^\d.]/g, ''))}
      />
    );
  }
  return <MoneyInput widthClassName='w-full' value={Number(data.value) || 0} aiFilled={data.aiFilled} onChange={onChange} />;
}
