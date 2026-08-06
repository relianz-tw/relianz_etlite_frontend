'use client';

import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Label from '@/components/ui/Label';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { useEffect, useState } from 'react';
import type { OperatingStatusRecord } from '../data';

interface OperatingStatusDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (record: Omit<OperatingStatusRecord, 'id'>) => void;
  /** 帶入此值代表修正既有紀錄；不帶則為新增 */
  initial?: OperatingStatusRecord;
}

const ONGOING_LABEL = '進行中';
const EMPTY_FORM: Omit<OperatingStatusRecord, 'id'> = { status: '開業', startDate: '', endDate: '' };

export default function OperatingStatusDialog({ open, onClose, onSubmit, initial }: OperatingStatusDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [ongoing, setOngoing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const base = initial ?? EMPTY_FORM;
      setForm(base);
      setOngoing(base.endDate === ONGOING_LABEL);
      setError('');
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.startDate.trim()) {
      setError('請填寫開始日期');
      return;
    }
    if (!ongoing && !form.endDate.trim()) {
      setError('請填寫結束日期，或勾選「仍在此狀態」');
      return;
    }
    onSubmit({ ...form, endDate: ongoing ? ONGOING_LABEL : form.endDate });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={initial ? '修正營業狀態紀錄' : '新增停業紀錄'} widthClassName="max-w-[400px]">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">狀態</label>
          <Select widthClassName="w-full" value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as OperatingStatusRecord['status'] }))}>
            <option value="開業">開業</option>
            <option value="停業">停業</option>
            <option value="復業">復業</option>
          </Select>
        </div>
        <div>
          <Label required>開始日期</Label>
          <TextInput placeholder="YYYY-MM-DD" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
        </div>
        <div>
          <Label required>結束日期</Label>
          <TextInput
            placeholder="YYYY-MM-DD"
            value={ongoing ? '' : form.endDate}
            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            disabled={ongoing}
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-neutral-mid">
            <Checkbox checked={ongoing} onChange={() => setOngoing(o => !o)} aria-label="仍在此狀態" />
            仍在此狀態
          </label>
        </div>
        {error && <p className="text-xs text-semantic-error">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          儲存
        </Button>
      </div>
    </Modal>
  );
}
