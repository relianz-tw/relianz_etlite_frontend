'use client';

import { fetchSettleEventList } from '@/api/ledger';
import type { SettleEventListItemDto } from '@/api/types';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useState } from 'react';
import type { ReconSide } from './types';

export interface UseSettleEventHistoryParams {
  side: ReconSide;
  dateFrom: string;
  dateTo: string;
  unlimitedDate: boolean;
  page: number;
  pageSize?: number;
}

export interface UseSettleEventHistoryResult {
  items: SettleEventListItemDto[];
  total: number;
  loading: boolean;
  error: string;
  reload: () => void;
}

/** 沖帳紀錄清單資料取得，比照 useReconTargets 的 useState + useEffect 寫法。 */
export function useSettleEventHistory({ side, dateFrom, dateTo, unlimitedDate, page, pageSize = 10 }: UseSettleEventHistoryParams): UseSettleEventHistoryResult {
  const [items, setItems] = useState<SettleEventListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    // 不限日期時傳空字串，buildQuery 會自動略過
    fetchSettleEventList({
      side: side === 'receivable' ? 0 : 1,
      dateFrom: unlimitedDate ? '' : dateFrom,
      dateTo: unlimitedDate ? '' : dateTo,
      page,
      pageSize,
    })
      .then(result => {
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
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
  }, [side, dateFrom, dateTo, unlimitedDate, page, pageSize, reloadKey]);

  return { items, total, loading, error, reload: () => setReloadKey(k => k + 1) };
}
