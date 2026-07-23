'use client';

import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { Pencil, Trash2 } from 'lucide-react';
import { BANK_CODE_OPTIONS } from '../data';
import type { BankAccountRecord } from '../data';

interface BankAccountCardProps {
  account: BankAccountRecord;
  editing: boolean;
  onToggleEdit: () => void;
  onChange: (patch: Partial<BankAccountRecord>) => void;
  onRemove: () => void;
}

export default function BankAccountCard({ account, editing, onToggleEdit, onChange, onRemove }: BankAccountCardProps) {
  return (
    <div className="rounded-md border border-neutral-blue-gray/30 p-4">
      <div className="flex flex-col gap-4 nav:flex-row nav:items-start nav:justify-between">
        <div className="flex-1 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">帳戶暱名</label>
            <TextInput
              value={account.nickname}
              disabled={!editing}
              readOnly={!editing}
              onChange={e => onChange({ nickname: e.target.value })}
            />
            {editing && <p className="mt-1 text-xs text-neutral-mid">注意：請輸入公司行號名下戶頭</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">銀行代碼</label>
            <Select
              widthClassName="w-full"
              value={account.bankCode}
              disabled={!editing}
              onValueChange={v => {
                const bank = BANK_CODE_OPTIONS.find(b => b.code === v);
                onChange({ bankCode: v, bankName: bank?.name ?? account.bankName });
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
              value={account.accountNumber}
              disabled={!editing}
              readOnly={!editing}
              onChange={e => onChange({ accountNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">存款餘額</label>
            <MoneyInput value={account.balance} disabled readOnly />
            <p className="mt-1 text-xs text-neutral-mid">更新日期：{account.updatedDate}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 nav:flex-col">
          <Button size="sm" variant={editing ? 'primary' : 'ghost'} icon={Pencil} onClick={onToggleEdit}>
            編輯
          </Button>
          <Button size="sm" variant="danger" icon={Trash2} onClick={onRemove}>
            移除
          </Button>
        </div>
      </div>
    </div>
  );
}
