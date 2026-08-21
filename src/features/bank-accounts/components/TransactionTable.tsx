'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import { ChevronDown, FileSearch } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Fragment } from 'react';
import { formatCounterpartyLabel } from '../data';
import { cashDirectionLabel } from '../labels';
import { useLazyLinkedTransactions } from '../useLazyLinkedTransactions';
import InlineLinkedTransactions from './InlineLinkedTransactions';
import type { BankTxnRow, LinkedLedgerTxn } from '../types';

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark';

interface TransactionTableProps {
  rows: BankTxnRow[];
  /** 目前查詢期間內的總筆數（非本頁筆數），供表尾顯示 */
  totalCount: number;
  /** 目前 inline 展開中的沖帳事件 uuid，null 代表皆收合 */
  expandedId: string | null;
  onToggle: (id: string) => void;
  /** 展開列「查看完整明細」按鈕導向的交易詳細頁網址 */
  detailHref: (row: BankTxnRow) => string;
}

/** 展開列的重點欄位（沖帳金額/實際收付/建立時間）＋關聯帳簿交易（懶載入）＋導向詳細頁按鈕 */
function ExpandedDetail({
  row,
  detailHref,
  items,
  loading,
  error,
}: {
  row: BankTxnRow;
  detailHref: string;
  items: LinkedLedgerTxn[];
  loading: boolean;
  error: string;
}) {
  const router = useRouter();

  return (
    <div className="py-3">
      <div className="grid grid-cols-3 gap-4 px-4 text-sm">
        <div>
          <p className="text-xs text-neutral-mid">沖帳金額</p>
          <p className="mt-0.5 font-mono font-medium tabular-nums text-neutral-dark">{fmtCurrency(row.settleAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-mid">實際收付</p>
          <p className="mt-0.5 font-mono font-medium tabular-nums text-neutral-dark">{fmtCurrency(row.cashAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-mid">建立時間</p>
          <p className="mt-0.5 font-mono font-medium text-neutral-dark">{formatYyyymmddRoc(row.createdAt)}</p>
        </div>
      </div>

      <div className="mt-3 px-4">
        <p className="mb-1.5 text-xs font-semibold text-neutral-mid">關聯帳簿交易</p>
        <InlineLinkedTransactions items={items} loading={loading} error={error} />
      </div>

      <div className="flex justify-end px-4 pt-3">
        <Button variant="outline" size="sm" icon={FileSearch} onClick={() => router.push(detailHref)}>
          查看完整明細
        </Button>
      </div>
    </div>
  );
}

/** 單列（含收合列與展開內容）：獨立成元件讓 useLazyLinkedTransactions 有自己的 hook 實例，
 *  並讓收合列的交易對象文字（formatCounterpartyLabel）能拿到已展開載入的 items 補上科目 fallback */
function TransactionRow({
  row,
  expanded,
  isOdd,
  onToggle,
  detailHref,
}: {
  row: BankTxnRow;
  expanded: boolean;
  isOdd: boolean;
  onToggle: () => void;
  detailHref: string;
}) {
  const { items, loading, error } = useLazyLinkedTransactions(row.originLedgerUuids, row.settleEventUuid, expanded);
  const counterpartyLabel = formatCounterpartyLabel(row, items);

  return (
    <Fragment>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b border-neutral-blue-gray/20 last:border-0 hover:bg-brand-blue/5 ${
          expanded ? 'bg-brand-blue/5' : isOdd ? 'bg-surface-warm/30' : ''
        }`}
      >
        <td className={`${tdClass} font-mono`}>{formatYyyymmddRoc(row.paymentDate)}</td>
        <td className={tdClass}>
          <Badge tone={row.cashDirection === 0 ? 'success' : 'error'}>{cashDirectionLabel(row.cashDirection)}</Badge>
        </td>
        <td className={`${tdClass} truncate`} title={counterpartyLabel}>
          <span className="inline-flex items-center gap-1.5">
            <ChevronDown size={14} className={`shrink-0 text-neutral-mid transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {counterpartyLabel}
          </span>
        </td>
        <td className={`${tdClass} text-right font-mono tabular-nums`}>{row.expense != null ? fmtCurrency(row.expense) : '—'}</td>
        <td className={`${tdClass} text-right font-mono tabular-nums`}>{row.deposit != null ? fmtCurrency(row.deposit) : '—'}</td>
      </tr>
      {expanded && (
        <tr className="border-b border-neutral-blue-gray/20 bg-surface-off-white last:border-0">
          <td colSpan={5} className="p-0">
            <ExpandedDetail row={row} detailHref={detailHref} items={items} loading={loading} error={error} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

/** 桌機交易明細表：整列可點擊 inline 展開重點欄位，展開內含導向交易詳細頁的按鈕；樣式沿用帳簿表格（thClass/tdClass/斑馬紋）慣例 */
export default function TransactionTable({ rows, totalCount, expandedId, onToggle, detailHref }: TransactionTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-md border border-neutral-blue-gray/30 bg-white nav:block">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-[110px]" />
          <col className="w-[80px]" />
          <col />
          <col className="w-[130px]" />
          <col className="w-[130px]" />
        </colgroup>
        <thead className="bg-surface-off-white">
          <tr className="border-b border-neutral-blue-gray/40">
            <th className={thClass}>交易日期</th>
            <th className={thClass}>方向</th>
            <th className={thClass}>交易對象</th>
            <th className={`${thClass} text-right`}>支出金額</th>
            <th className={`${thClass} text-right`}>存入金額</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-mid">
                此期間尚無交易紀錄
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <TransactionRow
                key={row.settleEventUuid}
                row={row}
                expanded={expandedId === row.settleEventUuid}
                isOdd={i % 2 === 1}
                onToggle={() => onToggle(row.settleEventUuid)}
                detailHref={detailHref(row)}
              />
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-neutral-blue-gray/40 bg-surface-off-white">
            <td colSpan={5} className={`${tdClass} text-neutral-mid`}>
              此期間共 <span className="font-semibold text-neutral-dark">{totalCount}</span> 筆
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
