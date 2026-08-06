'use client';

import Button from '@/components/ui/Button';
import Label from '@/components/ui/Label';
import Modal from '@/components/ui/Modal';
import TextInput from '@/components/ui/TextInput';
import { useState } from 'react';

interface ChangeCardDialogProps {
  open: boolean;
  onClose: () => void;
  /** 儲存後只保留卡號末四碼與到期日，供卡片顯示更新 */
  onSubmit: (result: { last4: string; expiry: string }) => void;
}

export default function ChangeCardDialog({ open, onClose, onSubmit }: ChangeCardDialogProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 4) {
      setError('請輸入正確的卡號');
      return;
    }
    if (!expiry.trim()) {
      setError('請輸入到期日期');
      return;
    }
    onSubmit({ last4: digits.slice(-4), expiry: expiry.trim() });
    setCardNumber('');
    setExpiry('');
    setError('');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="變更付款信用卡" widthClassName="max-w-[400px]">
      <div className="flex flex-col gap-4">
        <div>
          <Label required>卡號</Label>
          <TextInput
            placeholder="請輸入完整卡號"
            value={cardNumber}
            onChange={e => {
              setCardNumber(e.target.value);
              setError('');
            }}
          />
        </div>
        <div>
          <Label required>到期日期</Label>
          <TextInput
            placeholder="MM/YY"
            value={expiry}
            onChange={e => {
              setExpiry(e.target.value);
              setError('');
            }}
          />
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
