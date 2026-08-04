'use client';

import { fmtCurrency, formatYyyymmdd } from '@/lib/utils';
import type { BankTransactionRow } from '../types';

interface TransactionCardsProps {
  rows: BankTransactionRow[];
  onRowClick: (row: BankTransactionRow) => void;
}

/** 手機版交易明細卡片，與 TransactionTable 顯示同一份資料，點擊卡片查看憑證/入帳資訊 */
export default function TransactionCards({ rows, onRowClick }: TransactionCardsProps) {
  if (rows.length === 0) {
    return <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid nav:hidden">此期間尚無交易紀錄</div>;
  }

  return (
    <div className="flex flex-col gap-3 nav:hidden">
      {rows.map(row => (
        <button
          key={row.id}
          type="button"
          onClick={() => onRowClick(row)}
          className="flex flex-col gap-1.5 rounded-lg border border-neutral-blue-gray/30 bg-white p-4 text-left"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-neutral-mid">{formatYyyymmdd(row.transactionDate)}</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-neutral-dark">餘額 {fmtCurrency(row.balance)}</span>
          </div>
          <span className="truncate text-sm text-neutral-dark">{row.summary}</span>
          <div className="flex items-center justify-between gap-2 text-xs text-neutral-mid">
            <span className="truncate">{row.remark || '—'}</span>
            <span className="shrink-0 font-mono tabular-nums">
              {row.expense != null ? `-${fmtCurrency(row.expense)}` : `+${fmtCurrency(row.deposit ?? 0)}`}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
