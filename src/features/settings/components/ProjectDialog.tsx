'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { useEffect, useState } from 'react';
import type { ProjectRecord } from '../data';

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (project: Omit<ProjectRecord, 'id'>) => void;
  /** 帶入此值代表編輯既有專案；不帶則為新增 */
  initial?: ProjectRecord;
}

const EMPTY_FORM: Omit<ProjectRecord, 'id'> = { name: '', status: '進行中', startDate: '', endDate: '' };

export default function ProjectDialog({ open, onClose, onSubmit, initial }: ProjectDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  // 每次開啟對話框時，依 initial 重新帶入表單（新增為空白、編輯為既有值）
  useEffect(() => {
    if (open) {
      setForm(initial ?? EMPTY_FORM);
      setError('');
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setError('請輸入專案名稱');
      return;
    }
    onSubmit(form);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={initial ? '編輯專案' : '新增專案'} widthClassName="max-w-[420px]">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">專案名稱</label>
          <TextInput
            placeholder="例：測試專案"
            value={form.name}
            onChange={e => {
              setForm(f => ({ ...f, name: e.target.value }));
              setError('');
            }}
          />
          {error && <p className="mt-1 text-xs text-semantic-error">{error}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">狀態</label>
          <Select
            widthClassName="w-full"
            value={form.status}
            onValueChange={v => setForm(f => ({ ...f, status: v as ProjectRecord['status'] }))}
          >
            <option value="進行中">進行中</option>
            <option value="已完成">已完成</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">開始日期</label>
            <TextInput placeholder="YYYY-MM-DD" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">結束日期</label>
            <TextInput placeholder="YYYY-MM-DD" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>
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
