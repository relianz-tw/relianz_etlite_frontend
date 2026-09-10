'use client';

import { fetchEmployees, fetchSalaryYearMonths, getEmployeeById } from '@/api/employee';
import { fetchInsuranceGrades, fetchNhiHeadMinGrade } from '@/api/insurance';
import type { EmployeeListResult, InsuranceGradeDto } from '@/api/types';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useMemo, useState } from 'react';
import { fallbackAvailableYears, mapEmployeeDto } from './data';
import type { Employee } from './types';

const ACTIVE_STATUS = 1;

export interface UseEmployeeListParams {
  /** 'all' | 'active' | 'inactive' */
  status: 'all' | 'active' | 'inactive';
  search: string;
  page: number;
  pageSize: number;
}

export interface UseEmployeeListResult {
  employees: Employee[];
  pagination: EmployeeListResult['pagination'];
  loading: boolean;
  error: string;
  reload: () => void;
}

/** 員工列表查詢，搜尋／狀態／換頁皆由後端處理（見 EmployeeListView.tsx 的 400ms debounce） */
export function useEmployeeList({ status, search, page, pageSize }: UseEmployeeListParams): UseEmployeeListResult {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<EmployeeListResult['pagination']>({ page, pageSize, totalSize: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchEmployees({
      employmentStatus: status === 'all' ? undefined : status === 'active' ? 1 : 0,
      search: search || undefined,
      page,
      pageSize,
    })
      .then(result => {
        if (cancelled) return;
        setEmployees(result.list.map(mapEmployeeDto));
        setPagination(result.pagination);
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
  }, [status, search, page, pageSize, reloadKey]);

  return { employees, pagination, loading, error, reload: () => setReloadKey(k => k + 1) };
}

export interface UseEmployeeResult {
  employee: Employee | undefined;
  loading: boolean;
  error: string;
}

/** 單筆員工查詢，供編輯頁使用；id 為 undefined 時視為新增模式，不查詢 */
export function useEmployee(id: number | undefined): UseEmployeeResult {
  const [employee, setEmployee] = useState<Employee | undefined>(undefined);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    getEmployeeById(id)
      .then(dto => {
        if (!cancelled) setEmployee(mapEmployeeDto(dto));
      })
      .catch(err => {
        if (!cancelled) setError(getFriendlyErrorMessage(err, '找不到此員工資料'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { employee, loading, error };
}

/** 在職員工全量清單，供薪資明細頁對照使用（pageSize 帶大值一次取回，不分頁） */
export function useActiveEmployees(): { employees: Employee[]; loading: boolean } {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchEmployees({ employmentStatus: ACTIVE_STATUS, page: 1, pageSize: 1000 })
      .then(result => {
        if (!cancelled) setEmployees(result.list.map(mapEmployeeDto));
      })
      .catch(() => {
        // 薪資明細頁的員工清單查詢失敗僅影響對照，不特別呈現錯誤訊息
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { employees, loading };
}

export interface UseInsuranceGradesResult {
  laborGrades: InsuranceGradeDto[];
  laborPensionGrades: InsuranceGradeDto[];
  nhiGrades: InsuranceGradeDto[];
  loading: boolean;
}

/** 指定西元年的健保／勞保／勞退投保級距全表，供員工表單下拉使用 */
export function useInsuranceGrades(year: number): UseInsuranceGradesResult {
  const [grades, setGrades] = useState<Omit<UseInsuranceGradesResult, 'loading'>>({ laborGrades: [], laborPensionGrades: [], nhiGrades: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchInsuranceGrades(year)
      .then(result => {
        if (!cancelled) setGrades(result);
      })
      .catch(() => {
        // 級距查詢失敗僅影響下拉選單，不特別呈現錯誤訊息
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  return useMemo(() => ({ ...grades, loading }), [grades, loading]);
}

export interface UseNhiHeadMinGradeResult {
  /** 負責人健保投保最低金額（門檻＝已投保員工中的最高投保金額）；enabled 為 false 或查詢失敗時為 null */
  minAmount: number | null;
  loading: boolean;
}

/** 負責人健保投保最低級距金額，只在 enabled（表單勾選「此人為公司負責人」）為 true 時查詢 */
export function useNhiHeadMinGrade(year: number, enabled: boolean): UseNhiHeadMinGradeResult {
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setMinAmount(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchNhiHeadMinGrade(year)
      .then(result => {
        if (!cancelled) setMinAmount(result);
      })
      .catch(() => {
        // 負責人最低健保投保金額查詢失敗僅影響下拉篩選與提示文字，不特別呈現錯誤訊息
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, enabled]);

  return { minAmount, loading };
}

/**
 * 有薪資資料的可選年度（西元年，降冪排序），來源 GET /ael/employee/form。
 * 一律確保當年度在清單中（即使該年還沒有任何薪資資料），讓使用者能建立第一筆。
 * 查詢中或查詢失敗時回傳 fallbackAvailableYears()（近三年）。
 */
export function useAvailableYears(): { years: number[]; loading: boolean } {
  const [years, setYears] = useState<number[]>(fallbackAvailableYears());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchSalaryYearMonths()
      .then(result => {
        if (cancelled) return;
        const currentYear = new Date().getFullYear();
        const uniqueYears = [...new Set([currentYear, ...result.map(m => m.year)])].sort((a, b) => b - a);
        setYears(uniqueYears);
      })
      .catch(() => {
        // 年月下拉查詢失敗時維持 fallbackAvailableYears() 的初始值，不特別呈現錯誤
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { years, loading };
}
