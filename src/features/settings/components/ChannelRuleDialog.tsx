'use client';

import Button from '@/components/ui/Button';
import Label from '@/components/ui/Label';
import Modal from '@/components/ui/Modal';
import MoneyInput from '@/components/ui/MoneyInput';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import TextInput from '@/components/ui/TextInput';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useState } from 'react';
import { SETTLEMENT_MONTH_DAYS, SETTLEMENT_STYLE, SETTLEMENT_WEEKDAYS } from '../data';
import type { BankAccountRecord, ChannelRuleRecord } from '../data';

interface ChannelRuleDialogProps {
  open: boolean;
  onClose: () => void;
  /** 呼叫端負責實際送出 API；失敗時 throw Error，對話框會攔截並顯示錯誤訊息、不關閉 */
  onSubmit: (rule: Omit<ChannelRuleRecord, 'id'>) => Promise<void>;
  /** 帶入此值代表編輯既有管道；不帶則為新增 */
  initial?: ChannelRuleRecord;
  /** 收款帳戶下拉選項，僅列公司啟用中的實際銀行帳戶 */
  accounts: BankAccountRecord[];
}

function emptyForm(accounts: BankAccountRecord[]): Omit<ChannelRuleRecord, 'id'> {
  return {
    channelName: '',
    settlementStyle: SETTLEMENT_STYLE.WEEKLY,
    settlementAmount: 1,
    receivingAccountUuid: accounts[0]?.id ?? '',
    remark: '',
    isActive: true,
    balance: 0,
  };
}

export default function ChannelRuleDialog({ open, onClose, onSubmit, initial, accounts }: ChannelRuleDialogProps) {
  const [form, setForm] = useState(emptyForm(accounts));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 每次開啟對話框時，依 initial 重新帶入表單（新增為空白、編輯為既有值）
  useEffect(() => {
    if (open) {
      setForm(initial ?? emptyForm(accounts));
      setError('');
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.channelName.trim()) {
      setError('請輸入管道名稱');
      return;
    }
    if (!form.receivingAccountUuid) {
      setError('請選擇收款帳戶');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={initial ? '編輯銷售管道' : '新增銷售管道'} widthClassName="max-w-[480px]">
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        <div>
          <Label required>管道名稱</Label>
          <TextInput
            placeholder="例如：蝦皮、中國信託刷卡機"
            value={form.channelName}
            onChange={e => {
              setForm(f => ({ ...f, channelName: e.target.value }));
              setError('');
            }}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Select
            widthClassName="w-full"
            value={String(form.settlementStyle)}
            onValueChange={v => {
              const style = Number(v);
              // 切換入帳規則類型時，settlementAmount 需帶入該類型合理的預設值
              setForm(f => ({ ...f, settlementStyle: style, settlementAmount: 1 }));
            }}
          >
            <option value={String(SETTLEMENT_STYLE.WEEKLY)}>每週固定星期</option>
            <option value={String(SETTLEMENT_STYLE.MONTHLY)}>每月固定日期</option>
          </Select>

          {form.settlementStyle === SETTLEMENT_STYLE.WEEKLY && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-mid">每週星期</span>
              <Select
                widthClassName="w-28"
                value={String(form.settlementAmount)}
                onValueChange={v => setForm(f => ({ ...f, settlementAmount: Number(v) }))}
              >
                {SETTLEMENT_WEEKDAYS.map((label, i) => (
                  <option key={label} value={String(i + 1)}>
                    {label}
                  </option>
                ))}
              </Select>
              <span className="text-sm text-neutral-mid">自動入帳</span>
            </div>
          )}
          {form.settlementStyle === SETTLEMENT_STYLE.MONTHLY && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-mid">每月</span>
              <Select
                widthClassName="w-24"
                value={String(form.settlementAmount)}
                onValueChange={v => setForm(f => ({ ...f, settlementAmount: Number(v) }))}
              >
                {SETTLEMENT_MONTH_DAYS.map(day => (
                  <option key={day} value={String(day)}>
                    {day} 號
                  </option>
                ))}
              </Select>
              <span className="text-sm text-neutral-mid">自動入帳</span>
            </div>
          )}
        </div>

        <div>
          <Label required>收款帳戶</Label>
          {accounts.length === 0 ? (
            <p className="text-xs text-semantic-error">尚無啟用中的銀行帳戶，請先於上方新增銀行帳戶</p>
          ) : (
            <Select
              widthClassName="w-full"
              value={form.receivingAccountUuid}
              onValueChange={v => {
                setForm(f => ({ ...f, receivingAccountUuid: v }));
                setError('');
              }}
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.nickname}（{account.bankName} {account.accountNumber}）
                </option>
              ))}
            </Select>
          )}
        </div>

        {error && <p className="-mt-2 text-xs text-semantic-error">{error}</p>}

        {/* 新增管道時後端無法指定期初餘額（僅結算時自動異動），故僅編輯既有管道時開放調整 */}
        {initial && (
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-semibold text-neutral-dark">當前餘額</label>
            <MoneyInput widthClassName="w-40" value={form.balance} onChange={value => setForm(f => ({ ...f, balance: value }))} />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">備註</label>
          <Textarea
            placeholder="備註（選填）"
            value={form.remark}
            onChange={e => setForm(f => ({ ...f, remark: e.target.value }))}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '儲存中…' : '儲存'}
        </Button>
      </div>
    </Modal>
  );
}
