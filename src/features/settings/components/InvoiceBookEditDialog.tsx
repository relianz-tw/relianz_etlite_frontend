'use client';

import type { InvoiceBookDto } from '@/api/types';
import Button from '@/components/ui/Button';
import Label from '@/components/ui/Label';
import Modal from '@/components/ui/Modal';
import TextInput from '@/components/ui/TextInput';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useState } from 'react';

interface InvoiceBookEditDialogProps {
  open: boolean;
  onClose: () => void;
  /** 待編輯的發票本；僅用於帶入唯讀欄位與預設名稱 */
  book: InvoiceBookDto | null;
  /** 呼叫端負責實際送出 API；失敗時 throw Error，對話框會攔截並顯示錯誤訊息、不關閉 */
  onSubmit: (name: string) => Promise<void>;
}

/** 發票本編輯對話框：僅開放修改名稱，字軌／起始號碼／目前號碼為唯讀對照，避免異動已使用的發票規則 */
export default function InvoiceBookEditDialog({ open, onClose, book, onSubmit }: InvoiceBookEditDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(book?.name ?? '');
      setError('');
      setSubmitting(false);
    }
  }, [open, book]);

  if (!open || !book) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('請輸入發票本名稱');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(name.trim());
      onClose();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="編輯發票本" widthClassName="max-w-[400px]">
      <div className="flex flex-col gap-4">
        <div>
          <Label required>名稱</Label>
          <TextInput placeholder="例：三聯式手開" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>字軌</Label>
            <p className="text-sm text-neutral-mid">{book.aphabeticLetter}</p>
          </div>
          <div>
            <Label>起始號碼</Label>
            <p className="text-sm text-neutral-mid">{book.startNum}</p>
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
