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
  /** paymentDate 目前僅供畫面顯示參考，實際繳款日由 record 的給付日帶入（後端上傳證明 API 未收此欄位） */
  onConfirm: (paymentDate: Date, file: File) => void;
}

/** 上傳繳款證明彈窗：選繳款日期＋選檔案，送出真實檔案給呼叫端上傳 */
export default function PaymentProofDialog({ open, onClose, title, onConfirm }: PaymentProofDialogProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) setFile(picked);
  };

  const handleSubmit = () => {
    if (!date) {
      setError('請選擇繳款日期');
      return;
    }
    if (!file) {
      setError('請上傳繳款證明');
      return;
    }
    onConfirm(date, file);
    setDate(undefined);
    setFile(null);
    setError('');
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
            <span className="text-xs text-neutral-mid">{file?.name || '點擊上傳檔案（PDF、JPG、PNG）'}</span>
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
