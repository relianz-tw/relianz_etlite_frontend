'use client';

import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import Label from '@/components/ui/Label';
import Modal from '@/components/ui/Modal';
import MoneyInput from '@/components/ui/MoneyInput';
import SegmentedControl from '@/components/ui/SegmentedControl';
import SubjectPicker from '@/components/ui/SubjectPicker';
import type { SubjectOption } from '@/components/ui/SubjectPicker';
import Textarea from '@/components/ui/Textarea';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useState } from 'react';
import type { NewBankTransactionInput } from '../types';

interface AddTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  /** 呼叫端負責實際寫入（含帶入 bankAccountUuid）；失敗時 throw Error，對話框會攔截並顯示錯誤訊息、不關閉 */
  onSubmit: (input: NewBankTransactionInput) => Promise<void>;
}

type Direction = '0' | '1';

// 順序與標籤比照交易列表「支出金額／存入金額」欄位慣例；cashDirection 0=存入／1=支出
const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: '1', label: '支出' },
  { value: '0', label: '存入' },
];

interface FormState {
  paymentDate: Date | undefined;
  direction: Direction;
  amount: number;
  subject: SubjectOption | null;
  memo: string;
}

const EMPTY_FORM: FormState = {
  paymentDate: undefined,
  direction: '1',
  amount: 0,
  subject: null,
  memo: '',
};

function toYmd(date: Date | undefined): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * 新增銀行直接提／匯款交易（POST /ael/bankAccounts/cashMovements）：與一般沖帳交易不同，
 * 此類交易無關聯原單，需另外指定會計科目（如股東往來、銀行手續費等）。
 */
export default function AddTransactionDialog({ open, onClose, onSubmit }: AddTransactionDialogProps) {
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
    if (!form.paymentDate) {
      setError('請選擇交易日期');
      return;
    }
    if (form.amount <= 0) {
      setError('請輸入大於 0 的金額');
      return;
    }
    if (!form.subject) {
      setError('請選擇會計科目');
      return;
    }
    if (!form.memo.trim()) {
      setError('請輸入備註');
      return;
    }
    if (form.subject.id == null) {
      setError('此科目缺少科目代碼，請重新選擇');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        paymentDate: toYmd(form.paymentDate),
        cashDirection: Number(form.direction),
        amount: form.amount,
        officialAccountingSubjectId: form.subject.id,
        memo: form.memo.trim(),
      });
      onClose();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="新增交易" widthClassName="max-w-[480px]">
      <div className="flex flex-col gap-4">
        <div>
          <Label required>交易日期</Label>
          <DatePicker value={form.paymentDate} onChange={date => setForm(f => ({ ...f, paymentDate: date }))} />
        </div>

        <div>
          <Label required>收支方向與金額</Label>
          <div className="flex items-center gap-3">
            <div className="w-32 shrink-0">
              <SegmentedControl options={DIRECTION_OPTIONS} value={form.direction} onChange={v => setForm(f => ({ ...f, direction: v }))} size="sm" />
            </div>
            <MoneyInput value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} widthClassName="flex-1" />
          </div>
        </div>

        <div>
          <Label required>會計科目</Label>
          <SubjectPicker value={form.subject} onChange={subject => setForm(f => ({ ...f, subject }))} placeholder="請選擇會計科目" scope="bank" />
        </div>

        {error && <p className="-mt-1 text-xs text-semantic-error">{error}</p>}

        <div>
          <Label required>備註</Label>
          <Textarea placeholder="例：股東往來匯入" value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} />
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
