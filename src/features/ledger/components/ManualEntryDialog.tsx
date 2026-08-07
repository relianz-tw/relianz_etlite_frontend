'use client';

import { listBankAccounts } from '@/api/bankAccounts';
import type { BankAccountDto, ManualSettleAllocation } from '@/api/types';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import Label from '@/components/ui/Label';
import MoneyInput from '@/components/ui/MoneyInput';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { useEffect, useState } from 'react';
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
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        setAccounts(list);
        const defaultAccount = list.find(account => (isSales ? account.isDefaultReceivingAccount : account.isDefaultPaymentAccount)) ?? list[0];
        if (defaultAccount) setBankAccountUuid(defaultAccount.uuid);
      })
      .catch(err => {
        if (cancelled) return;
        setAccountsError(err instanceof Error ? err.message : '操作失敗');
      })
      .finally(() => {
        if (!cancelled) setAccountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSales]);

  // 進項不顯示手續費／實際存入金額欄位：手續費固定 0、存入金額即交易金額
  const depositAmount = isSales ? amount - fee : amount;

  const handleSubmit = async () => {
    if (!row.uuid) {
      setError(`查無${isSales ? '應收' : '應付'}帳款 uuid，請重新整理列表後再試`);
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
        feeAmount: isSales ? fee : 0,
        paymentDate,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗');
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
        {isSales && (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-neutral-dark">各項手續費</span>
              <MoneyInput widthClassName="w-36" value={fee} onChange={setFee} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-neutral-dark">存入金額</span>
              <MoneyInput widthClassName="w-36" value={depositAmount} disabled readOnly />
            </div>
          </>
        )}

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
