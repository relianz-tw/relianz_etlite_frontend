'use client';

import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import type { LinkedLedgerTxn } from '../types';

/** 欄寬比照帳簿表格（交易編號/交易金額/交易敘述/費用類別/專案名稱/開立日期），純文字呈現、無互動元件 */
const COLUMN_TEMPLATE = '150px 120px 1fr 140px 140px 110px';

/**
 * Inline 展開內顯示的關聯帳簿交易清單：欄位比照帳簿表格，但僅文字呈現（無勾選/下拉/按鈕等互動元件），
 * 桌機以表格欄位對齊呈現，手機欄寬不足改為堆疊列；點列本身不可互動，完整操作請至交易明細頁。
 */
export default function InlineLinkedTransactions({ items }: { items: LinkedLedgerTxn[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-neutral-mid">此筆交易尚無關聯的帳簿交易</p>;
  }

  return (
    <div className="overflow-hidden rounded-md border border-neutral-blue-gray/20">
      <div className="hidden nav:block">
        <div
          className="grid gap-x-3 bg-surface-off-white px-3 py-2 text-xs font-semibold text-neutral-mid"
          style={{ gridTemplateColumns: COLUMN_TEMPLATE }}
        >
          <span>交易編號</span>
          <span className="text-right">交易金額</span>
          <span>交易敘述</span>
          <span>費用類別</span>
          <span>專案名稱</span>
          <span>開立日期</span>
        </div>
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`grid items-center gap-x-3 px-3 py-2 text-sm text-neutral-dark ${i % 2 === 1 ? 'bg-surface-warm/30' : 'bg-white'}`}
            style={{ gridTemplateColumns: COLUMN_TEMPLATE }}
          >
            <span className="truncate font-mono text-[13px]">{item.id}</span>
            <span className="text-right font-mono tabular-nums">{fmtCurrency(item.amount)}</span>
            <span className="truncate" title={item.counterparty}>
              {item.counterparty}
            </span>
            <span className="truncate text-neutral-mid">{item.category || '—'}</span>
            <span className="truncate text-neutral-mid">{item.project || '—'}</span>
            <span className="font-mono text-neutral-mid">{formatYyyymmddRoc(item.date)}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col divide-y divide-neutral-blue-gray/20 nav:hidden">
        {items.map(item => (
          <div key={item.id} className="flex flex-col gap-1 bg-white px-3 py-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-neutral-dark">{item.id}</span>
              <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(item.amount)}</span>
            </div>
            <span className="text-neutral-dark">{item.counterparty}</span>
            <div className="flex flex-wrap gap-x-3 text-neutral-mid">
              <span>{item.category || '—'}</span>
              <span>{item.project || '—'}</span>
              <span className="font-mono">{formatYyyymmddRoc(item.date)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
