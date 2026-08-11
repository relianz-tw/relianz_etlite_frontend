'use client';

import { createBankAccount, listBankAccounts, updateBankAccount } from '@/api/bankAccounts';
import type { BankAccountDto, UpdateBankAccountBody } from '@/api/types';
import Button from '@/components/ui/Button';
import Label from '@/components/ui/Label';
import MoneyInput from '@/components/ui/MoneyInput';
import Textarea from '@/components/ui/Textarea';
import TextInput from '@/components/ui/TextInput';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { numberToChineseNumeral, todayYyyymmdd } from '@/lib/utils';
import { CirclePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import BankAccountCard from './BankAccountCard';
import ChannelRuleSection from './ChannelRuleSection';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import VendorSection from './VendorSection';
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

/** BankAccountRecord 轉為 updateBankAccount() 所需的 PATCH body（不含 companyUuid，由 API 層補上） */
function toUpdateBody(record: BankAccountRecord): Omit<UpdateBankAccountBody, 'companyUuid'> {
  return {
    uuid: record.id,
    accountName: record.nickname,
    bankCode: record.bankCode,
    accountNo: record.accountNumber,
    bankName: record.bankName,
    branchName: record.bankBranch,
    currentBalance: record.balance,
    // 本次未提供餘額異動功能，回填原值避免覆寫既有更新日期
    lastBalanceUpdateDate: record.lastBalanceUpdateDate,
    isDefaultReceivingAccount: record.isDefaultReceivingAccount,
    isDefaultPaymentAccount: record.isDefaultPaymentAccount,
    isActive: record.isActive,
    remark: record.remark,
  };
}

/** 後端 BankAccountDto 轉為畫面用的 BankAccountRecord */
function toBankAccountRecord(dto: BankAccountDto): BankAccountRecord {
  return {
    id: dto.bankAccountUuid,
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
  const [pendingDeactivate, setPendingDeactivate] = useState<BankAccountRecord | null>(null);

  const loadAccounts = () => {
    setLoading(true);
    setLoadError('');
    listBankAccounts()
      .then(list => setAccounts(list.map(toBankAccountRecord)))
      .catch(err => setLoadError(getFriendlyErrorMessage(err)))
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
      const original = accounts.find(a => a.id === draft.id);
      const body = toUpdateBody(draft);
      // 餘額有實際變動時才把更新日改為今天，未變動則沿用原值，避免覆蓋既有紀錄
      if (original && original.balance !== draft.balance) {
        body.lastBalanceUpdateDate = todayYyyymmdd();
      }
      await updateBankAccount(body);
      setEditingId(null);
      setDraft(null);
      loadAccounts();
    } catch (err) {
      setActionError(getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // 停用時若該帳戶正是目前的預設收/付款戶頭，一併清除預設標記，避免停用中的帳戶仍被標示為預設，
  // 造成畫面上「預設戶頭已停用」的矛盾狀態
  const deactivateAccount = async (account: BankAccountRecord) => {
    setSaving(true);
    setActionError('');
    try {
      await updateBankAccount(toUpdateBody({ ...account, isActive: false, isDefaultPaymentAccount: false, isDefaultReceivingAccount: false }));
      loadAccounts();
    } catch (err) {
      setActionError(getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const activateAccount = async (account: BankAccountRecord) => {
    setSaving(true);
    setActionError('');
    try {
      await updateBankAccount(toUpdateBody({ ...account, isActive: true }));
      loadAccounts();
    } catch (err) {
      setActionError(getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /** 設定預設付款／收款戶頭：同類型只能有一個，前端先解除舊預設再設定新的 */
  const setDefaultAccount = async (target: BankAccountRecord, kind: 'payment' | 'receiving') => {
    const field = kind === 'payment' ? 'isDefaultPaymentAccount' : 'isDefaultReceivingAccount';
    setSaving(true);
    setActionError('');
    try {
      const prevDefault = accounts.find(a => a[field] && a.id !== target.id);
      if (prevDefault) {
        await updateBankAccount(toUpdateBody({ ...prevDefault, [field]: false }));
      }
      await updateBankAccount(toUpdateBody({ ...target, [field]: true }));
      loadAccounts();
    } catch (err) {
      setActionError(getFriendlyErrorMessage(err));
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
      setActionError(getFriendlyErrorMessage(err));
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
          {accounts.map((account, i) => (
            <div key={account.id}>
              <h3 className="mb-2 text-sm font-semibold text-neutral-dark">帳戶{numberToChineseNumeral(i + 1)}</h3>
              <BankAccountCard
                account={editingId === account.id && draft ? draft : account}
                editing={editingId === account.id}
                saving={saving}
                onStartEdit={() => startEdit(account)}
                onCancelEdit={cancelEdit}
                onChange={updateDraft}
                onSave={saveEdit}
                onDeactivate={() => setPendingDeactivate(account)}
                onActivate={() => activateAccount(account)}
                onSetDefaultPayment={() => setDefaultAccount(account, 'payment')}
                onSetDefaultReceiving={() => setDefaultAccount(account, 'receiving')}
              />
            </div>
          ))}

          {adding && (
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
                  <Textarea
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

      <ChannelRuleSection accounts={accounts.filter(a => a.isActive)} />

      <VendorSection />

      <ConfirmDeleteDialog
        open={!!pendingDeactivate}
        onClose={() => setPendingDeactivate(null)}
        onConfirm={() => {
          if (pendingDeactivate) deactivateAccount(pendingDeactivate);
        }}
        title="停用銀行帳戶"
        message={
          pendingDeactivate?.isDefaultPaymentAccount || pendingDeactivate?.isDefaultReceivingAccount
            ? `「${pendingDeactivate?.nickname}」目前是預設${[
                pendingDeactivate?.isDefaultReceivingAccount ? '收款' : null,
                pendingDeactivate?.isDefaultPaymentAccount ? '付款' : null,
              ]
                .filter(Boolean)
                .join('／')}戶頭，停用後將自動取消預設標記，請記得於帳戶清單重新指定其他預設戶頭。確定要停用嗎？`
            : `確定要停用「${pendingDeactivate?.nickname}」嗎？停用後可於帳戶清單重新啟用。`
        }
        confirmLabel="確定停用"
      />
    </div>
  );
}
