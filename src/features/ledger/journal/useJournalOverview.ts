'use client';

import { fetchJournalCenter } from '@/api/ledger';
import type { DailyDetailLineDto, JournalVoucherDto } from '@/api/types';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useMemo, useState } from 'react';

// GET /ael/ledger/daily 的 dateFrom/dateTo 為必填，不限日期時改送涵蓋全部的寬區間
const UNLIMITED_DATE_FROM = '19110101';
const UNLIMITED_DATE_TO = '29991231';

export interface UseJournalOverviewParams {
  dateFrom: string;
  dateTo: string;
  unlimitedDate: boolean;
  page: number;
  pageSize?: number;
}

export interface UseJournalOverviewResult {
  vouchers: JournalVoucherDto[];
  total: number;
  loading: boolean;
  error: string;
  reload: () => void;
  /** 列表內就地更新單筆摘要，不重打整頁 */
  patchLineSummary: (lineUuid: string, summary: string, updateBy: number) => void;
}

/** 日記帳中心列表資料取得（GET /ael/ledger/daily） */
export function useJournalOverview({ dateFrom, dateTo, unlimitedDate, page, pageSize = 10 }: UseJournalOverviewParams): UseJournalOverviewResult {
  const [dtos, setDtos] = useState<JournalVoucherDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [localPatches, setLocalPatches] = useState<Record<string, Partial<DailyDetailLineDto>>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchJournalCenter({
      dateFrom: unlimitedDate ? UNLIMITED_DATE_FROM : dateFrom,
      dateTo: unlimitedDate ? UNLIMITED_DATE_TO : dateTo,
      page,
      count: pageSize,
    })
      .then(result => {
        if (cancelled) return;
        setDtos(result.vouchers);
        setTotal(result.total);
        setLocalPatches({});
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
  }, [dateFrom, dateTo, unlimitedDate, page, pageSize, reloadKey]);

  // 套上本地摘要修改，並依 sortOrder 排序（API 回傳的 lines 順序不保證）
  const vouchers = useMemo(
    () =>
      dtos.map(voucher => ({
        ...voucher,
        lines: [...voucher.lines]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(line => ({ ...line, ...localPatches[line.lineUuid] })),
      })),
    [dtos, localPatches],
  );

  return {
    vouchers,
    total,
    loading,
    error,
    reload: () => setReloadKey(k => k + 1),
    patchLineSummary: (lineUuid, summary, updateBy) =>
      setLocalPatches(prev => ({ ...prev, [lineUuid]: { ...prev[lineUuid], summary, updateBy } })),
  };
}
