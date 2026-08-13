'use client';

import Button from '@/components/ui/Button';
import Label from '@/components/ui/Label';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useState } from 'react';
import type { BankAccountRecord } from '../data';

interface InitOtherChannelDialogProps {
  open: boolean;
  onClose: () => void;
  /** 呼叫端負責實際送出 API；失敗時 throw Error，對話框會攔截並顯示錯誤訊息、不關閉 */
  onSubmit: (receivingAccountUuid: string) => Promise<void>;
  /** 收款帳戶下拉選項，僅列公司啟用中的實際銀行帳戶 */
  accounts: BankAccountRecord[];
}

/** 開通固定名稱為「其他」的銷售管道，僅需選擇收款帳戶，其餘欄位由呼叫端帶入合理預設值 */
export default function InitOtherChannelDialog({ open, onClose, onSubmit, accounts }: InitOtherChannelDialogProps) {
  const [accountUuid, setAccountUuid] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAccountUuid(accounts[0]?.id ?? '');
      setError('');
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!accountUuid) {
      setError('請選擇收款帳戶');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(accountUuid);
      onClose();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="啟用收款管道基本設定" widthClassName="max-w-[420px]">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-neutral-mid">
          系統會自動建立一個名為「其他」的預設管道，用於歸類未特別設定管道的銷售款項；完成後才能繼續新增其他銷售管道。僅需選擇收款帳戶即可啟用。
        </p>

        <div>
          <Label required>收款帳戶</Label>
          {accounts.length === 0 ? (
            <p className="text-xs text-semantic-error">尚無啟用中的銀行帳戶，請先於上方新增銀行帳戶</p>
          ) : (
            <Select
              widthClassName="w-full"
              value={accountUuid}
              onValueChange={v => {
                setAccountUuid(v);
                setError('');
              }}
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.nickname}（{account.bankName} {account.accountNumber}）
                </option>
              ))}
            </Select>
          )}
        </div>

        {error && <p className="text-xs text-semantic-error">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting || accounts.length === 0}>
          {submitting ? '啟用中…' : '啟用'}
        </Button>
      </div>
    </Modal>
  );
}
