'use client';

import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import type { LinkedLedgerTxn } from '../types';

/** 欄寬（交易編號/交易金額/交易對象/科目/已沖·未沖/交易日期），純文字呈現、無互動元件 */
const COLUMN_TEMPLATE = '140px 120px 1fr 140px 160px 110px';

/**
 * 展開列／交易明細頁顯示的關聯帳簿交易清單：欄位對映 GET /ael/ledger/entries/detail 回應，
 * 僅文字呈現（無勾選/下拉/按鈕等互動元件），桌機以表格欄位對齊呈現，手機欄寬不足改為堆疊列；
 * 點列本身不可互動，完整操作請至交易明細頁。loading／error 對應懶載入狀態（見 useLazyLinkedTransactions）。
 */
export default function InlineLinkedTransactions({ items, loading, error }: { items: LinkedLedgerTxn[]; loading: boolean; error: string }) {
  if (loading) {
    return <p className="text-xs text-neutral-mid">載入關聯帳簿交易中…</p>;
  }
  if (error) {
    return <p className="text-xs text-semantic-error">{error}</p>;
  }
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
          <span>交易對象</span>
          <span>科目</span>
          <span className="text-right">本次沖帳</span>
          <span>交易日期</span>
        </div>
        {items.map((item, i) => (
          <div
            key={item.ledgerUuid}
            className={`grid items-center gap-x-3 px-3 py-2 text-sm text-neutral-dark ${i % 2 === 1 ? 'bg-surface-warm/30' : 'bg-white'}`}
            style={{ gridTemplateColumns: COLUMN_TEMPLATE }}
          >
            <span className="truncate font-mono text-[13px]">{item.orderCode}</span>
            <span className="text-right font-mono tabular-nums">{fmtCurrency(item.totalAmount)}</span>
            <span className="truncate" title={item.counterpartyName}>
              {item.counterpartyName}
            </span>
            <span className="truncate text-neutral-mid">{item.subjectName || '—'}</span>
            <span className="text-right font-mono tabular-nums text-neutral-mid">
              {item.eventSettleAmount != null ? fmtCurrency(item.eventSettleAmount) : '—'}
            </span>
            <span className="font-mono text-neutral-mid">{item.transactionDate ? formatYyyymmddRoc(item.transactionDate) : '—'}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col divide-y divide-neutral-blue-gray/20 nav:hidden">
        {items.map(item => (
          <div key={item.ledgerUuid} className="flex flex-col gap-1 bg-white px-3 py-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-neutral-dark">{item.orderCode}</span>
              <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(item.totalAmount)}</span>
            </div>
            <span className="text-neutral-dark">{item.counterpartyName}</span>
            <div className="flex flex-wrap gap-x-3 text-neutral-mid">
              <span>{item.subjectName || '—'}</span>
              <span>本次沖帳 {item.eventSettleAmount != null ? fmtCurrency(item.eventSettleAmount) : '—'}</span>
              <span className="font-mono">{item.transactionDate ? formatYyyymmddRoc(item.transactionDate) : '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
