'use client';

import { filterWithholdingSummary } from '@/api/withholding';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useState } from 'react';
import { mapSummaryGroupDtoToRow } from './mapper';
import type { CategoryCode, WithholdingGroupRow } from './types';
import { SUMMARY_SORT_KEY_TO_TYPE } from './urlState';
import type { WithholdingAdvancedFilter, WithholdingSummarySortState } from './urlState';
import type { WithholdingAmountTotals } from './useWithholdingList';

const EMPTY_TOTALS: WithholdingAmountTotals = { incomeAmount: 0, withholdingAmount: 0, nhiAmount: 0, netPayment: 0 };

export interface UseWithholdingSummaryParams {
  /** 'all' 時不帶 incomeType，後端回所有類別各自的彙總列 */
  category: CategoryCode | 'all';
  year: number;
  /** 0 = 全部月份 */
  month: number;
  query: string;
  advanced: WithholdingAdvancedFilter;
  sort: WithholdingSummarySortState;
  page: number;
  limit: number;
}

export interface UseWithholdingSummaryResult {
  groups: WithholdingGroupRow[];
  loading: boolean;
  error: string;
  totalGroupCount: number;
  searchTotals: WithholdingAmountTotals;
  yearlyTotals: WithholdingAmountTotals;
  yearlyTotalCount: number;
  reload: () => void;
}

/** 各類扣繳彙總列表（L1）資料取得：POST /ael/withholding/summary/filter，一個所得人一種類別一列 */
export function useWithholdingSummary(params: UseWithholdingSummaryParams): UseWithholdingSummaryResult {
  const { category, year, month, query, advanced, sort, page, limit } = params;
  const [groups, setGroups] = useState<WithholdingGroupRow[]>([]);
  const [totalGroupCount, setTotalGroupCount] = useState(0);
  const [searchTotals, setSearchTotals] = useState<WithholdingAmountTotals>(EMPTY_TOTALS);
  const [yearlyTotals, setYearlyTotals] = useState<WithholdingAmountTotals>(EMPTY_TOTALS);
  const [yearlyTotalCount, setYearlyTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const minAmount = advanced.minAmount ? Number(advanced.minAmount) : undefined;
  const maxAmount = advanced.maxAmount ? Number(advanced.maxAmount) : undefined;
  const isRemitWithholding = advanced.withholdingPaid ? advanced.withholdingPaid === 'true' : undefined;
  const isRemitNhi = advanced.nhiPaid ? advanced.nhiPaid === 'true' : undefined;
  const sortType = SUMMARY_SORT_KEY_TO_TYPE[sort.key];
  const trimmedQuery = query.trim();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    filterWithholdingSummary({
      paymentYear: year,
      paymentMonth: month === 0 ? undefined : month,
      incomeType: category === 'all' ? undefined : category,
      name: trimmedQuery || undefined,
      amountMin: minAmount,
      amountMax: maxAmount,
      isRemitWithholding,
      isRemitNhi,
      sortType,
      isDesc: sort.dir === 'desc',
      page,
      limitCount: limit,
    })
      .then(result => {
        if (cancelled) return;
        setGroups(result.list.map(mapSummaryGroupDtoToRow));
        setTotalGroupCount(result.searchTotalGroupCount);
        setSearchTotals({
          incomeAmount: result.searchTotalGrossIncome,
          withholdingAmount: result.searchTotalWithholdingAmount,
          nhiAmount: result.searchTotalNhiAmount,
          netPayment: result.searchTotalPaymentAmount,
        });
        setYearlyTotals({
          incomeAmount: result.yearlyTotalGrossIncome,
          withholdingAmount: result.yearlyTotalWithholdingAmount,
          nhiAmount: result.yearlyTotalNhiAmount,
          netPayment: result.yearlyTotalPaymentAmount,
        });
        setYearlyTotalCount(result.yearlyTotalCount);
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
  }, [category, year, month, trimmedQuery, minAmount, maxAmount, isRemitWithholding, isRemitNhi, sortType, sort.dir, page, limit, reloadKey]);

  return { groups, loading, error, totalGroupCount, searchTotals, yearlyTotals, yearlyTotalCount, reload: () => setReloadKey(k => k + 1) };
}
