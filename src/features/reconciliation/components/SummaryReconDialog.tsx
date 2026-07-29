'use client';

import DatePicker, { formatRocDate, parseRocDate } from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import MoneyInput from '@/components/ui/MoneyInput';
import Select from '@/components/ui/Select';
import { PURCHASE_PAYABLE, SALES_CHANNELS, SALES_RECEIVABLE } from '@/features/ledger/data';
import { SETTINGS_VENDORS } from '@/features/settings/data';
import { fmtCurrency } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { allocateTxnsToAmount } from '../data';
import { addReconRecord, useReconRecords } from '../reconStore';
import type { ReconRecord, ReconSide, ReconTxnRef } from '../types';

interface SummaryReconDialogProps {
  open: boolean;
  onClose: () => void;
  side: ReconSide;
}

function withinPeriod(date: string, from?: Date, to?: Date): boolean {
  if (!from || !to) return false;
  const parsed = parseRocDate(date);
  if (!parsed) return false;
  return parsed >= from && parsed <= to;
}

/**
 * 帳簿頁「匯總沖帳」對話框：選擇銷售管道／廠商與交易期間、輸入本次收付款金額與手續費，
 * 系統列出期間內尚未沖帳的交易並依日期舊到新自動累加勾選，確認後寫入沖帳紀錄供對帳中心查詢。
 */
