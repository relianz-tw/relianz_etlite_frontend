'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { LinkedLedgerTxn } from '../types';

const SIDE_LABEL: Record<LinkedLedgerTxn['side'], string> = { sales: '銷項', purchase: '進項' };

/** 交易明細頁「關聯帳簿交易」清單：一筆銀行沖帳事件可能對應 0～多筆帳簿交易，逐筆提供導向該筆帳簿交易編輯頁的入口 */
export default function LinkedTransactionList({ items, loading, error }: { items: LinkedLedgerTxn[]; loading: boolean; error: string }) {
  const router = useRouter();

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <h2 className="mb-5 text-base font-semibold text-neutral-dark">關聯帳簿交易</h2>
      {loading ? (
        <p className="text-sm text-neutral-mid">載入中…</p>
      ) : error ? (
        <p className="text-sm text-semantic-error">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-mid">此筆交易尚無關聯的帳簿交易</p>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-blue-gray/20">
          {items.map(item => (
            <div key={item.ledgerUuid} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 nav:flex-row nav:items-center nav:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge tone={item.side === 'sales' ? 'info' : 'neutral'} variant="muted">
                    {SIDE_LABEL[item.side]}
                  </Badge>
                  <span className="font-mono text-sm font-semibold text-neutral-dark">{item.orderCode}</span>
                  <span className="text-sm font-medium text-neutral-dark">{item.counterpartyName}</span>
                </div>
                <p className="text-xs text-neutral-mid">
                  {item.subjectName}
                  {item.invoiceNo && (
                    <>
                      ・憑證號碼 <span className="font-mono">{item.invoiceNo}</span>
                    </>
                  )}
                </p>
                <div className="flex items-center gap-3 text-xs text-neutral-mid">
                  <span className="font-mono">{item.transactionDate ? formatYyyymmddRoc(item.transactionDate) : '—'}</span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(item.totalAmount)}</span>
                  <span>本次沖帳 {item.eventSettleAmount != null ? fmtCurrency(item.eventSettleAmount) : '—'}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Pencil}
                onClick={() => router.push(`/ledger/${item.ledgerUuid}?side=${item.side}`)}
              >
                編輯此交易
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
