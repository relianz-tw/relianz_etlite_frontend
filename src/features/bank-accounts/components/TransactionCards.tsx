'use client';

import Button from '@/components/ui/Button';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import { ChevronDown, FileSearch } from 'lucide-react';
import { useRouter } from 'next/navigation';
import InlineLinkedTransactions from './InlineLinkedTransactions';
import type { BankTransactionRow } from '../types';

interface TransactionCardsProps {
  rows: BankTransactionRow[];
  /** 目前 inline 展開中的交易 id，null 代表皆收合 */
  expandedId: string | null;
  onToggle: (id: string) => void;
  /** 展開區「查看完整明細」按鈕導向的交易詳細頁網址 */
  detailHref: (row: BankTransactionRow) => string;
}

/** 手機版交易明細卡片，與 TransactionTable 顯示同一份資料，點擊卡片標頭 inline 展開重點欄位 */
export default function TransactionCards({ rows, expandedId, onToggle, detailHref }: TransactionCardsProps) {
  const router = useRouter();

  if (rows.length === 0) {
    return <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid nav:hidden">此期間尚無交易紀錄</div>;
  }

  return (
    <div className="flex flex-col gap-3 nav:hidden">
      {rows.map(row => {
        const expanded = expandedId === row.id;
        const amountLabel = row.expense != null ? '支出金額' : '存入金額';
        const amountValue = fmtCurrency(row.expense ?? row.deposit ?? 0);
        return (
          <div key={row.id} className="rounded-lg border border-neutral-blue-gray/30 bg-white">
            <button type="button" onClick={() => onToggle(row.id)} className="flex w-full flex-col gap-1.5 p-4 text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-neutral-mid">{formatYyyymmddRoc(row.transactionDate)}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-neutral-dark">餘額 {fmtCurrency(row.balance)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-neutral-dark">{row.summary}</span>
                <ChevronDown size={16} className={`shrink-0 text-neutral-mid transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-neutral-mid">
                <span className="truncate">{row.remark || '—'}</span>
                <span className="shrink-0 font-mono tabular-nums">
                  {row.expense != null ? `-${fmtCurrency(row.expense)}` : `+${fmtCurrency(row.deposit ?? 0)}`}
                </span>
              </div>
            </button>
            {expanded && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-neutral-blue-gray/20 p-4 text-sm">
                <div>
                  <p className="text-xs text-neutral-mid">{amountLabel}</p>
                  <p className="mt-0.5 font-mono font-medium tabular-nums text-neutral-dark">{amountValue}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-mid">帳務時間</p>
                  <p className="mt-0.5 font-mono font-medium text-neutral-dark">{formatYyyymmddRoc(row.accountingDate)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-neutral-mid">備註</p>
                  <p className="mt-0.5 font-medium text-neutral-dark">{row.remark || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="mb-1.5 text-xs font-semibold text-neutral-mid">關聯帳簿交易</p>
                  <InlineLinkedTransactions items={row.linkedTransactions} />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button variant="outline" size="sm" icon={FileSearch} onClick={() => router.push(detailHref(row))}>
                    查看完整明細
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
