'use client';

import Button from '@/components/ui/Button';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import { ChevronDown, FileSearch } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Fragment } from 'react';
import InlineLinkedTransactions from './InlineLinkedTransactions';
import type { BankTransactionRow } from '../types';

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark';

/** 表格欄寬（交易時間/帳務時間/摘要/支出金額/存入金額/餘額/備註），與下方 <colgroup> 一致；
 *  展開列以同一組欄寬排版，確保欄位對齊表頭 */
const COLUMN_TEMPLATE = '110px 110px 1fr 130px 130px 130px 160px';

interface TransactionTableProps {
  rows: BankTransactionRow[];
  /** 目前查詢期間內的總筆數（非本頁筆數），供表尾顯示 */
  totalCount: number;
  /** 目前 inline 展開中的交易 id，null 代表皆收合 */
  expandedId: string | null;
  onToggle: (id: string) => void;
  /** 展開列「查看完整明細」按鈕導向的交易詳細頁網址 */
  detailHref: (row: BankTransactionRow) => string;
}

/** 展開列的重點欄位（帳務時間/摘要/支出/存入/備註）＋導向詳細頁按鈕；欄位對齊表頭同一組欄寬（COLUMN_TEMPLATE） */
function ExpandedDetail({ row, detailHref }: { row: BankTransactionRow; detailHref: string }) {
  const router = useRouter();

  return (
    <div className="py-3">
      <div className="grid items-start gap-y-1 text-sm" style={{ gridTemplateColumns: COLUMN_TEMPLATE }}>
        <div />
        <div className="px-4">
          <p className="text-xs text-neutral-mid">帳務時間</p>
          <p className="mt-0.5 font-mono font-medium text-neutral-dark">{formatYyyymmddRoc(row.accountingDate)}</p>
        </div>
        <div className="min-w-0 px-4">
          <p className="text-xs text-neutral-mid">摘要</p>
          <p className="mt-0.5 truncate font-medium text-neutral-dark">{row.summary || '—'}</p>
        </div>
        <div className="px-4 text-right">
          <p className="text-xs text-neutral-mid">支出金額</p>
          <p className="mt-0.5 font-mono font-medium tabular-nums text-neutral-dark">{row.expense != null ? fmtCurrency(row.expense) : '—'}</p>
        </div>
        <div className="px-4 text-right">
          <p className="text-xs text-neutral-mid">存入金額</p>
          <p className="mt-0.5 font-mono font-medium tabular-nums text-neutral-dark">{row.deposit != null ? fmtCurrency(row.deposit) : '—'}</p>
        </div>
        <div />
        <div className="min-w-0 px-4">
          <p className="text-xs text-neutral-mid">備註</p>
          <p className="mt-0.5 truncate font-medium text-neutral-dark">{row.remark || '—'}</p>
        </div>
      </div>

      <div className="mt-3 px-4">
        <p className="mb-1.5 text-xs font-semibold text-neutral-mid">關聯帳簿交易</p>
        <InlineLinkedTransactions items={row.linkedTransactions} />
      </div>

      <div className="flex justify-end px-4 pt-3">
        <Button variant="outline" size="sm" icon={FileSearch} onClick={() => router.push(detailHref)}>
          查看完整明細
        </Button>
      </div>
    </div>
  );
}

/** 桌機交易明細表：整列可點擊 inline 展開重點欄位，展開內含導向交易詳細頁的按鈕；樣式沿用帳簿表格（thClass/tdClass/斑馬紋）慣例 */
export default function TransactionTable({ rows, totalCount, expandedId, onToggle, detailHref }: TransactionTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-md border border-neutral-blue-gray/30 bg-white nav:block">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-[110px]" />
          <col className="w-[110px]" />
          <col />
          <col className="w-[130px]" />
          <col className="w-[130px]" />
          <col className="w-[130px]" />
          <col className="w-[160px]" />
        </colgroup>
        <thead className="bg-surface-off-white">
          <tr className="border-b border-neutral-blue-gray/40">
            <th className={thClass}>交易時間</th>
            <th className={thClass}>帳務時間</th>
            <th className={thClass}>摘要</th>
            <th className={`${thClass} text-right`}>支出金額</th>
            <th className={`${thClass} text-right`}>存入金額</th>
            <th className={`${thClass} text-right`}>餘額</th>
            <th className={thClass}>備註</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-mid">
                此期間尚無交易紀錄
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const expanded = expandedId === row.id;
              return (
                <Fragment key={row.id}>
                  <tr
                    onClick={() => onToggle(row.id)}
                    className={`cursor-pointer border-b border-neutral-blue-gray/20 last:border-0 hover:bg-brand-blue/5 ${
                      expanded ? 'bg-brand-blue/5' : i % 2 === 1 ? 'bg-surface-warm/30' : ''
                    }`}
                  >
                    <td className={`${tdClass} font-mono`}>{formatYyyymmddRoc(row.transactionDate)}</td>
                    <td className={`${tdClass} font-mono text-neutral-mid`}>{formatYyyymmddRoc(row.accountingDate)}</td>
                    <td className={`${tdClass} truncate`} title={row.summary}>
                      <span className="inline-flex items-center gap-1.5">
                        <ChevronDown size={14} className={`shrink-0 text-neutral-mid transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        {row.summary}
                      </span>
                    </td>
                    <td className={`${tdClass} text-right font-mono tabular-nums`}>{row.expense != null ? fmtCurrency(row.expense) : '—'}</td>
                    <td className={`${tdClass} text-right font-mono tabular-nums`}>{row.deposit != null ? fmtCurrency(row.deposit) : '—'}</td>
                    <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(row.balance)}</td>
                    <td className={`${tdClass} truncate text-neutral-mid`} title={row.remark || undefined}>
                      {row.remark || '—'}
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="border-b border-neutral-blue-gray/20 bg-surface-off-white last:border-0">
                      <td colSpan={7} className="p-0">
                        <ExpandedDetail row={row} detailHref={detailHref(row)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-neutral-blue-gray/40 bg-surface-off-white">
            <td colSpan={7} className={`${tdClass} text-neutral-mid`}>
              此期間共 <span className="font-semibold text-neutral-dark">{totalCount}</span> 筆
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
