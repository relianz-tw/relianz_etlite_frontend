'use client';

import { createBankAccount, listBankAccounts, updateBankAccount } from '@/api/bankAccounts';
import type { BankAccountDto } from '@/api/types';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import AddChannelDialog from '@/features/ledger/components/AddChannelDialog';
import { SALES_CHANNELS } from '@/features/ledger/data';
import { CirclePlus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import BankAccountCard from './BankAccountCard';
import VendorSection from './VendorSection';
import { BANK_CODE_OPTIONS } from '../data';
import type { BankAccountRecord } from '../data';

const EMPTY_NEW_ACCOUNT: Omit<BankAccountRecord, 'id' | 'lastBalanceUpdateDate' | 'isActive' | 'isDefaultReceivingAccount' | 'isDefaultPaymentAccount'> = {
  nickname: '',
  bankCode: BANK_CODE_OPTIONS[0].code,
  bankName: BANK_CODE_OPTIONS[0].name,
  bankBranch: '',
  accountNumber: '',
  balance: 0,
  remark: '',
};

/** 後端 BankAccountDto 轉為畫面用的 BankAccountRecord */
function toBankAccountRecord(dto: BankAccountDto): BankAccountRecord {
  return {
    id: dto.uuid,
    nickname: dto.accountName ?? '',
    bankCode: dto.bankCode ?? '',
    bankName: dto.bankName ?? '',
    bankBranch: dto.branchName ?? '',
    accountNumber: dto.accountNo ?? '',
    balance: dto.currentBalance,
    lastBalanceUpdateDate: dto.lastBalanceUpdateDate ?? '',
    remark: dto.remark ?? '',
    isActive: dto.isActive,
    isDefaultReceivingAccount: dto.isDefaultReceivingAccount,
    isDefaultPaymentAccount: dto.isDefaultPaymentAccount,
  };
}

export default function PaymentSettingsTab() {
  const [accounts, setAccounts] = useState<BankAccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BankAccountRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [adding, setAdding] = useState(false);
  const [newAccount, setNewAccount] = useState(EMPTY_NEW_ACCOUNT);
  const [channels, setChannels] = useState<string[]>(SALES_CHANNELS);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);

  const loadAccounts = () => {
    setLoading(true);
    setLoadError('');
    listBankAccounts()
      .then(list => setAccounts(list.map(toBankAccountRecord)))
      .catch(err => setLoadError(err instanceof Error ? err.message : '操作失敗'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const startEdit = (account: BankAccountRecord) => {
    setEditingId(account.id);
    setDraft({ ...account });
    setActionError('');
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };
  const updateDraft = (patch: Partial<BankAccountRecord>) => setDraft(d => (d ? { ...d, ...patch } : d));

  const saveEdit = async () => {
    if (!draft) return;
    setSaving(true);
    setActionError('');
    try {
      await updateBankAccount({
        uuid: draft.id,
        accountName: draft.nickname,
        bankCode: draft.bankCode,
        accountNo: draft.accountNumber,
        bankName: draft.bankName,
        branchName: draft.bankBranch,
        currentBalance: draft.balance,
        // 本次未提供餘額異動功能，回填原值避免覆寫既有更新日期
        lastBalanceUpdateDate: draft.lastBalanceUpdateDate,
        isDefaultReceivingAccount: draft.isDefaultReceivingAccount,
        isDefaultPaymentAccount: draft.isDefaultPaymentAccount,
        isActive: draft.isActive,
        remark: draft.remark,
      });
      setEditingId(null);
      setDraft(null);
      loadAccounts();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作失敗');
    } finally {
      setSaving(false);
    }
  };

  const deactivateAccount = async (account: BankAccountRecord) => {
    setSaving(true);
    setActionError('');
    try {
      await updateBankAccount({
        uuid: account.id,
        accountName: account.nickname,
        bankCode: account.bankCode,
        accountNo: account.accountNumber,
        bankName: account.bankName,
        branchName: account.bankBranch,
        currentBalance: account.balance,
        lastBalanceUpdateDate: account.lastBalanceUpdateDate,
        isDefaultReceivingAccount: account.isDefaultReceivingAccount,
        isDefaultPaymentAccount: account.isDefaultPaymentAccount,
        isActive: false,
        remark: account.remark,
      });
      loadAccounts();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作失敗');
    } finally {
      setSaving(false);
    }
  };

  const saveNewAccount = async () => {
    if (!newAccount.nickname.trim() || !newAccount.accountNumber.trim()) return;
    setSaving(true);
    setActionError('');
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
      setAdding(false);
      loadAccounts();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-dark">銀行帳戶管理</h2>
        </div>
        {actionError && <p className="mb-4 text-sm text-semantic-error">{actionError}</p>}
        {loading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : loadError ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{loadError}</div>
        ) : (
        <div className="flex flex-col gap-4">
          {accounts.map(account => (
            <BankAccountCard
              key={account.id}
              account={editingId === account.id && draft ? draft : account}
              editing={editingId === account.id}
              saving={saving}
              onStartEdit={() => startEdit(account)}
              onCancelEdit={cancelEdit}
              onChange={updateDraft}
              onSave={saveEdit}
              onDeactivate={() => deactivateAccount(account)}
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
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">分行</label>
                  <TextInput value={newAccount.bankBranch} onChange={e => setNewAccount(a => ({ ...a, bankBranch: e.target.value }))} />
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
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">備註</label>
                  <TextInput
                    placeholder="備註（選填）"
                    value={newAccount.remark}
                    onChange={e => setNewAccount(a => ({ ...a, remark: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <Button
                  variant="danger"
                  disabled={saving}
                  onClick={() => {
                    setAdding(false);
                    setNewAccount(EMPTY_NEW_ACCOUNT);
                  }}
                >
                  取消
                </Button>
                <Button variant="primary" onClick={saveNewAccount} disabled={saving}>
                  {saving ? '儲存中…' : '儲存'}
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
        )}
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

      <VendorSection />
    </div>
  );
}
