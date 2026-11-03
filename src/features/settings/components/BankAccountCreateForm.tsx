'use client';

import { createBankAccount } from '@/api/bankAccounts';
import Button from '@/components/ui/Button';
import Label from '@/components/ui/Label';
import MoneyInput from '@/components/ui/MoneyInput';
import Textarea from '@/components/ui/Textarea';
import TextInput from '@/components/ui/TextInput';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useState } from 'react';
import type { BankAccountRecord } from '../data';

const EMPTY_NEW_ACCOUNT: Omit<BankAccountRecord, 'id' | 'lastBalanceUpdateDate' | 'isActive' | 'isDefaultReceivingAccount' | 'isDefaultPaymentAccount'> = {
  nickname: '',
  bankCode: '',
  bankName: '',
  bankBranch: '',
  accountNumber: '',
  balance: 0,
  remark: '',
};

interface BankAccountCreateFormProps {
  /** 新增成功後呼叫，由呼叫端負責重新載入帳戶清單 */
  onCreated: () => void;
  /** 未提供時不顯示取消鈕（如開帳完成頁必須新增，不可取消） */
  onCancel?: () => void;
}

/** 新增銀行帳戶表單（設定頁「收款設定」與開帳完成頁共用） */
export default function BankAccountCreateForm({ onCreated, onCancel }: BankAccountCreateFormProps) {
  const [newAccount, setNewAccount] = useState(EMPTY_NEW_ACCOUNT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!newAccount.nickname.trim() || !newAccount.accountNumber.trim()) {
      setError('請填寫帳戶暱名與銀行帳號');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createBankAccount({
        accountName: newAccount.nickname,
        bankCode: newAccount.bankCode,
        accountNo: newAccount.accountNumber,
        bankName: newAccount.bankName,
        branchName: newAccount.bankBranch,
        currentBalance: newAccount.balance,
        isDefaultReceivingAccount: false,
        isDefaultPaymentAccount: false,
        isActive: true,
        remark: newAccount.remark,
      });
      setNewAccount(EMPTY_NEW_ACCOUNT);
      onCreated();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-md border border-dashed border-neutral-blue-gray/50 p-4">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 nav:grid-cols-2">
          <div>
            <Label required>帳戶暱名</Label>
            <TextInput
              placeholder="例：付款用國泰世華內科分行"
              value={newAccount.nickname}
              onChange={e => setNewAccount(a => ({ ...a, nickname: e.target.value }))}
            />
            <p className="mt-1 text-xs text-neutral-mid">注意：請輸入公司行號名下戶頭</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">存款餘額</label>
            <MoneyInput value={newAccount.balance} onChange={v => setNewAccount(a => ({ ...a, balance: v }))} />
            <p className="mt-1 text-xs text-neutral-mid">僅限於首次設定時使用，系統將不再詢問</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 nav:grid-cols-[1fr_120px_1fr_1fr]">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">銀行名稱</label>
            <TextInput value={newAccount.bankName} onChange={e => setNewAccount(a => ({ ...a, bankName: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">銀行代碼</label>
            <TextInput
              value={newAccount.bankCode}
              inputMode="numeric"
              maxLength={3}
              onChange={e => setNewAccount(a => ({ ...a, bankCode: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
            />
          </div>
          <div>
            <Label required>銀行帳號</Label>
            <TextInput
              placeholder="請輸入完整帳號，不要輸入符號"
              value={newAccount.accountNumber}
              onChange={e => setNewAccount(a => ({ ...a, accountNumber: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">分行</label>
            <TextInput value={newAccount.bankBranch} onChange={e => setNewAccount(a => ({ ...a, bankBranch: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">備註</label>
          <Textarea placeholder="備註（選填）" value={newAccount.remark} onChange={e => setNewAccount(a => ({ ...a, remark: e.target.value }))} />
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-semantic-error">{error}</p>}
      <div className="mt-5 flex justify-end gap-3">
        {onCancel && (
          <Button
            variant="danger"
            disabled={saving}
            onClick={() => {
              setNewAccount(EMPTY_NEW_ACCOUNT);
              setError('');
              onCancel();
            }}
          >
            取消
          </Button>
        )}
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? '儲存中…' : '儲存'}
        </Button>
      </div>
    </div>
  );
}
