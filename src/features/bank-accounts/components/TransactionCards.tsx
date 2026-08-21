'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import { ChevronDown, FileSearch } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCounterpartyLabel } from '../data';
import { cashDirectionLabel } from '../labels';
import { useLazyLinkedTransactions } from '../useLazyLinkedTransactions';
import InlineLinkedTransactions from './InlineLinkedTransactions';
import type { BankTxnRow } from '../types';

interface TransactionCardsProps {
  rows: BankTxnRow[];
  /** 目前 inline 展開中的沖帳事件 uuid，null 代表皆收合 */
  expandedId: string | null;
  onToggle: (id: string) => void;
  /** 展開區「查看完整明細」按鈕導向的交易詳細頁網址 */
  detailHref: (row: BankTxnRow) => string;
}

/** 單張交易卡片：獨立成元件讓 useLazyLinkedTransactions 有自己的 hook 實例，
 *  避免在 .map() callback 內直接呼叫 hook 違反 Hooks 規則 */
function TransactionCard({ row, expanded, onToggle, detailHref }: { row: BankTxnRow; expanded: boolean; onToggle: () => void; detailHref: string }) {
  const router = useRouter();
  const amountLabel = row.expense != null ? '支出金額' : '存入金額';
  const amountValue = fmtCurrency(row.expense ?? row.deposit ?? 0);
  const { items, loading, error } = useLazyLinkedTransactions(row.originLedgerUuids, row.settleEventUuid, expanded);

  return (
    <div className="rounded-lg border border-neutral-blue-gray/30 bg-white">
      <button type="button" onClick={onToggle} className="flex w-full flex-col gap-1.5 p-4 text-left">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-neutral-mid">{formatYyyymmddRoc(row.paymentDate)}</span>
          <Badge tone={row.cashDirection === 0 ? 'success' : 'error'}>{cashDirectionLabel(row.cashDirection)}</Badge>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm text-neutral-dark">{formatCounterpartyLabel(row, items)}</span>
          <ChevronDown size={16} className={`shrink-0 text-neutral-mid transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
        <div className="flex items-center justify-end gap-2 text-xs text-neutral-mid">
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
            <p className="text-xs text-neutral-mid">建立時間</p>
            <p className="mt-0.5 font-mono font-medium text-neutral-dark">{formatYyyymmddRoc(row.createdAt)}</p>
          </div>
          <div className="col-span-2">
            <p className="mb-1.5 text-xs font-semibold text-neutral-mid">關聯帳簿交易</p>
            <InlineLinkedTransactions items={items} loading={loading} error={error} />
          </div>
          <div className="col-span-2 flex justify-end">
            <Button variant="outline" size="sm" icon={FileSearch} onClick={() => router.push(detailHref)}>
              查看完整明細
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 手機版交易明細卡片，與 TransactionTable 顯示同一份資料，點擊卡片標頭 inline 展開重點欄位 */
export default function TransactionCards({ rows, expandedId, onToggle, detailHref }: TransactionCardsProps) {
  if (rows.length === 0) {
    return <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid nav:hidden">此期間尚無交易紀錄</div>;
  }

  return (
    <div className="flex flex-col gap-3 nav:hidden">
      {rows.map(row => (
        <TransactionCard
          key={row.settleEventUuid}
          row={row}
          expanded={expandedId === row.settleEventUuid}
          onToggle={() => onToggle(row.settleEventUuid)}
          detailHref={detailHref(row)}
        />
      ))}
    </div>
  );
}
