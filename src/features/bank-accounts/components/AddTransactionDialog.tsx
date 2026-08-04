'use client';

import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import Modal from '@/components/ui/Modal';
import MoneyInput from '@/components/ui/MoneyInput';
import SegmentedControl from '@/components/ui/SegmentedControl';
import TextInput from '@/components/ui/TextInput';
import Textarea from '@/components/ui/Textarea';
import { useEffect, useState } from 'react';
import type { NewBankTransactionInput } from '../types';

interface AddTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  bankAccountUuid: string;
  /** 呼叫端負責實際寫入；失敗時 throw Error，對話框會攔截並顯示錯誤訊息、不關閉 */
  onSubmit: (input: NewBankTransactionInput) => Promise<void>;
}

type Direction = 'expense' | 'deposit';

const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: 'expense', label: '支出' },
  { value: 'deposit', label: '存入' },
];

interface FormState {
  transactionDate: Date | undefined;
  accountingDate: Date | undefined;
  summary: string;
  direction: Direction;
  amount: number;
  remark: string;
}

const EMPTY_FORM: FormState = {
  transactionDate: undefined,
  accountingDate: undefined,
  summary: '',
  direction: 'expense',
  amount: 0,
  remark: '',
};

function toYmd(date: Date | undefined): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * 新增銀行帳戶交易：以「收支方向」切換單一金額欄位所代表的支出/存入，
 * 由結構上避免同一筆同時填寫支出與存入金額造成的互斥驗證問題。
 */
export default function AddTransactionDialog({ open, onClose, bankAccountUuid, onSubmit }: AddTransactionDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 每次開啟對話框時重置表單，避免殘留上一筆的輸入
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.transactionDate || !form.accountingDate) {
      setError('請選擇交易時間與帳務時間');
      return;
    }
    if (!form.summary.trim()) {
      setError('請輸入摘要');
      return;
    }
    if (form.amount <= 0) {
      setError('請輸入大於 0 的金額');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        bankAccountUuid,
        transactionDate: toYmd(form.transactionDate),
        accountingDate: toYmd(form.accountingDate),
        summary: form.summary.trim(),
        expense: form.direction === 'expense' ? form.amount : null,
        deposit: form.direction === 'deposit' ? form.amount : null,
        remark: form.remark.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗');
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="新增交易" widthClassName="max-w-[480px]">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">交易時間</label>
            <DatePicker value={form.transactionDate} onChange={date => setForm(f => ({ ...f, transactionDate: date }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">帳務時間</label>
            <DatePicker value={form.accountingDate} onChange={date => setForm(f => ({ ...f, accountingDate: date }))} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">摘要</label>
          <TextInput placeholder="例：貨款收入" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">收支方向與金額</label>
          <div className="mb-2 w-40">
            <SegmentedControl options={DIRECTION_OPTIONS} value={form.direction} onChange={v => setForm(f => ({ ...f, direction: v }))} size="sm" />
          </div>
          <MoneyInput value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} />
        </div>

        {error && <p className="-mt-1 text-xs text-semantic-error">{error}</p>}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">備註</label>
          <Textarea placeholder="憑證備註（選填）" value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '儲存中…' : '儲存'}
        </Button>
      </div>
    </Modal>
  );
}
