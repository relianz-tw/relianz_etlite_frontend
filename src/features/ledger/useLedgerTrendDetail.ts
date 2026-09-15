'use client';

import { fetchPayablesPaidSummary, fetchPayablesSummary, fetchReceivablesCollectedSummary, fetchReceivablesSummary } from '@/api/ledgerSummary';
import type { LedgerDailyAmount } from '@/api/types';
import { parseRocDate } from '@/components/ui/DatePicker';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useState } from 'react';
import { formatYmd } from './transaction/data';
import type { Side } from './types';

interface UseLedgerTrendDetailResult {
  /** 未結清原單逐日金額（transaction_date 口徑：receivables/summary、payables/summary） */
  outstandingDaily: LedgerDailyAmount[];
  /** 已結清原單逐日金額（entry_date 口徑：receivables/collected/summary、payables/paid/summary） */
  settledDaily: LedgerDailyAmount[];
  loading: boolean;
  error: string;
}

/**
 * 帳簿總覽「交易金額」趨勢詳情頁（/ledger/trend）專用資料源。
 * 與 useLedgerSummary 打同一組 summary 端點，但刻意不用 mergeDailyAmounts 相加：
 * 詳情頁要把「未收/未付」與「已收/已付」拆成堆疊長條圖的兩段序列分別呈現，見 TrendDetailPageView。
 * ⚠️ 同樣不吃子分頁／管道篩選，恆抓「全部管道／廠商」的區間彙總，理由與 useLedgerSummary 一致。
 */
export function useLedgerTrendDetail(side: Side, range: { from: string; to: string }): UseLedgerTrendDetailResult {
  const [outstandingDaily, setOutstandingDaily] = useState<LedgerDailyAmount[]>([]);
  const [settledDaily, setSettledDaily] = useState<LedgerDailyAmount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const body = {
      dateFrom: formatYmd(parseRocDate(range.from)),
      dateTo: formatYmd(parseRocDate(range.to)),
    };

    const request =
      side === 'sales'
        ? Promise.all([fetchReceivablesSummary(body), fetchReceivablesCollectedSummary(body)])
        : Promise.all([fetchPayablesSummary(body), fetchPayablesPaidSummary(body)]);

    request
      .then(([main, settled]) => {
        if (cancelled) return;
        setOutstandingDaily(main.dailyAmounts);
        setSettledDaily(settled.dailyAmounts);
      })
      .catch(err => {
        if (cancelled) return;
        setError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [side, range.from, range.to]);

  return { outstandingDaily, settledDaily, loading, error };
}
