'use client';

import Button from '@/components/ui/Button';
import Label from '@/components/ui/Label';
import Modal from '@/components/ui/Modal';
import TextInput from '@/components/ui/TextInput';
import { useEffect, useState } from 'react';

interface TagDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  /** 帶入此值代表編輯既有標籤；不帶則為新增 */
  initialName?: string;
}

export default function TagDialog({ open, onClose, onSubmit, initialName }: TagDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(initialName ?? '');
      setError('');
    }
  }, [open, initialName]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('請輸入標籤名稱');
      return;
    }
    onSubmit(name.trim());
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={initialName ? '編輯標籤' : '新增標籤'} widthClassName="max-w-[360px]">
      <div>
        <Label required>標籤名稱</Label>
        <TextInput
          placeholder="例：鹿東國小-二校區"
          value={name}
          onChange={e => {
            setName(e.target.value);
            setError('');
          }}
        />
        {error && <p className="mt-1 text-xs text-semantic-error">{error}</p>}
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
