'use client';

import Badge from '@/components/ui/Badge';
import MoneyInput from '@/components/ui/MoneyInput';
import Select from '@/components/ui/Select';
import SubjectSelect from '@/components/ui/SubjectSelect';
import Textarea from '@/components/ui/Textarea';
import type { Side } from '../../types';
import { TAX_RATE_LABEL } from '../data';
import type { TransactionFormState, TransactionMode } from '../types';
import Field from './Field';

interface TransactionAmountCardProps {
  side: Side;
  mode: TransactionMode;
  form: TransactionFormState;
  onChange: (patch: Partial<TransactionFormState>) => void;
}

/** 交易明細 API（invoice 區塊）未提供 taxType/costCategory 的解碼對照，編輯畫面先標記尚未串接 */
const NOT_WIRED_BADGE = (
  <Badge tone="neutral" variant="muted">
    尚未串接
  </Badge>
);

export default function TransactionAmountCard({ side, mode, form, onChange }: TransactionAmountCardProps) {
  const totalAmount = form.salesAmount + form.exemptSalesAmount + form.taxAmount;
  const editBadge = mode === 'edit' ? NOT_WIRED_BADGE : undefined;

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <h2 className="mb-5 text-base font-semibold text-neutral-dark">金額</h2>
      <div className="flex flex-col gap-4">
        <Field label="營業稅" badge={editBadge}>
          <Select widthClassName="w-full" value={TAX_RATE_LABEL} disabled onValueChange={() => {}}>
            <option value={TAX_RATE_LABEL}>{TAX_RATE_LABEL}</option>
          </Select>
        </Field>

        <Field label={side === 'purchase' ? '費用類別' : '收入科目'} badge={editBadge}>
          <SubjectSelect value={form.expenseCategory} onChange={s => onChange({ expenseCategory: s })} />
        </Field>

        <Field label="銷售額">
          <MoneyInput value={form.salesAmount} onChange={v => onChange({ salesAmount: v })} />
        </Field>

        <Field label="免稅銷售額">
          <MoneyInput value={form.exemptSalesAmount} onChange={v => onChange({ exemptSalesAmount: v })} />
        </Field>

        <Field label="稅額">
          <MoneyInput value={form.taxAmount} onChange={v => onChange({ taxAmount: v })} />
        </Field>

        <Field label="總金額">
          <MoneyInput value={totalAmount} disabled readOnly />
        </Field>

        <Field label="備註">
          <Textarea value={form.note} onChange={e => onChange({ note: e.target.value })} placeholder="備註（選填）" />
        </Field>
      </div>
    </div>
  );
}
