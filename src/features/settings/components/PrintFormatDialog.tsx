'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { useEffect, useState } from 'react';

export interface PrintFormatSettings {
  invoiceFormat: 'triple' | 'double';
  printerType: 'laser' | 'thermal';
}

interface PrintFormatDialogProps {
  open: boolean;
  onClose: () => void;
  value: PrintFormatSettings;
  onSubmit: (value: PrintFormatSettings) => void;
}

const INVOICE_FORMAT_OPTIONS: { value: PrintFormatSettings['invoiceFormat']; label: string }[] = [
  { value: 'triple', label: '三聯式' },
  { value: 'double', label: '二聯式' },
];
const PRINTER_TYPE_OPTIONS: { value: PrintFormatSettings['printerType']; label: string }[] = [
  { value: 'laser', label: '雷射印表機' },
  { value: 'thermal', label: '熱感印表機' },
];

export default function PrintFormatDialog({ open, onClose, value, onSubmit }: PrintFormatDialogProps) {
  const [form, setForm] = useState(value);

  useEffect(() => {
    if (open) setForm(value);
  }, [open, value]);

  if (!open) return null;

  const handleSubmit = () => {
    onSubmit(form);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="列印格式設定" widthClassName="max-w-[400px]">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">發票格式</label>
          <SegmentedControl
            options={INVOICE_FORMAT_OPTIONS}
            value={form.invoiceFormat}
            onChange={v => setForm(f => ({ ...f, invoiceFormat: v }))}
            size="sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">列印方式</label>
          <SegmentedControl
            options={PRINTER_TYPE_OPTIONS}
            value={form.printerType}
            onChange={v => setForm(f => ({ ...f, printerType: v }))}
            size="sm"
          />
        </div>
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
