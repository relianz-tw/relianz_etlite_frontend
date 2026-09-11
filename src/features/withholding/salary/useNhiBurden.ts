'use client';

import { deleteNhiBurdenSummary, fetchNhiBurdenSummary, saveNhiBurdenSummary } from '@/api/withholdingInsurance';
import type { NhiBurdenSummaryDto } from '@/api/types';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useState } from 'react';

export interface UseNhiBurdenSummariesResult {
  /** 1–12 → 該月受僱者投保金額總額；undefined 代表尚未設定或尚未載入完成 */
  burdens: Record<number, NhiBurdenSummaryDto | undefined>;
  loading: boolean;
  /** 新增或更新單月投保總額；成功後回填該月 state（含後端 uuid） */
  save: (year: number, month: number, totalInsuredAmount: number) => Promise<void>;
  /** 刪除單月投保總額紀錄，清空該月 state；該月本來就沒有紀錄時直接視為成功 */
  reset: (month: number) => Promise<void>;
  savingMonth: number | null;
}

/**
 * 公司行號負擔二代健保「受僱者投保金額總額」的年度彙總（只查有薪資資料的月份，比照 usePayrollYearSummaries）。
 * 「應繳納」金額目前無後端計算 API，本 hook 只負責投保總額本身的存取。
 */
export function useNhiBurdenSummaries(year: number, monthsWithData: number[]): UseNhiBurdenSummariesResult {
  const [burdens, setBurdens] = useState<Record<number, NhiBurdenSummaryDto | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [savingMonth, setSavingMonth] = useState<number | null>(null);

  // monthsWithData 由父層依 allsalary 索引算出，內容變動才需要重新查詢
  const monthsKey = monthsWithData.join(',');

  useEffect(() => {
    if (monthsWithData.length === 0) {
      setBurdens({});
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const settled = await Promise.allSettled(monthsWithData.map(month => fetchNhiBurdenSummary({ year, month })));
      if (cancelled) return;
      const next: Record<number, NhiBurdenSummaryDto | undefined> = {};
      settled.forEach((result, idx) => {
        const month = monthsWithData[idx];
        next[month] = result.status === 'fulfilled' ? (result.value ?? undefined) : undefined;
      });
      setBurdens(next);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, monthsKey]);

  const save = async (saveYear: number, month: number, totalInsuredAmount: number) => {
    setSavingMonth(month);
    try {
      await saveNhiBurdenSummary({ year: saveYear, month, totalInsuredAmount });
      // POST 回應 data 為 null，取不到 uuid，重新 GET 一次取得完整紀錄（含後端配發的 uuid）
      const fresh = await fetchNhiBurdenSummary({ year: saveYear, month });
      setBurdens(prev => ({ ...prev, [month]: fresh ?? undefined }));
    } catch (err) {
      throw new Error(getFriendlyErrorMessage(err, '儲存失敗'));
    } finally {
      setSavingMonth(null);
    }
  };

  const reset = async (month: number) => {
    const existing = burdens[month];
    if (!existing) return;
    setSavingMonth(month);
    try {
      await deleteNhiBurdenSummary(existing.uuid);
      setBurdens(prev => ({ ...prev, [month]: undefined }));
    } catch (err) {
      throw new Error(getFriendlyErrorMessage(err, '刪除失敗'));
    } finally {
      setSavingMonth(null);
    }
  };

  return { burdens, loading, save, reset, savingMonth };
}
