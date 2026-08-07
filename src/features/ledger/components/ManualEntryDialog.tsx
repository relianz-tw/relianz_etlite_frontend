'use client';

import { listBankAccounts } from '@/api/bankAccounts';
import type { BankAccountDto, ManualSettleAllocation } from '@/api/types';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import Label from '@/components/ui/Label';
import MoneyInput from '@/components/ui/MoneyInput';
import Modal from '@/components/ui/Modal';
import OtherDeductionsEditor, { type OtherDeductionRow } from '@/components/ui/OtherDeductionsEditor';
import Select from '@/components/ui/Select';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useRef, useState } from 'react';
import { formatYmd } from '../transaction/data';
import type { PurchaseRow, SalesRow, Side } from '../types';

interface ManualEntryDialogProps {
  open: boolean;
  onClose: () => void;
  side: Side;
  row: SalesRow | PurchaseRow | null;
  /** 呼叫端負責實際送出 API；失敗時 throw Error，對話框會攔截並顯示錯誤訊息、不關閉 */
  onSubmit: (allocation: ManualSettleAllocation) => Promise<void>;
}

/** 帳簿列的民國年日期字串（如 "115/03/26"）→ JS Date */
function parseRowDate(date: string): Date {
  const [year, month, day] = date.split('/').map(Number);
  return new Date((year || 0) + 1911, (month || 1) - 1, day || 1);
}

export default function ManualEntryDialog({ open, onClose, side, row, onSubmit }: ManualEntryDialogProps) {
  if (!open || !row) return null;
  return <ManualEntryDialogContent side={side} row={row} onClose={onClose} onSubmit={onSubmit} />;
}

/** row 切換時透過外層 key 重新掛載，確保表單狀態每次以該筆交易的資料重新初始化 */
function ManualEntryDialogContent({
  side,
  row,
  onClose,
  onSubmit,
}: {
  side: Side;
  row: SalesRow | PurchaseRow;
  onClose: () => void;
  onSubmit: (allocation: ManualSettleAllocation) => Promise<void>;
}) {
  const isSales = side === 'sales';
  const scheduledDate = parseRowDate(row.date);
  const [entryDate, setEntryDate] = useState<Date | undefined>(scheduledDate);
  const [amount, setAmount] = useState(row.amount);
  const [fee, setFee] = useState(0);
  // 額外金額（otherDeductions）：id 以遞增計數器產生，避免使用 Date.now()/Math.random()
  const [otherDeductions, setOtherDeductions] = useState<OtherDeductionRow[]>([]);
  const otherDeductionIdRef = useRef(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddOtherDeduction = () => {
    otherDeductionIdRef.current += 1;
    setOtherDeductions(prev => [...prev, { id: `OD-${otherDeductionIdRef.current}`, subject: null, name: '', amount: 0 }]);
  };
  const handleRemoveOtherDeduction = (id: string) => setOtherDeductions(prev => prev.filter(r => r.id !== id));
  const handleChangeOtherDeduction = (id: string, patch: Partial<Omit<OtherDeductionRow, 'id'>>) =>
    setOtherDeductions(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));

  // 收/付款戶頭：抓取啟用中銀行帳戶清單，銷項預設收款帳戶（isDefaultReceivingAccount）、
  // 進項預設付款帳戶（isDefaultPaymentAccount）；進項不顯示選擇 UI，僅內部帶入 API 所需欄位
  const [accounts, setAccounts] = useState<BankAccountDto[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState('');
  const [bankAccountUuid, setBankAccountUuid] = useState('');

  useEffect(() => {
    let cancelled = false;
    listBankAccounts()
      .then(list => {
        if (cancelled) return;
        const activeList = list.filter(account => account.isActive);
        setAccounts(activeList);
        const defaultAccount = activeList.find(account => (isSales ? account.isDefaultReceivingAccount : account.isDefaultPaymentAccount)) ?? activeList[0];
        if (defaultAccount) setBankAccountUuid(defaultAccount.uuid);
      })
      .catch(err => {
        if (cancelled) return;
        setAccountsError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setAccountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSales]);

  const otherDeductionsTotal = otherDeductions.reduce((sum, r) => sum + r.amount, 0);
  const depositAmount = amount - fee - otherDeductionsTotal;

  const handleSubmit = async () => {
    if (!row.uuid) {
      setError(`查無${isSales ? '應收' : '應付'}帳款紀錄，請重新整理列表後再試`);
      return;
    }
    if (amount <= 0) {
      setError('請輸入有效的交易金額');
      return;
    }
    if (!bankAccountUuid) {
      setError(isSales ? '請選擇收款戶頭' : '找不到可用的付款戶頭，請確認銀行帳戶設定');
      return;
    }
    if (depositAmount < 0) {
      setError('手續費與額外金額總和不可超過交易金額');
      return;
    }
    if (otherDeductions.some(r => !r.subject?.id || !r.name.trim() || r.amount <= 0)) {
      setError('請完整填寫額外金額的科目、名稱與金額');
      return;
    }
    const paymentDate = formatYmd(entryDate);
    if (!paymentDate) {
      setError('請選擇手動入帳日期');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        ledgerUuid: row.uuid,
        amount,
        bankAccountUuid,
        actualAmount: depositAmount,
        feeAmount: fee,
        paymentDate,
        otherDeductions:
          otherDeductions.length > 0
            ? otherDeductions.map(r => ({ name: r.name, amount: r.amount, officialAccountingSubjectId: r.subject!.id! }))
            : undefined,
      });
      onClose();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="交易手動入帳" widthClassName="max-w-[420px]">
      <div className="flex flex-col gap-4">
        <div>
          <Label required>手動入帳日期</Label>
          <DatePicker value={entryDate} onChange={setEntryDate} />
        </div>
        {isSales && (
          <div>
            <Label required>收款戶頭</Label>
            {accountsLoading ? (
              <p className="text-xs text-neutral-mid">載入中…</p>
            ) : accountsError ? (
              <p className="text-xs text-semantic-error">{accountsError}</p>
            ) : accounts.length === 0 ? (
              <p className="text-xs text-semantic-error">尚無啟用中的銀行帳戶，請先於設定新增銀行帳戶</p>
            ) : (
              <Select widthClassName="w-full" value={bankAccountUuid} onValueChange={setBankAccountUuid}>
                {accounts.map(account => (
                  <option key={account.uuid} value={account.uuid}>
                    {account.accountName}（{account.bankName} {account.accountNo}）
                  </option>
                ))}
              </Select>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-dark">
            交易金額
            <span aria-hidden="true" className="ml-0.5 text-semantic-error">
              *
            </span>
          </span>
          <MoneyInput widthClassName="w-36" value={amount} onChange={setAmount} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-dark">各項手續費</span>
          <MoneyInput widthClassName="w-36" value={fee} onChange={setFee} />
        </div>

        <OtherDeductionsEditor
          rows={otherDeductions}
          onAdd={handleAddOtherDeduction}
          onRemove={handleRemoveOtherDeduction}
          onChange={handleChangeOtherDeduction}
        />

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-dark">{isSales ? '存入金額' : '實際付款金額'}</span>
          <MoneyInput widthClassName="w-36" value={depositAmount} disabled readOnly />
        </div>
        {depositAmount < 0 && <p className="text-xs text-semantic-error">手續費與額外金額總和不可超過交易金額</p>}

        {error && <p className="text-xs text-semantic-error">{error}</p>}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="danger" onClick={onClose} disabled={submitting}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '處理中…' : '強制手動入帳'}
        </Button>
      </div>
    </Modal>
  );
}
