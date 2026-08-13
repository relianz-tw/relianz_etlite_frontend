'use client';

import { fetchEntryDetail } from '@/api/ledger';
import type { EntryDetailAllowanceDto } from '@/api/types';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Side } from '../types';
import { withReturnParam } from '../urlState';
import type { ReadonlyURLSearchParams } from 'next/navigation';

/**
 * 展開面板懶載入該筆原單已開立的折讓單：帳簿列表 API 已將折讓單自最上層過濾掉（見 LedgerView），
 * 僅在使用者實際展開該列時才呼叫 GET /ael/ledger/entries/detail 取 allowances，避免整頁一次打上百支請求。
 * 已抓過的結果留在 state 內，收合再展開不重複請求（沿用對帳中心 ReconTxnList 的 useLazyEntryDetail 寫法）。
 */
function useLazyAllowances(ledgerUuid: string, expanded: boolean) {
  const [allowances, setAllowances] = useState<EntryDetailAllowanceDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!expanded || fetched) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchEntryDetail({ ledgerUuid })
      .then(result => {
        if (cancelled) return;
        setAllowances(result.allowances ?? []);
        setFetched(true);
      })
      .catch(err => {
        if (!cancelled) setError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expanded, fetched, ledgerUuid]);

  return { allowances, loading, error };
}

interface LedgerAllowanceChildrenProps {
  ledgerUuid: string;
  expanded: boolean;
  side: Side;
  searchParams: ReadonlyURLSearchParams;
}

/** 帳簿列表展開列內容：顯示該筆原單已開立的折讓單清單，逐筆連到折讓單細節頁 */
export default function LedgerAllowanceChildren({ ledgerUuid, expanded, side, searchParams }: LedgerAllowanceChildrenProps) {
  const { allowances, loading, error } = useLazyAllowances(ledgerUuid, expanded);

  return (
    <div className="rounded-md border border-neutral-blue-gray/20 bg-surface-cream p-4 text-sm">
      {loading ? (
        <p className="text-xs text-neutral-mid">載入中…</p>
      ) : error ? (
        <p className="text-xs text-semantic-error">{error}</p>
      ) : allowances.length === 0 ? (
        <p className="text-xs text-neutral-mid">此交易尚無折讓單</p>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-blue-gray/20">
          {allowances.map(allowance => (
            <Link
              key={allowance.ledgerUuid}
              href={withReturnParam(`/ledger/${allowance.ledgerUuid}?side=${side}`, searchParams)}
              className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0 hover:bg-brand-blue/5"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono font-semibold text-neutral-dark hover:text-brand-blue hover:underline">{allowance.orderCode}</span>
                <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(allowance.allowanceAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-mid">
                <span>
                  未稅 {fmtCurrency(allowance.netAmount)}　稅額 {fmtCurrency(allowance.taxAmount)}
                </span>
                <span>總額 {fmtCurrency(allowance.totalAmount)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
