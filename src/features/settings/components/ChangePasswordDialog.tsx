'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import TextInput from '@/components/ui/TextInput';
import { useState } from 'react';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

const MIN_LENGTH = 6;

export default function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError('');
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!current || !next || !confirm) {
      setError('請完整填寫所有欄位');
      return;
    }
    if (next.length < MIN_LENGTH) {
      setError(`新密碼至少需要 ${MIN_LENGTH} 碼`);
      return;
    }
    if (next !== confirm) {
      setError('兩次輸入的新密碼不一致');
      return;
    }
    handleClose();
  };

  return (
    <Modal open onClose={handleClose} title="變更密碼" widthClassName="max-w-[400px]">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">目前密碼</label>
          <TextInput
            type="password"
            value={current}
            onChange={e => {
              setCurrent(e.target.value);
              setError('');
            }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">新密碼</label>
          <TextInput
            type="password"
            value={next}
            onChange={e => {
              setNext(e.target.value);
              setError('');
            }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">確認新密碼</label>
          <TextInput
            type="password"
            value={confirm}
            onChange={e => {
              setConfirm(e.target.value);
              setError('');
            }}
          />
        </div>
        {error && <p className="text-xs text-semantic-error">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={handleClose}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          儲存
        </Button>
      </div>
    </Modal>
  );
}
