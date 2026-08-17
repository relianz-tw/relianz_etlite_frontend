'use client';

import type { EntryDetailEntryDto, EntryDetailSettleEventDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import { fmtCurrency } from '@/lib/utils';
import { ChevronDown, ChevronUp, CircleDollarSign, Scale, Wallet } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import TransactionSettlementHistory from './TransactionSettlementHistory';

interface StatusRow {
  icon: typeof Scale;
  label: string;
  value: ReactNode;
}

interface TransactionSettlementStatusProps {
  entry: EntryDetailEntryDto;
  /** 1 銷項／2 進項；決定已收/已付、待收/待付等名詞 */
  buyOrSell: number;
  settleEvents: EntryDetailSettleEventDto[];
  onEdit: (event: EntryDetailSettleEventDto) => void;
  onReverse: (event: EntryDetailSettleEventDto) => void;
}

export default function TransactionSettlementStatus({ entry, buyOrSell, settleEvents, onEdit, onReverse }: TransactionSettlementStatusProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const isPurchase = buyOrSell === 2;
  // 未收付完畢即視為未完成；金額歸零或超收/超付（<=0）都視為已完成
  const isComplete = entry.remainingAmount <= 0;
  const activeCount = settleEvents.filter(event => !event.isReverse).length;

  const rows: StatusRow[] = [
    { icon: CircleDollarSign, label: isPurchase ? '已付金額/折讓金額' : '已收金額/折讓金額', value: fmtCurrency(entry.settledAmount) },
    { icon: Wallet, label: isPurchase ? '待付金額' : '待收金額', value: fmtCurrency(entry.remainingAmount) },
    {
      icon: Scale,
      label: '沖帳狀態',
      value: (
        <Badge tone={isComplete ? 'success' : 'info'} variant="muted">
          {isComplete ? '已完成' : '未完成'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-4">
      <div className="flex flex-col gap-2.5">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-neutral-mid">
              <row.icon size={15} className="shrink-0" />
              {row.label}
            </span>
            <span className="font-mono font-semibold tabular-nums text-neutral-dark">{row.value}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setHistoryOpen(open => !open)}
        className="mt-3 flex w-full items-center justify-between border-t border-neutral-blue-gray/20 pt-3 text-sm font-semibold text-neutral-dark"
      >
        沖帳紀錄（{activeCount}）
        {historyOpen ? <ChevronUp size={16} className="text-neutral-mid" /> : <ChevronDown size={16} className="text-neutral-mid" />}
      </button>
      {historyOpen && (
        <div className="mt-3">
          <TransactionSettlementHistory buyOrSell={buyOrSell} settleEvents={settleEvents} onEdit={onEdit} onReverse={onReverse} />
        </div>
      )}
    </div>
  );
}