export default function SummaryReconDialog({ open, onClose, side }: SummaryReconDialogProps) {
  const isReceivable = side === 'receivable';
  const groupOptions = isReceivable ? SALES_CHANNELS : SETTINGS_VENDORS.filter(v => v.name).map(v => v.name);
  const pastRecords = useReconRecords(side);

  const [group, setGroup] = useState('');
  const [periodFrom, setPeriodFrom] = useState<Date | undefined>(undefined);
  const [periodTo, setPeriodTo] = useState<Date | undefined>(undefined);
  const [inputAmount, setInputAmount] = useState(0);
  const [feeAmount, setFeeAmount] = useState(0);
  // 送出後的結果需獨立保存快照：確認沖帳當下就已寫入沖帳紀錄，若結果畫面直接沿用下方即時計算的 allocation，
  // 該筆交易會因為已被排除在候選之外（避免重複沖帳）導致重新算出「0 筆沖銷」，因此改為送出時記住當下結果。
  const [submittedRecord, setSubmittedRecord] = useState<ReconRecord | null>(null);

  useEffect(() => {
    if (!open) return;
    setGroup('');
    setPeriodFrom(undefined);
    setPeriodTo(undefined);
    setInputAmount(0);
    setFeeAmount(0);
    setSubmittedRecord(null);
  }, [open]);

  if (!open) return null;

  // 排除先前已沖帳過的交易，避免同一筆交易被重複沖帳
  const reconciledIds = new Set(pastRecords.flatMap(r => r.matched.map(m => m.id)));

  const candidateRows: ReconTxnRef[] = isReceivable
    ? SALES_RECEIVABLE.filter(r => r.channel === group && !r.voided && !reconciledIds.has(r.id) && withinPeriod(r.date, periodFrom, periodTo)).map(r => ({
        id: r.id,
        amount: r.amount,
        date: r.date,
      }))
    : PURCHASE_PAYABLE.filter(r => r.party === group && !reconciledIds.has(r.id) && withinPeriod(r.date, periodFrom, periodTo)).map(r => ({
        id: r.id,
        amount: r.amount,
        date: r.date,
      }));

  const targetAmount = Math.max(inputAmount - feeAmount, 0);
  const allocation = allocateTxnsToAmount(candidateRows, targetAmount);
  const adjustment = targetAmount - allocation.matchedAmount;
  const canConfirm = !!group && !!periodFrom && !!periodTo && inputAmount > 0;

  const handleConfirm = () => {
    if (!canConfirm || !periodFrom || !periodTo) return;
    const record: ReconRecord = {
      id: `RR-${group}-${Date.now()}`,
      side,
      groupLabel: group,
      periodFrom: formatRocDate(periodFrom),
      periodTo: formatRocDate(periodTo),
      inputAmount,
      feeAmount,
      matched: allocation.matched,
      matchedAmount: allocation.matchedAmount,
      adjustment,
      unmatched: allocation.unmatched,
    };
    addReconRecord(record);
    setSubmittedRecord(record);
  };

  if (submittedRecord) {
    return (
      <Modal open onClose={onClose} title="沖帳完成" widthClassName="max-w-[460px]">
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-neutral-dark">
            已沖銷 <span className="font-semibold">{submittedRecord.matched.length}</span> 筆交易，共{' '}
            <span className="font-mono font-semibold tabular-nums">{fmtCurrency(submittedRecord.matchedAmount)}</span>。
          </p>
          {submittedRecord.adjustment > 0 && (
            <p className="rounded-md bg-surface-cream p-3 text-neutral-mid">
              本次金額有 <span className="font-mono font-semibold text-neutral-dark">{fmtCurrency(submittedRecord.adjustment)}</span>{' '}
              未能對應到期間內交易，已建立一筆調整項紀錄。
            </p>
          )}
          {submittedRecord.unmatched.length > 0 && (
            <p className="rounded-md bg-surface-cream p-3 text-neutral-mid">
              期間內尚有 <span className="font-semibold text-neutral-dark">{submittedRecord.unmatched.length}</span> 筆交易尚未沖到帳。
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            關閉
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="匯總沖帳" widthClassName="max-w-[520px]">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">{isReceivable ? '銷售管道' : '廠商'}</label>
          <Select value={group} onValueChange={setGroup}>
            <option value="">{isReceivable ? '請選擇銷售管道' : '請選擇廠商'}</option>
            {groupOptions.map(g => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">交易期間</label>
          <div className="flex items-center gap-2">
            <DatePicker value={periodFrom} onChange={setPeriodFrom} placeholder="起" />
            <span className="shrink-0 text-sm text-neutral-mid">–</span>
            <DatePicker value={periodTo} onChange={setPeriodTo} placeholder="迄" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-dark">本次{isReceivable ? '收' : '付'}款金額</span>
          <MoneyInput widthClassName="w-36" value={inputAmount} onChange={setInputAmount} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-dark">手續費</span>
          <MoneyInput widthClassName="w-36" value={feeAmount} onChange={setFeeAmount} />
        </div>

        {group && periodFrom && periodTo && (
          <div className="rounded-md border border-neutral-blue-gray/30 p-4">
            <p className="mb-2 text-sm font-semibold text-neutral-dark">系統將依日期由舊到新自動沖銷以下交易</p>
            {allocation.matched.length === 0 ? (
              <p className="text-sm text-neutral-mid">此期間內沒有可沖銷的交易。</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {allocation.matched.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-neutral-mid">
                      {t.id} · {t.date}
                    </span>
                    <span className="font-mono tabular-nums text-neutral-dark">{fmtCurrency(t.amount)}</span>
                  </div>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-neutral-blue-gray/20 pt-1.5 text-sm font-semibold">
                  <span className="text-neutral-dark">小計</span>
                  <span className="font-mono tabular-nums text-neutral-dark">{fmtCurrency(allocation.matchedAmount)}</span>
                </div>
              </div>
            )}
            {adjustment > 0 && (
              <p className="mt-3 text-xs text-semantic-error">
                本次金額有 {fmtCurrency(adjustment)} 未能對應到期間內交易，確認後將建立一筆調整項紀錄。
              </p>
            )}
            {allocation.unmatched.length > 0 && (
              <p className="mt-2 text-xs text-neutral-mid">期間內尚有 {allocation.unmatched.length} 筆交易將維持未沖帳狀態。</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={!canConfirm}>
          確認沖帳
        </Button>
      </div>
    </Modal>
  );
}
