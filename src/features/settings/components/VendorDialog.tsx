'use client';

import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Modal from '@/components/ui/Modal';
import TextInput from '@/components/ui/TextInput';
import { useEffect, useState } from 'react';
import type { VendorRecord } from '../data';

interface VendorDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (vendor: Omit<VendorRecord, 'id'>) => void;
  /** 帶入此值代表編輯既有廠商；不帶則為新增 */
  initial?: VendorRecord;
}

const EMPTY_FORM: Omit<VendorRecord, 'id'> = {
  taxId: '',
  name: '',
  address: '',
  bankAccountName: '',
  bankName: '',
  bankBranch: '',
  bankAccountNumber: '',
};

export default function VendorDialog({ open, onClose, onSubmit, initial }: VendorDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sameAsName, setSameAsName] = useState(false);
  const [error, setError] = useState('');

  // 每次開啟對話框時，依 initial 重新帶入表單（新增為空白、編輯為既有值）
  useEffect(() => {
    if (open) {
      setForm(initial ?? EMPTY_FORM);
      setSameAsName(!!initial && !!initial.name && initial.bankAccountName === initial.name);
      setError('');
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.taxId.trim() && !form.name.trim()) {
      setError('統編或名稱請至少擇一填寫');
      return;
    }
    onSubmit({ ...form, bankAccountName: sameAsName ? form.name : form.bankAccountName });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={initial ? '編輯廠商' : '新增廠商'} widthClassName="max-w-[480px]">
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">統編</label>
            <TextInput
              placeholder="8 碼統一編號"
              value={form.taxId}
              onChange={e => {
                setForm(f => ({ ...f, taxId: e.target.value }));
                setError('');
              }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">名稱</label>
            <TextInput
              placeholder="廠商名稱"
              value={form.name}
              onChange={e => {
                setForm(f => ({ ...f, name: e.target.value }));
                setError('');
              }}
            />
          </div>
        </div>
        {error && <p className="-mt-2 text-xs text-semantic-error">{error}</p>}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">登記地址</label>
          <TextInput placeholder="登記地址" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>

        <div className="rounded-md border border-neutral-blue-gray/30 p-4">
          <span className="mb-3 block text-sm font-semibold text-neutral-dark">銀行資訊</span>
          <div className="flex flex-col gap-3">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm text-neutral-dark">戶名</label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-mid">
                  <Checkbox
                    checked={sameAsName}
                    onChange={() => {
                      const next = !sameAsName;
                      setSameAsName(next);
                      if (next) setForm(f => ({ ...f, bankAccountName: f.name }));
                    }}
                  />
                  同名稱
                </label>
              </div>
              <TextInput
                placeholder="銀行戶名"
                value={sameAsName ? form.name : form.bankAccountName}
                disabled={sameAsName}
                onChange={e => setForm(f => ({ ...f, bankAccountName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextInput placeholder="銀行名稱" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} />
              <TextInput placeholder="分行" value={form.bankBranch} onChange={e => setForm(f => ({ ...f, bankBranch: e.target.value }))} />
            </div>
            <TextInput
              placeholder="帳號"
              value={form.bankAccountNumber}
              onChange={e => setForm(f => ({ ...f, bankAccountNumber: e.target.value }))}
            />
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
