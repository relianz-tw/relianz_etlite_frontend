'use client';

import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useState } from 'react';
import { loadLinkedTransactions } from './data';
import type { LinkedLedgerTxn } from './types';

/**
 * 展開列懶載入關聯帳簿交易：POST /ael/bankAccounts/transactions 只回沖帳事件，不含帳簿交易明細，
 * 僅在使用者實際展開該列時才逐筆呼叫 GET /ael/ledger/entries/detail 補齊，避免整頁一次打上百支請求
 * （比照 src/features/reconciliation/components/ReconTxnList.tsx 的 useLazyEntryDetail 寫法）。
 * 已抓過的結果留在 state 內，收合再展開不重複請求。
 * subjectIds／subjectNameById 供補上各筆關聯帳簿交易的科目名稱（見 data.ts 的 loadLinkedTransactions）。
 */
export function useLazyLinkedTransactions(
  ledgerUuids: string[],
  subjectIds: number[],
  settleEventUuid: string,
  subjectNameById: Map<number, string>,
  expanded: boolean,
) {
  const [items, setItems] = useState<LinkedLedgerTxn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!expanded || fetched || ledgerUuids.length === 0) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    loadLinkedTransactions(ledgerUuids, subjectIds, settleEventUuid, subjectNameById)
      .then(result => {
        if (cancelled) return;
        setItems(result);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, fetched, ledgerUuids.join(','), subjectIds.join(','), settleEventUuid]);

  return { items, loading, error };
}
