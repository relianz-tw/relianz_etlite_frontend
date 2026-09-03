'use client';

import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import Label from '@/components/ui/Label';
import Modal from '@/components/ui/Modal';
import { Upload } from 'lucide-react';
import { useState } from 'react';

interface PaymentProofDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  onConfirm: (paymentDate: Date, fileName: string) => void;
}

/** 上傳繳款證明彈窗：選繳款日期＋選檔案，僅記錄檔名，不做真實上傳（無後端儲存） */
export default function PaymentProofDialog({ open, onClose, title, onConfirm }: PaymentProofDialogProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleSubmit = () => {
    if (!date) {
      setError('請選擇繳款日期');
      return;
    }
    if (!fileName) {
      setError('請上傳繳款證明');
      return;
    }
    onConfirm(date, fileName);
    setDate(undefined);
    setFileName('');
    setError('');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={title} widthClassName="max-w-[440px]">
      <div className="flex flex-col gap-4">
        <div>
          <Label required>繳款日期</Label>
          <DatePicker value={date} onChange={setDate} placeholder="選擇繳款日期" />
        </div>
        <div>
          <Label required>上傳繳款證明</Label>
          <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-neutral-blue-gray/50 bg-white text-center hover:border-brand-blue">
            <Upload size={20} className="text-neutral-mid" />
            <span className="text-xs text-neutral-mid">{fileName || '點擊上傳檔案（PDF、JPG、PNG）'}</span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
        {error && <p className="text-xs text-semantic-error">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button onClick={handleSubmit}>確認已繳款</Button>
      </div>
    </Modal>
  );
}
