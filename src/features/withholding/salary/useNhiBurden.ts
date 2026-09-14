'use client';

import {
  calculateNhiBurdenMonth,
  deleteNhiBurdenSummary,
  fetchNhiBurdenPdfUrl,
  fetchNhiBurdenSummary,
  generateNhiBurdenPdf,
  saveNhiBurdenSummary,
} from '@/api/withholdingInsurance';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useState } from 'react';

export interface NhiBurdenMonthState {
  uuid?: string;
  /** 受僱者投保金額總額 */
  totalInsuredAmount?: number;
  /** 應繳納金額（calculateMonthlyRemain）；undefined 代表尚未設定投保總額或試算失敗 */
  amount?: number;
  pdfUrl?: string;
}

export interface UseNhiBurdenSummariesResult {
  /** 1–12 → 該月狀態；undefined 代表尚未設定投保總額 */
  burdens: Record<number, NhiBurdenMonthState | undefined>;
  loading: boolean;
  /** 新增或更新單月投保總額，成功後重新試算應繳納金額 */
  save: (year: number, month: number, totalInsuredAmount: number) => Promise<void>;
  /** 刪除單月投保總額紀錄，清空該月狀態（不影響已產生的繳款書紀錄）；該月本來就沒有紀錄時直接視為成功 */
  reset: (month: number) => Promise<void>;
  /** 依目前試算出的應繳納金額產生繳款書 */
  generatePdf: (year: number, month: number) => Promise<void>;
  savingMonth: number | null;
  generatingMonth: number | null;
}

/** 查詢單月投保總額，若已設定則接著試算應繳納金額與查詢已產生的繳款書 URL，三者皆查無資料時回傳 undefined */
async function loadMonthState(year: number, month: number): Promise<NhiBurdenMonthState | undefined> {
  const burden = await fetchNhiBurdenSummary({ year, month });
  if (!burden) return undefined;

  let amount: number | undefined;
  try {
    amount = (await calculateNhiBurdenMonth({ year, month })).calculateMonthlyRemain;
  } catch {
    amount = undefined;
  }

  const pdfUrl = (await fetchNhiBurdenPdfUrl({ year, month }).catch(() => null)) ?? undefined;

  return { uuid: burden.uuid, totalInsuredAmount: burden.totalInsuredAmount, amount, pdfUrl };
}

/**
 * 公司行號負擔二代健保的年度彙總（只查有薪資資料的月份，比照 usePayrollYearSummaries）。
 * 涵蓋投保總額存取、應繳納金額試算（POST calculate/month）、繳款書產生與查詢。
 */
export function useNhiBurdenSummaries(year: number, monthsWithData: number[]): UseNhiBurdenSummariesResult {
  const [burdens, setBurdens] = useState<Record<number, NhiBurdenMonthState | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [savingMonth, setSavingMonth] = useState<number | null>(null);
  const [generatingMonth, setGeneratingMonth] = useState<number | null>(null);

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
      const settled = await Promise.allSettled(monthsWithData.map(month => loadMonthState(year, month)));
      if (cancelled) return;
      const next: Record<number, NhiBurdenMonthState | undefined> = {};
      settled.forEach((result, idx) => {
        const month = monthsWithData[idx];
        next[month] = result.status === 'fulfilled' ? result.value : undefined;
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
      // 儲存後投保總額已變動，重新查一次完整狀態（含重新試算的應繳納金額），保留既有 pdfUrl 不動
      const fresh = await loadMonthState(saveYear, month);
      setBurdens(prev => ({ ...prev, [month]: fresh ? { ...fresh, pdfUrl: prev[month]?.pdfUrl } : undefined }));
    } catch (err) {
      throw new Error(getFriendlyErrorMessage(err, '儲存失敗'));
    } finally {
      setSavingMonth(null);
    }
  };

  const reset = async (month: number) => {
    const existing = burdens[month];
    if (!existing?.uuid) return;
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

  const generatePdf = async (genYear: number, month: number) => {
    const state = burdens[month];
    if (!state?.amount || state.amount <= 0) return;
    setGeneratingMonth(month);
    try {
      const result = await generateNhiBurdenPdf({ year: genYear, month, amount: state.amount });
      setBurdens(prev => ({ ...prev, [month]: prev[month] ? { ...prev[month]!, pdfUrl: result.pdfFileUrl } : prev[month] }));
    } catch (err) {
      throw new Error(getFriendlyErrorMessage(err, '產生繳款書失敗'));
    } finally {
      setGeneratingMonth(null);
    }
  };

  return { burdens, loading, save, reset, generatePdf, savingMonth, generatingMonth };
}
