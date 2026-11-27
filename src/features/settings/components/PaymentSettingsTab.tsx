'use client';

import { numberToChineseNumeral } from '@/lib/utils';
import { CirclePlus } from 'lucide-react';
import { useState } from 'react';
import BankAccountCard from './BankAccountCard';
import BankAccountCreateForm from './BankAccountCreateForm';
import ChannelRuleSection from './ChannelRuleSection';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import VendorSection from './VendorSection';
import type { BankAccountRecord } from '../data';
import { useBankAccounts } from '../useBankAccounts';

export default function PaymentSettingsTab() {
  const {
    accounts,
    loading,
    loadError,
    actionError,
    saving,
    editingId,
    draft,
    loadAccounts,
    startEdit,
    cancelEdit,
    updateDraft,
    saveEdit,
    deactivateAccount,
    activateAccount,
    setDefaultAccount,
  } = useBankAccounts();
  const [adding, setAdding] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState<BankAccountRecord | null>(null);

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
            <BankAccountCreateForm
              onCreated={() => {
                setAdding(false);
                loadAccounts();
              }}
              onCancel={() => setAdding(false)}
            />
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
