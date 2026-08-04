'use client';

import { fmtCurrency, formatYyyymmdd } from '@/lib/utils';
import type { BankTransactionRow } from '../types';

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark';

interface TransactionTableProps {
  rows: BankTransactionRow[];
  onRowClick: (row: BankTransactionRow) => void;
}

/** 桌機交易明細表：整列可點擊查看憑證/入帳資訊，樣式沿用帳簿表格（thClass/tdClass/斑馬紋）慣例 */
export default function TransactionTable({ rows, onRowClick }: TransactionTableProps) {
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
            rows.map((row, i) => (
              <tr
                key={row.id}
                onClick={() => onRowClick(row)}
                className={`cursor-pointer border-b border-neutral-blue-gray/20 last:border-0 hover:bg-brand-blue/5 ${
                  i % 2 === 1 ? 'bg-surface-warm/30' : ''
                }`}
              >
                <td className={`${tdClass} font-mono`}>{formatYyyymmdd(row.transactionDate)}</td>
                <td className={`${tdClass} font-mono text-neutral-mid`}>{formatYyyymmdd(row.accountingDate)}</td>
                <td className={`${tdClass} truncate`} title={row.summary}>
                  {row.summary}
                </td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>{row.expense != null ? fmtCurrency(row.expense) : '—'}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>{row.deposit != null ? fmtCurrency(row.deposit) : '—'}</td>
                <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(row.balance)}</td>
                <td className={`${tdClass} truncate text-neutral-mid`} title={row.remark || undefined}>
                  {row.remark || '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-neutral-blue-gray/40 bg-surface-off-white">
            <td colSpan={7} className={`${tdClass} text-neutral-mid`}>
              目前顯示 <span className="font-semibold text-neutral-dark">{rows.length}</span> 筆
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
