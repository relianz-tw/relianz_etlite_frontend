'use client';

import { listBankAccounts, updateBankAccount } from '@/api/bankAccounts';
import type { BankAccountDto, UpdateBankAccountBody } from '@/api/types';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { todayYyyymmdd } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import type { BankAccountRecord } from './data';

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
    // 餘額沒動時回填原值，避免覆寫既有更新日期（這個欄位後端必填）
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

/**
 * 銀行帳戶清單與編輯行為，供設定頁「收款設定」與開帳精靈銀行帳戶頁共用
 * （兩邊都搭配 BankAccountCard 使用，行為必須一致，故集中於此）。
 * 純 UI 狀態（是否展開新增表單、停用確認視窗）留在各自的元件。
 */
export function useBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BankAccountRecord | null>(null);

  const loadAccounts = useCallback(() => {
    setLoading(true);
    setLoadError('');
    listBankAccounts()
      .then(list => setAccounts(list.map(toBankAccountRecord)))
      .catch(err => setLoadError(getFriendlyErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

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

  return {
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
  };
}
