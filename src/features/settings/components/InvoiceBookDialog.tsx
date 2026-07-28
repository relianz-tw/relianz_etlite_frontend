'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import TextInput from '@/components/ui/TextInput';
import { useEffect, useState } from 'react';
import type { InvoiceBookRecord } from '../data';

interface InvoiceBookDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (book: Omit<InvoiceBookRecord, 'id'>) => void;
  /** 帶入此值代表編輯既有發票本；不帶則為新增 */
  initial?: InvoiceBookRecord;
}

const EMPTY_FORM: Omit<InvoiceBookRecord, 'id'> = { name: '', trackCode: '', startNumber: '' };

export default function InvoiceBookDialog({ open, onClose, onSubmit, initial }: InvoiceBookDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initial ?? EMPTY_FORM);
      setError('');
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.name.trim() || !form.trackCode.trim() || !form.startNumber.trim()) {
      setError('請填寫完整的名稱、字軌與起號');
      return;
    }
    onSubmit(form);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={initial ? '編輯發票本' : '新增本期發票本'} widthClassName="max-w-[400px]">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">名稱</label>
          <TextInput
            placeholder="例：三聯式手開"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">字軌</label>
            <TextInput placeholder="例：CA" value={form.trackCode} onChange={e => setForm(f => ({ ...f, trackCode: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">起號</label>
            <TextInput
              placeholder="例：32323200"
              value={form.startNumber}
              onChange={e => setForm(f => ({ ...f, startNumber: e.target.value }))}
            />
          </div>
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
