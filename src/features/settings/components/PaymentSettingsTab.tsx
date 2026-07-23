'use client';

import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import AddChannelDialog from '@/features/ledger/components/AddChannelDialog';
import { SALES_CHANNELS } from '@/features/ledger/data';
import { CirclePlus, Plus } from 'lucide-react';
import { useState } from 'react';
import BankAccountCard from './BankAccountCard';
import { BANK_CODE_OPTIONS, SEED_BANK_ACCOUNTS } from '../data';
import type { BankAccountRecord } from '../data';

const EMPTY_NEW_ACCOUNT: Omit<BankAccountRecord, 'id' | 'updatedDate'> = {
  nickname: '',
  bankCode: BANK_CODE_OPTIONS[0].code,
  bankName: BANK_CODE_OPTIONS[0].name,
  accountNumber: '',
  balance: 0,
};

export default function PaymentSettingsTab() {
  const [accounts, setAccounts] = useState<BankAccountRecord[]>(SEED_BANK_ACCOUNTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newAccount, setNewAccount] = useState(EMPTY_NEW_ACCOUNT);
  const [channels, setChannels] = useState<string[]>(SALES_CHANNELS);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);

  const updateAccount = (id: string, patch: Partial<BankAccountRecord>) => {
    setAccounts(list => list.map(a => (a.id === id ? { ...a, ...patch } : a)));
  };
  const removeAccount = (id: string) => {
    setAccounts(list => list.filter(a => a.id !== id));
    setEditingId(current => (current === id ? null : current));
  };
  const saveNewAccount = () => {
    if (!newAccount.nickname.trim() || !newAccount.accountNumber.trim()) return;
    setAccounts(list => [...list, { ...newAccount, id: `acc-${list.length + 1}`, updatedDate: '首次設定' }]);
    setNewAccount(EMPTY_NEW_ACCOUNT);
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-dark">銀行帳戶管理</h2>
        </div>
        <div className="flex flex-col gap-4">
          {accounts.map(account => (
            <BankAccountCard
              key={account.id}
              account={account}
              editing={editingId === account.id}
              onToggleEdit={() => setEditingId(id => (id === account.id ? null : account.id))}
              onChange={patch => updateAccount(account.id, patch)}
              onRemove={() => removeAccount(account.id)}
            />
          ))}

          {adding && (
            <div className="rounded-md border border-dashed border-neutral-blue-gray/50 p-4">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">帳戶暱名</label>
                  <TextInput
                    placeholder="例：付款用國泰世華內科分行"
                    value={newAccount.nickname}
                    onChange={e => setNewAccount(a => ({ ...a, nickname: e.target.value }))}
                  />
                  <p className="mt-1 text-xs text-neutral-mid">注意：請輸入公司行號名下戶頭</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">銀行代碼</label>
                  <Select
                    widthClassName="w-full"
                    value={newAccount.bankCode}
                    onValueChange={v => {
                      const bank = BANK_CODE_OPTIONS.find(b => b.code === v);
                      setNewAccount(a => ({ ...a, bankCode: v, bankName: bank?.name ?? a.bankName }));
                    }}
                  >
                    {BANK_CODE_OPTIONS.map(bank => (
                      <option key={bank.code} value={bank.code}>
                        {bank.code} - {bank.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">銀行帳號</label>
                  <TextInput
                    placeholder="請輸入完整帳號，不要輸入符號"
                    value={newAccount.accountNumber}
                    onChange={e => setNewAccount(a => ({ ...a, accountNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">存款餘額</label>
                  <MoneyInput value={newAccount.balance} onChange={v => setNewAccount(a => ({ ...a, balance: v }))} />
                  <p className="mt-1 text-xs text-neutral-mid">僅限於首次設定時使用，系統將不再詢問</p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <Button
                  variant="danger"
                  onClick={() => {
                    setAdding(false);
                    setNewAccount(EMPTY_NEW_ACCOUNT);
                  }}
                >
                  取消
                </Button>
                <Button variant="primary" onClick={saveNewAccount}>
                  儲存
                </Button>
              </div>
            </div>
          )}

          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center justify-center gap-2 rounded-md border border-dashed border-neutral-blue-gray/50 py-3 text-sm font-semibold text-brand-blue hover:bg-surface-cream"
            >
              <CirclePlus size={16} />
              再加一個銀行帳戶
            </button>
          )}
        </div>
      </div>

      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-dark">銷售管道暨收款方式</h2>
          <Button size="sm" icon={Plus} onClick={() => setChannelDialogOpen(true)}>
            新增銷售管道
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {channels.map(channel => (
            <span key={channel} className="rounded-sm bg-surface-cream px-3 py-1.5 text-sm text-neutral-dark">
              {channel}
            </span>
          ))}
        </div>
      </div>

      <AddChannelDialog
        open={channelDialogOpen}
        onClose={() => setChannelDialogOpen(false)}
        onSubmit={name => setChannels(list => [...list, name])}
      />
    </div>
  );
}
