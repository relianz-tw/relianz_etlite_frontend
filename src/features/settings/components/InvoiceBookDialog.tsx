'use client';

import { checkInvoiceTrackRule } from '@/api/invoice';
import Button from '@/components/ui/Button';
import Label from '@/components/ui/Label';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { ApiError, getFriendlyErrorMessage } from '@/lib/errors';
import { parseInvoicePeriodValue } from '@/lib/invoicePeriod';
import type { InvoicePeriodOption } from '@/lib/invoicePeriod';
import { useEffect, useState } from 'react';

interface InvoiceBookFormState {
  name: string;
  /** 對應 periods 選項的 value */
  period: string;
  /** 字軌，恰兩個大寫字母 */
  aphabeticLetter: string;
  /** 起始號碼，恰八位數字 */
  startNum: string;
}

interface InvoiceBookDialogProps {
  open: boolean;
  onClose: () => void;
  /** 呼叫端負責實際送出 API；失敗時 throw Error，對話框會攔截並顯示錯誤訊息、不關閉 */
  onSubmit: (form: InvoiceBookFormState) => Promise<void>;
  /** 「發票期間」下拉可選項目，由父層（InvoiceBookTab）動態取得後傳入 */
  periods: InvoicePeriodOption[];
  /** 開啟時預設帶入的期間（通常是父層目前選取的期間） */
  defaultPeriod: string;
}

export default function InvoiceBookDialog({ open, onClose, onSubmit, periods, defaultPeriod }: InvoiceBookDialogProps) {
  const [form, setForm] = useState<InvoiceBookFormState>({ name: '', period: defaultPeriod, aphabeticLetter: '', startNum: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: '', period: defaultPeriod, aphabeticLetter: '', startNum: '' });
      setError('');
      setSubmitting(false);
    }
  }, [open, defaultPeriod]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('請輸入發票本名稱');
      return;
    }
    if (form.aphabeticLetter.length !== 2) {
      setError('字軌請輸入 2 個大寫英文字母');
      return;
    }
    if (form.startNum.length !== 8) {
      setError('起始號碼請輸入 8 位數字');
      return;
    }
    const parsed = parseInvoicePeriodValue(form.period);
    if (!parsed) {
      setError('請選擇發票期間');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // 送出前先檢查字軌是否符合當期規則（GET /ael/invoice/trackRule 用西元年，故民國年 +1911）；
      // 不符合規則後端回 400，其餘錯誤（如網路逾時）不視為字軌錯誤，放行交由 save 端點再判斷
      try {
        await checkInvoiceTrackRule({ track: form.aphabeticLetter, year: String(parsed.rocYear + 1911), phase: String(parsed.phase) });
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) {
          setError('此發票字軌非屬於這期別的，請確認輸入內容是否正確');
          setSubmitting(false);
          return;
        }
      }
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="新增本期發票本" widthClassName="max-w-[400px]">
      <div className="flex flex-col gap-4">
        <div>
          <Label required>名稱</Label>
          <TextInput
            placeholder="例：三聯式手開"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <Label required>發票期間</Label>
          <Select value={form.period} onValueChange={v => setForm(f => ({ ...f, period: v }))}>
            {periods.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>字軌</Label>
            <TextInput
              placeholder="例：CA"
              maxLength={2}
              value={form.aphabeticLetter}
              onChange={e => setForm(f => ({ ...f, aphabeticLetter: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() }))}
            />
          </div>
          <div>
            <Label required>起始號碼</Label>
            <TextInput
              placeholder="例：00000001"
              maxLength={8}
              value={form.startNum}
              onChange={e => setForm(f => ({ ...f, startNum: e.target.value.replace(/[^0-9]/g, '') }))}
            />
          </div>
        </div>
        {error && <p className="text-xs text-semantic-error">{error}</p>}
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
