'use client';

import { deleteSalaryMonth, fetchAllSalary, fetchSalaryDeclareMonth, fetchSalaryMonth, saveSalaryRow } from '@/api/salary';
import type { SaveSalaryBody } from '@/api/types';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useMemo, useState } from 'react';
import { mapSalaryRowsToPayrollItems } from './salaryMapper';
import type { Employee, PayrollItem, PayrollMonthSummary } from './types';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export interface UsePayrollMonthResult {
  items: PayrollItem[];
  /** 後端已有薪資列的員工 id；不在此集合中的在職員工視為本月尚未新增 */
  existingEmployeeIds: Set<number>;
  missingFieldsByEmployee: Map<number, string[]>;
  droppedRowCount: number;
  loading: boolean;
  error: string;
  reload: () => void;
}

/**
 * 取得指定年月的薪資明細（取代 mockStore 的 getPayrollMonth）。
 * activeEmployeesLoading 為 true 時暫不查詢，待員工清單就緒後才一併 mapping（見 salaryMapper）。
 */
export function usePayrollMonth(year: number, month: number, activeEmployees: Employee[], activeEmployeesLoading: boolean): UsePayrollMonthResult {
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [missingFieldsByEmployee, setMissingFieldsByEmployee] = useState<Map<number, string[]>>(new Map());
  const [droppedRowCount, setDroppedRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (activeEmployeesLoading) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchSalaryMonth({ year, month })
      .then(result => {
        if (cancelled) return;
        const mapped = mapSalaryRowsToPayrollItems(result.byPaymentDate, activeEmployees);
        setItems(mapped.items);
        setMissingFieldsByEmployee(mapped.missingFieldsByEmployee);
        setDroppedRowCount(mapped.droppedRowCount);
        if (mapped.unmappedKeys.length > 0) {
          // 開發階段提醒：後端欄位對照有落差，正式環境不對使用者顯示技術細節
          console.warn('[usePayrollMonth] 薪資列欄位對照落差：', mapped.unmappedKeys);
        }
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
    // activeEmployees 只在 useActiveEmployees 首次載入完成時變動一次，故不列入 deps 以免重複查詢
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, activeEmployeesLoading, reloadKey]);

  const existingEmployeeIds = useMemo(() => new Set(items.map(i => i.employeeId)), [items]);

  return {
    items,
    existingEmployeeIds,
    missingFieldsByEmployee,
    droppedRowCount,
    loading,
    error,
    reload: () => setReloadKey(k => k + 1),
  };
}

export interface UsePayrollYearSummariesResult {
  /** 1–12 → 該月統計；undefined 代表該月無薪資資料或統計尚未載入 */
  summaries: Record<number, PayrollMonthSummary | undefined>;
  /** 1–12 → 該月薪資列筆數，來自 allsalary 索引（僅用陣列長度，不做金額加總） */
  counts: Record<number, number>;
  /** 1–12 → 該月統計載入失敗訊息 */
  monthErrors: Record<number, string>;
  loading: boolean;
  error: string;
  reload: () => void;
}

function countMonthRows(byMonth: Record<string, Record<string, unknown>>, month: number): number {
  const key = String(month).padStart(2, '0');
  const group = byMonth[key] ?? byMonth[String(month)];
  if (!group) return 0;
  return Object.values(group).reduce((sum: number, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0);
}

/**
 * 12 個月的彙總統計（取代 mockStore.getPayrollMonth + summarizeMonth）。
 * 策略：先打一次 allsalary 當索引找出哪幾個月有資料（純陣列長度，不加總金額），
 * 只對有資料的月份併發打 declare/month 取得四個由後端算好的統計數字，避免前端自行加總。
 */
export function usePayrollYearSummaries(year: number): UsePayrollYearSummariesResult {
  const [summaries, setSummaries] = useState<Record<number, PayrollMonthSummary | undefined>>({});
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [monthErrors, setMonthErrors] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setSummaries({});
    setCounts({});
    setMonthErrors({});

    (async () => {
      let monthsWithData: number[] = [];
      try {
        const all = await fetchAllSalary(year);
        const nextCounts: Record<number, number> = {};
        for (const m of MONTHS) {
          const count = countMonthRows(all.byMonth, m);
          if (count > 0) {
            monthsWithData.push(m);
            nextCounts[m] = count;
          }
        }
        if (cancelled) return;
        setCounts(nextCounts);
      } catch (err) {
        if (!cancelled) {
          setError(getFriendlyErrorMessage(err));
          setLoading(false);
        }
        return;
      }

      const settled = await Promise.allSettled(monthsWithData.map(m => fetchSalaryDeclareMonth({ year, month: m })));
      if (cancelled) return;
      const nextSummaries: Record<number, PayrollMonthSummary | undefined> = {};
      const nextErrors: Record<number, string> = {};
      settled.forEach((result, idx) => {
        const m = monthsWithData[idx];
        if (result.status === 'fulfilled') {
          nextSummaries[m] = result.value;
        } else {
          nextErrors[m] = getFriendlyErrorMessage(result.reason, '統計載入失敗');
        }
      });
      setSummaries(nextSummaries);
      setMonthErrors(nextErrors);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [year, reloadKey]);

  return { summaries, counts, monthErrors, loading, error, reload: () => setReloadKey(k => k + 1) };
}

export interface SaveSalaryRowInput {
  employeeId: number;
  name: string;
  body: Omit<SaveSalaryBody, 'companyUuid'>;
}

export interface SaveSalaryRowFailure {
  employeeId: number;
  name: string;
  message: string;
}

export interface SavePayrollMonthResult {
  succeeded: number[];
  failed: SaveSalaryRowFailure[];
}

/** 批次 Upsert 一個月的薪資列（取代 mockStore.savePayrollMonth）；呼叫端只傳有異動過的列 */
export function useSavePayrollMonth(): { save: (rows: SaveSalaryRowInput[]) => Promise<SavePayrollMonthResult>; saving: boolean } {
  const [saving, setSaving] = useState(false);

  const save = async (rows: SaveSalaryRowInput[]): Promise<SavePayrollMonthResult> => {
    setSaving(true);
    try {
      const settled = await Promise.allSettled(rows.map(row => saveSalaryRow(row.body).then(() => row.employeeId)));
      const succeeded: number[] = [];
      const failed: SaveSalaryRowFailure[] = [];
      settled.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          succeeded.push(result.value);
        } else {
          failed.push({ employeeId: rows[idx].employeeId, name: rows[idx].name, message: getFriendlyErrorMessage(result.reason) });
        }
      });
      return { succeeded, failed };
    } finally {
      setSaving(false);
    }
  };

  return { save, saving };
}

/** 整月批次刪除薪資列（DELETE /ael/salary/month，2026-09-11 後端新增，原子操作，取代舊版逐筆刪除） */
export function useDeletePayrollMonth(): { deleteMonth: (year: number, month: number) => Promise<number>; deleting: boolean } {
  const [deleting, setDeleting] = useState(false);

  const deleteMonth = async (year: number, month: number): Promise<number> => {
    setDeleting(true);
    try {
      const result = await deleteSalaryMonth({ year, month });
      return result.deletedCount;
    } finally {
      setDeleting(false);
    }
  };

  return { deleteMonth, deleting };
}
