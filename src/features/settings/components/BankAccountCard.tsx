'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import MoneyInput from '@/components/ui/MoneyInput';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { formatYyyymmdd } from '@/lib/utils';
import { Check, Pencil, PowerOff, X } from 'lucide-react';
import { BANK_CODE_OPTIONS } from '../data';
import type { BankAccountRecord } from '../data';

interface BankAccountCardProps {
  /** 編輯中時傳入草稿值，非編輯中時傳入原始帳戶資料 */
  account: BankAccountRecord;
  editing: boolean;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChange: (patch: Partial<BankAccountRecord>) => void;
  onSave: () => void;
  onDeactivate: () => void;
}

export default function BankAccountCard({
  account,
  editing,
  saving,
  onStartEdit,
  onCancelEdit,
  onChange,
  onSave,
  onDeactivate,
}: BankAccountCardProps) {
  return (
    <div className="rounded-md border border-neutral-blue-gray/30 p-4">
      <div className="flex flex-col gap-4 nav:flex-row nav:items-start nav:justify-between">
        <div className="flex-1 space-y-4">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <label className="block text-sm font-semibold text-neutral-dark">帳戶暱名</label>
              {!account.isActive && (
                <Badge tone="neutral" variant="muted">
                  已停用
                </Badge>
              )}
            </div>
            <TextInput
              value={account.nickname}
              disabled={!editing}
              readOnly={!editing}
              onChange={e => onChange({ nickname: e.target.value })}
            />
            {editing && <p className="mt-1 text-xs text-neutral-mid">注意：請輸入公司行號名下戶頭</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">分行</label>
              <TextInput
                value={account.bankBranch}
                disabled={!editing}
                readOnly={!editing}
                onChange={e => onChange({ bankBranch: e.target.value })}
              />
            </div>
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
            <p className="mt-1 text-xs text-neutral-mid">
              更新日期：{account.lastBalanceUpdateDate ? formatYyyymmdd(account.lastBalanceUpdateDate) : '尚無紀錄'}
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">備註</label>
            <TextInput
              value={account.remark}
              disabled={!editing}
              readOnly={!editing}
              placeholder="備註（選填）"
              onChange={e => onChange({ remark: e.target.value })}
            />
          </div>
          {editing && (
            <label className="flex items-center gap-1.5 text-sm text-neutral-dark">
              <Checkbox checked={account.isActive} onChange={() => onChange({ isActive: !account.isActive })} />
              啟用中
            </label>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 nav:flex-col">
          {editing ? (
            <>
              <Button size="sm" variant="outline" icon={X} onClick={onCancelEdit} disabled={saving}>
                取消
              </Button>
              <Button size="sm" variant="primary" icon={Check} onClick={onSave} disabled={saving}>
                {saving ? '儲存中…' : '儲存'}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" icon={Pencil} onClick={onStartEdit}>
                編輯
              </Button>
              {account.isActive && (
                <Button size="sm" variant="danger" icon={PowerOff} onClick={onDeactivate}>
                  停用
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
