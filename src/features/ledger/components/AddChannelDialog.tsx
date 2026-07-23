'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import MoneyInput from '@/components/ui/MoneyInput';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { Minus, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { BANK_ACCOUNTS } from '../data';

interface AddChannelDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (channelName: string) => void;
}

type FeeType = 'percent' | 'fixed';
interface FeeRow {
  id: string;
  type: FeeType;
  value: number;
}

type PayCycleMode = 'afterInvoice' | 'recurring';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六'];
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

function feeLabel(row: FeeRow) {
  return row.type === 'percent' ? `${row.value}%` : `$${row.value.toLocaleString('en-US')}`;
}

function calcFeeAmount(amount: number, rows: FeeRow[]) {
  return rows.reduce((sum, row) => sum + (row.type === 'percent' ? (amount * row.value) / 100 : row.value), 0);
}

function RadioDot({ checked, onSelect, label }: { checked: boolean; onSelect: () => void; label: string }) {
  return (
    <button type="button" onClick={onSelect} className="flex items-center gap-2 text-sm text-neutral-dark">
      <span
        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${checked ? 'border-brand-blue' : 'border-neutral-blue-gray'}`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-brand-blue" />}
      </span>
      {label}
    </button>
  );
}

export default function AddChannelDialog({ open, onClose, onSubmit }: AddChannelDialogProps) {
  const formId = useId();
  const [channelName, setChannelName] = useState('');
  const [feeRows, setFeeRows] = useState<FeeRow[]>([
    { id: `${formId}-1`, type: 'percent', value: 2.75 },
    { id: `${formId}-2`, type: 'fixed', value: 3 },
  ]);
  const [payCycleMode, setPayCycleMode] = useState<PayCycleMode>('afterInvoice');
  const [daysAfterInvoice, setDaysAfterInvoice] = useState(180);
  const [recurInterval, setRecurInterval] = useState('1');
  const [recurUnit, setRecurUnit] = useState<'週' | '月'>('週');
  const [recurDay, setRecurDay] = useState('三');
  const [bankAccount, setBankAccount] = useState(BANK_ACCOUNTS[0]);
  const [trialAmount, setTrialAmount] = useState(1000);

  if (!open) return null;

  const feeAmount = calcFeeAmount(trialAmount, feeRows);
  const depositAmount = trialAmount - feeAmount;

  const updateFeeRow = (id: string, patch: Partial<FeeRow>) => {
    setFeeRows(rows => rows.map(row => (row.id === id ? { ...row, ...patch } : row)));
  };
  const addFeeRow = () => {
    setFeeRows(rows => [...rows, { id: `${formId}-${rows.length + 1}-${rows.length}`, type: 'fixed', value: 0 }]);
  };
  const removeFeeRow = (id: string) => {
    setFeeRows(rows => (rows.length > 1 ? rows.filter(row => row.id !== id) : rows));
  };

  const payCycleReminder =
    payCycleMode === 'afterInvoice'
      ? `透過該管道的交易將於：發票開立後 ${daysAfterInvoice} 天 自動入帳`
      : `透過該管道的交易將於：每 ${recurInterval} ${recurUnit}${recurUnit === '週' ? `星期${recurDay}` : `${recurDay}號`} 自動入帳`;

  const handleSubmit = () => {
    if (!channelName.trim()) return;
    onSubmit(channelName.trim());
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="新增銷售管道暨收款方式" widthClassName="max-w-[520px]">
      <div className="flex max-h-[75vh] flex-col gap-6 overflow-y-auto pr-1">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">管道名稱</label>
          <TextInput value={channelName} onChange={e => setChannelName(e.target.value)} placeholder="例如：中國信託刷卡機" />
        </div>

        <div className="rounded-md border border-neutral-blue-gray/30 p-4">
          <span className="mb-2 block text-sm font-semibold text-neutral-dark">手續費</span>
          <div className="flex flex-col gap-2">
            {feeRows.map((row, i) => (
              <div key={row.id} className="flex items-center gap-2">
                <Select
                  widthClassName="flex-1"
                  value={row.type}
                  onValueChange={v => updateFeeRow(row.id, { type: v as FeeType })}
                >
                  <option value="percent">交易金額百分比 %</option>
                  <option value="fixed">固定金額</option>
                </Select>
                {row.type === 'fixed' ? (
                  <MoneyInput widthClassName="w-28" value={row.value} onChange={v => updateFeeRow(row.id, { value: v })} />
                ) : (
                  <div className="flex h-10 w-28 shrink-0 items-center gap-1 rounded-lg border-[1.5px] border-neutral-blue-gray/50 bg-white px-3 transition-colors focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/15">
                    <input
                      type="number"
                      value={row.value}
                      onChange={e => updateFeeRow(row.id, { value: Number(e.target.value) })}
                      className="no-spinner w-full min-w-0 bg-transparent text-right text-sm text-neutral-dark outline-none"
                    />
                    <span className="shrink-0 text-sm text-neutral-mid">%</span>
                  </div>
                )}
                {i === feeRows.length - 1 ? (
                  <button
                    type="button"
                    onClick={addFeeRow}
                    aria-label="新增手續費項目"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-blue text-white hover:bg-brand-blue-dark"
                  >
                    <Plus size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => removeFeeRow(row.id)}
                    aria-label="移除手續費項目"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-cream text-neutral-mid hover:bg-surface-cream/70"
                  >
                    <Minus size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-neutral-mid">
            提醒：銀行轉帳手續費不會開立發票，信用卡以及平台的手續費會另開立發票。
            <br />
            每筆交易會自動建立費用並扣除：<span className="font-semibold text-neutral-dark">{feeRows.map(feeLabel).join(' + ')}</span> 為手續費
          </p>
        </div>

        <div className="rounded-md border border-neutral-blue-gray/30 p-4">
          <span className="mb-2 block text-sm font-semibold text-neutral-dark">付款週期</span>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <RadioDot checked={payCycleMode === 'afterInvoice'} onSelect={() => setPayCycleMode('afterInvoice')} label="發票開立後的" />
              <TextInput
                type="number"
                widthClassName="w-20"
                disabled={payCycleMode !== 'afterInvoice'}
                value={daysAfterInvoice}
                onChange={e => setDaysAfterInvoice(Number(e.target.value))}
              />
              <span className="text-sm text-neutral-mid">天</span>
            </div>
            <div className="flex items-center gap-2">
              <RadioDot checked={payCycleMode === 'recurring'} onSelect={() => setPayCycleMode('recurring')} label="或 - 每" />
              <Select widthClassName="w-16" value={recurInterval} onValueChange={setRecurInterval} disabled={payCycleMode !== 'recurring'}>
                {['1', '2', '3', '4', '5', '6', '7'].map(n => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
              <Select
                widthClassName="w-20"
                value={recurUnit}
                onValueChange={v => {
                  setRecurUnit(v as '週' | '月');
                  setRecurDay(v === '週' ? '三' : '1');
                }}
                disabled={payCycleMode !== 'recurring'}
              >
                <option value="週">週</option>
                <option value="月">月</option>
              </Select>
              <Select widthClassName="w-16" value={recurDay} onValueChange={setRecurDay} disabled={payCycleMode !== 'recurring'}>
                {(recurUnit === '週' ? WEEKDAYS : MONTH_DAYS).map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-neutral-mid">提醒：{payCycleReminder}</p>
        </div>

        <div className="rounded-md border border-neutral-blue-gray/30 p-4">
          <span className="mb-2 block text-sm font-semibold text-neutral-dark">收款戶頭</span>
          <Select widthClassName="w-full" value={bankAccount} onValueChange={setBankAccount}>
            {BANK_ACCOUNTS.map(account => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </Select>
          <p className="mt-3 text-xs leading-relaxed text-neutral-mid">
            {bankAccount === '現金' ? (
              '提醒：每筆交易系統會即時入帳'
            ) : (
              <>
                提醒：每筆交易會在{' '}
                {payCycleMode === 'recurring'
                  ? `每 ${recurInterval} ${recurUnit}${recurUnit === '週' ? `星期${recurDay}` : `${recurDay}號`}`
                  : `發票開立後 ${daysAfterInvoice} 天`}{' '}
                存入 <span className="font-semibold text-neutral-dark">{bankAccount}</span> 戶頭，且扣除交易金額之{' '}
                <span className="font-semibold text-neutral-dark">{feeRows.map(feeLabel).join(' + ')}</span> 做為手續費。
                <br />
                系統自動計算：
                <br />
                1. 實際收款金額：交易金額 - 各項手續費
                <br />
                2. 建立手續費紀錄
              </>
            )}
          </p>
        </div>

        <div className="rounded-md border border-neutral-blue-gray/30 p-4">
          <span className="mb-3 block text-sm font-semibold text-neutral-dark">試算器</span>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-neutral-mid">交易金額</span>
              <MoneyInput widthClassName="w-36" value={trialAmount} onChange={setTrialAmount} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-neutral-mid">各項手續費</span>
              <MoneyInput widthClassName="w-36" value={Math.round(feeAmount)} disabled readOnly />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-neutral-mid">存入金額</span>
              <MoneyInput widthClassName="w-36" value={Math.round(depositAmount)} disabled readOnly />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="danger" onClick={onClose}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!channelName.trim()}>
          新增銷售管道
        </Button>
      </div>
    </Modal>
  );
}
