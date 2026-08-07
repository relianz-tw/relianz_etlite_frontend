'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import Textarea from '@/components/ui/Textarea';
import TextInput from '@/components/ui/TextInput';
import { formatYyyymmddRoc } from '@/lib/utils';
import { Check, HandCoins, Pencil, Power, PowerOff, Wallet, X } from 'lucide-react';
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
  onActivate: () => void;
  onSetDefaultPayment: () => void;
  onSetDefaultReceiving: () => void;
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
  onActivate,
  onSetDefaultPayment,
  onSetDefaultReceiving,
}: BankAccountCardProps) {
  return (
    <div className="rounded-md border border-neutral-blue-gray/30 p-4">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 nav:grid-cols-2">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <label className="block text-sm font-semibold text-neutral-dark">帳戶暱名</label>
              {!account.isActive && (
                <Badge tone="neutral" variant="muted">
                  已停用
                </Badge>
              )}
              {account.isDefaultPaymentAccount && (
                <Badge tone="info" variant="muted">
                  預設付款戶頭
                </Badge>
              )}
              {account.isDefaultReceivingAccount && (
                <Badge tone="success" variant="muted">
                  預設收款戶頭
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
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">存款餘額</label>
            <MoneyInput
              value={account.balance}
              disabled={!editing}
              readOnly={!editing}
              onChange={v => onChange({ balance: v })}
            />
            <p className="mt-1 text-xs text-neutral-mid">
              更新日期：{account.lastBalanceUpdateDate ? formatYyyymmddRoc(account.lastBalanceUpdateDate) : '尚無紀錄'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 nav:grid-cols-[1fr_120px_1fr_1fr]">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">銀行名稱</label>
            <TextInput
              value={account.bankName}
              disabled={!editing}
              readOnly={!editing}
              onChange={e => onChange({ bankName: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">銀行代碼</label>
            <TextInput
              value={account.bankCode}
              disabled={!editing}
              readOnly={!editing}
              inputMode="numeric"
              maxLength={3}
              onChange={e => onChange({ bankCode: e.target.value.replace(/\D/g, '').slice(0, 3) })}
            />
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
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">備註</label>
          <Textarea
            value={account.remark}
            disabled={!editing}
            readOnly={!editing}
            placeholder="備註（選填）"
            onChange={e => onChange({ remark: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-neutral-blue-gray/20 pt-4">
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
            {account.isActive && !account.isDefaultPaymentAccount && (
              <Button size="sm" variant="outline" icon={Wallet} onClick={onSetDefaultPayment} disabled={saving}>
                設為預設付款
              </Button>
            )}
            {account.isActive && !account.isDefaultReceivingAccount && (
              <Button size="sm" variant="outline" icon={HandCoins} onClick={onSetDefaultReceiving} disabled={saving}>
                設為預設收款
              </Button>
            )}
            <Button size="sm" variant="ghost" icon={Pencil} onClick={onStartEdit}>
              編輯
            </Button>
            {account.isActive ? (
              <Button size="sm" variant="danger" icon={PowerOff} onClick={onDeactivate} disabled={saving}>
                停用
              </Button>
            ) : (
              <Button size="sm" variant="outline" icon={Power} onClick={onActivate} disabled={saving}>
                啟用
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
