'use client';

import MoneyInput from '@/components/ui/MoneyInput';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { EXPENSE_CATEGORIES } from '../../data';
import type { Side } from '../../types';
import { EXPENSE_CATEGORY_PLACEHOLDER, TAX_RATE_LABEL } from '../data';
import type { TransactionFormState } from '../types';
import Field from './Field';

interface TransactionAmountCardProps {
  side: Side;
  form: TransactionFormState;
  onChange: (patch: Partial<TransactionFormState>) => void;
}

export default function TransactionAmountCard({ side, form, onChange }: TransactionAmountCardProps) {
  const totalAmount = form.salesAmount + form.taxAmount;

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <h2 className="mb-5 text-base font-semibold text-neutral-dark">金額</h2>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 nav:grid-cols-2">
        <Field label="營業稅">
          <Select widthClassName="w-full" value={TAX_RATE_LABEL} disabled onValueChange={() => {}}>
            <option value={TAX_RATE_LABEL}>{TAX_RATE_LABEL}</option>
          </Select>
        </Field>

        {side === 'purchase' && (
          <Field label="費用類別">
            <Select widthClassName="w-full" value={form.expenseCategory} onValueChange={v => onChange({ expenseCategory: v })}>
              <option value={EXPENSE_CATEGORY_PLACEHOLDER}>{EXPENSE_CATEGORY_PLACEHOLDER}</option>
              {EXPENSE_CATEGORIES.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="銷售額">
          <MoneyInput value={form.salesAmount} onChange={v => onChange({ salesAmount: v })} />
        </Field>

        <Field label="稅額">
          <MoneyInput value={form.taxAmount} onChange={v => onChange({ taxAmount: v })} />
        </Field>

        <Field label="總金額">
          <MoneyInput value={totalAmount} disabled readOnly />
        </Field>

        <Field label="備註" className="nav:col-span-2">
          <Textarea value={form.note} onChange={e => onChange({ note: e.target.value })} placeholder="備註（選填）" />
        </Field>
      </div>
    </div>
  );
}
