'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import TextInput from '@/components/ui/TextInput';
import { vendorExists } from '@/api/vendors';
import { useEffect, useState } from 'react';
import type { VendorRecord } from '../data';

interface VendorDialogProps {
  open: boolean;
  onClose: () => void;
  /** 呼叫端負責實際送出 API；失敗時 throw Error，對話框會攔截並顯示錯誤訊息、不關閉 */
  onSubmit: (vendor: Omit<VendorRecord, 'id'>) => Promise<void>;
  /** 帶入此值代表編輯既有廠商；不帶則為新增 */
  initial?: VendorRecord;
}

const EMPTY_FORM: Omit<VendorRecord, 'id'> = {
  taxId: '',
  name: '',
  address: '',
  bankAccountName: '',
  bankCode: '',
  bankName: '',
  bankBranch: '',
  bankAccountNumber: '',
  remark: '',
  isActive: true,
};

export default function VendorDialog({ open, onClose, onSubmit, initial }: VendorDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 每次開啟對話框時，依 initial 重新帶入表單（新增為空白、編輯為既有值）
  useEffect(() => {
    if (open) {
      setForm(initial ?? EMPTY_FORM);
      setError('');
      setSubmitting(false);
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.taxId.trim() && !form.name.trim()) {
      setError('統編或名稱請至少擇一填寫');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // 新增廠商前先檢查統編／名稱是否已存在，避免建立重複廠商
      if (!initial) {
        const { exists } = await vendorExists({
          taxId: form.taxId.trim() || undefined,
          name: form.taxId.trim() ? undefined : form.name.trim() || undefined,
        });
        if (exists) {
          setError('此廠商已存在於名單中');
          setSubmitting(false);
          return;
        }
      }
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗');
      setSubmitting(false);
    }
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
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">地址</label>
          <TextInput placeholder="地址" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>

        <div>
          <span className="mb-3 block text-sm font-semibold text-neutral-dark">銀行資訊</span>
          <div className="flex flex-col gap-3">
            <TextInput
              placeholder="銀行戶名"
              value={form.bankAccountName}
              onChange={e => setForm(f => ({ ...f, bankAccountName: e.target.value }))}
            />
            <div className="grid grid-cols-1 gap-3 nav:grid-cols-3">
              <TextInput
                placeholder="銀行代碼"
                value={form.bankCode}
                onChange={e => setForm(f => ({ ...f, bankCode: e.target.value }))}
              />
              <TextInput
                placeholder="銀行名稱"
                value={form.bankName}
                onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
              />
              <TextInput placeholder="分行" value={form.bankBranch} onChange={e => setForm(f => ({ ...f, bankBranch: e.target.value }))} />
            </div>
            <TextInput
              placeholder="帳號"
              value={form.bankAccountNumber}
              onChange={e => setForm(f => ({ ...f, bankAccountNumber: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">備註</label>
          <Textarea placeholder="備註（選填）" value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} />
        </div>
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
