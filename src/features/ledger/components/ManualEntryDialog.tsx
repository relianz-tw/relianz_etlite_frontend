'use client';

import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { useState } from 'react';
import { BANK_ACCOUNTS } from '../data';
import type { SalesRow } from '../types';

interface ManualEntryDialogProps {
  open: boolean;
  onClose: () => void;
  row: SalesRow | null;
  onSubmit: (rowId: string, amount: number, fee: number) => void;
}

/** 帳簿列的民國年日期字串（如 "115/03/26"）→ JS Date */
function parseRowDate(date: string): Date {
  const [year, month, day] = date.split('/').map(Number);
  return new Date((year || 0) + 1911, (month || 1) - 1, day || 1);
}

export default function ManualEntryDialog({ open, onClose, row, onSubmit }: ManualEntryDialogProps) {
  if (!open || !row) return null;
  return <ManualEntryDialogContent row={row} onClose={onClose} onSubmit={onSubmit} />;
}

/** row 切換時透過外層 key 重新掛載，確保表單狀態每次以該筆交易的資料重新初始化 */
function ManualEntryDialogContent({
  row,
  onClose,
  onSubmit,
}: {
  row: SalesRow;
  onClose: () => void;
  onSubmit: (rowId: string, amount: number, fee: number) => void;
}) {
  const scheduledDate = parseRowDate(row.date);
  const [entryDate, setEntryDate] = useState<Date | undefined>(scheduledDate);
  const [bankAccount, setBankAccount] = useState(BANK_ACCOUNTS[0]);
  const [amount, setAmount] = useState(row.amount);
  const [fee, setFee] = useState(0);

  const depositAmount = amount - fee;

  const handleSubmit = () => {
    onSubmit(row.id, amount, fee);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="交易手動入帳" widthClassName="max-w-[420px]">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">預定入帳日期</label>
          <DatePicker value={scheduledDate} onChange={() => {}} disabled />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">手動入帳日期</label>
          <DatePicker value={entryDate} onChange={setEntryDate} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">收款戶頭</label>
          <Select widthClassName="w-full" value={bankAccount} onValueChange={setBankAccount}>
            {BANK_ACCOUNTS.map(account => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-dark">交易金額</span>
          <MoneyInput widthClassName="w-36" value={amount} onChange={setAmount} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-dark">各項手續費</span>
          <MoneyInput widthClassName="w-36" value={fee} onChange={setFee} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-dark">存入金額</span>
          <MoneyInput widthClassName="w-36" value={depositAmount} disabled readOnly />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="danger" onClick={onClose}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          強制手動入帳
        </Button>
      </div>
    </Modal>
  );
}
