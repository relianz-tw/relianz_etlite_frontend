'use client';

import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import Textarea from '@/components/ui/Textarea';
import { fmtCurrency } from '@/lib/utils';
import { useState } from 'react';
import type { AllowanceRecord } from '../../types';
import { TRANSACTION_ALLOWANCES } from '../data';
import Field from './Field';

/** Date → 民國年日期字串（如 "115/03/26"），對齊帳簿列表資料的日期格式 */
function formatRocDate(date: Date): string {
  const year = date.getFullYear() - 1911;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/** 銷項編輯頁的折讓區塊：顯示歷史紀錄並可在頁面內直接新增，視覺模擬不接後端 */
export default function TransactionAllowanceCard() {
  const [allowances, setAllowances] = useState<AllowanceRecord[]>(TRANSACTION_ALLOWANCES);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');

  const handleAdd = () => {
    setAllowances(list => [...list, { id: `ALW-${list.length + 1}-${Date.now()}`, date: date ? formatRocDate(date) : '', amount, note }]);
    setDate(undefined);
    setAmount(0);
    setNote('');
  };

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <h2 className="mb-5 text-base font-semibold text-neutral-dark">折讓</h2>

      {allowances.length === 0 ? (
        <div className="mb-5 rounded-md bg-surface-cream p-4 text-center text-sm text-neutral-mid">尚無折讓紀錄</div>
      ) : (
        <div className="mb-5 flex flex-col gap-2 rounded-md border border-neutral-blue-gray/30 p-3">
          {allowances.map(record => (
            <div key={record.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-mono text-neutral-mid">{record.date}</span>
              <span className="flex-1 truncate text-neutral-dark">{record.note}</span>
              <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(record.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-8 gap-y-4 nav:grid-cols-2">
        <Field label="折讓日期">
          <DatePicker value={date} onChange={setDate} />
        </Field>
        <Field label="折讓金額">
          <MoneyInput value={amount} onChange={setAmount} />
        </Field>
        <Field label="說明" className="nav:col-span-2">
          <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="請輸入折讓原因" rows={3} />
        </Field>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="primary" onClick={handleAdd}>
          新增折讓
        </Button>
      </div>
    </div>
  );
}
