'use client';

import Button from '@/components/ui/Button';
import Label from '@/components/ui/Label';
import Modal from '@/components/ui/Modal';
import SegmentedControl from '@/components/ui/SegmentedControl';
import TextInput from '@/components/ui/TextInput';
import { useState } from 'react';

interface AddSalaryItemDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: { name: string; isDeduction: boolean }) => void;
}

const TYPE_OPTIONS: { value: 'addition' | 'deduction'; label: string }[] = [
  { value: 'addition', label: '加項' },
  { value: 'deduction', label: '減項' },
];

/** 新增薪資項目彈窗：新項目會套用到該月所有員工列（金額預設 0） */
export default function AddSalaryItemDialog({ open, onClose, onAdd }: AddSalaryItemDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'addition' | 'deduction'>('addition');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('請輸入項目名稱');
      return;
    }
    onAdd({ name: name.trim(), isDeduction: type === 'deduction' });
    setName('');
    setType('addition');
    setError('');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="新增薪資項目" widthClassName="max-w-[420px]">
      <div className="flex flex-col gap-4">
        <div>
          <Label required>項目名稱</Label>
          <TextInput
            value={name}
            onChange={e => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="請輸入項目名稱"
          />
          {error && <p className="mt-1 text-xs text-semantic-error">{error}</p>}
        </div>
        <div>
          <Label>項目類型</Label>
          <SegmentedControl options={TYPE_OPTIONS} value={type} onChange={setType} size="sm" />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button onClick={handleSubmit}>確定</Button>
      </div>
    </Modal>
  );
}
