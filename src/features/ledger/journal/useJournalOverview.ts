'use client';

// 後端 range API 上線後替換為非同步 fetch 版本：
//   const result = await fetchJournalOverview({ dateFrom, dateTo, page, pageSize });
//   return { items: result.items, total: result.total, loading: false, error: '' };
// 期望 endpoint: GET /ael/ledger/entries/dailyDetail/filter?companyUuid=&dateFrom=&dateTo=&page=&pageSize=
// 期望回傳: { total: number; page: number; pageSize: number; items: DailyDetailLineDto[] }

import type { DailyDetailLineDto } from '@/api/types';
import { useMemo, useState } from 'react';
import { MOCK_JOURNAL_LINES } from './mockJournalData';

export interface UseJournalOverviewParams {
  dateFrom: string;
  dateTo: string;
  unlimitedDate: boolean;
  page: number;
  pageSize?: number;
}

export interface UseJournalOverviewResult {
  items: DailyDetailLineDto[];
  total: number;
  loading: boolean;
  error: string;
  reload: () => void;
}

/** 日記帳總覽資料取得；目前走 mock（同步），後端 range API 上線後換成非同步 fetch + useState/useEffect */
export function useJournalOverview({ dateFrom, dateTo, unlimitedDate, page, pageSize = 10 }: UseJournalOverviewParams): UseJournalOverviewResult {
  const [reloadKey, setReloadKey] = useState(0);

  const allFiltered = useMemo(() => {
    // reloadKey 作為強制重算的隱式依賴（正式 API 上線後 reload 會重打 fetch）
    void reloadKey;
    if (unlimitedDate) return MOCK_JOURNAL_LINES;
    return MOCK_JOURNAL_LINES.filter(line => {
      // rocDate 民國 YYYMMDD → 西元 YYYYMMDD，與 dateFrom/dateTo 同格式比較
      const rocYear = parseInt(line.rocDate.slice(0, 3), 10);
      const yyyymmdd = `${rocYear + 1911}${line.rocDate.slice(3)}`;
      return yyyymmdd >= dateFrom && yyyymmdd <= dateTo;
    });
  }, [dateFrom, dateTo, unlimitedDate, reloadKey]);

  const start = (page - 1) * pageSize;
  const items = allFiltered.slice(start, start + pageSize);
  const total = allFiltered.length;

  return { items, total, loading: false, error: '', reload: () => setReloadKey(k => k + 1) };
}
