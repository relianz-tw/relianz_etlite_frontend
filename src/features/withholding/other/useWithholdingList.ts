'use client';

import { filterRental, filterWithholdingOther } from '@/api/withholding';
import type { OtherWithholdingCategoryCode } from '@/api/withholding';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useState } from 'react';
import { mapRentalDtoToRecord, mapWithholdingOtherDtoToRecord } from './mapper';
import type { CategoryCode, WithholdingRecord } from './types';
import { SORT_KEY_TO_TYPE } from './urlState';
import type { WithholdingAdvancedFilter, WithholdingSortState } from './urlState';

export interface WithholdingAmountTotals {
  incomeAmount: number;
  withholdingAmount: number;
  nhiAmount: number;
  netPayment: number;
}

const EMPTY_TOTALS: WithholdingAmountTotals = { incomeAmount: 0, withholdingAmount: 0, nhiAmount: 0, netPayment: 0 };

export interface UseWithholdingListParams {
  category: CategoryCode;
  year: number;
  /** 0 = 全部月份 */
  month: number;
  /** 僅比對所得人姓名；後端 filter 的 name／withholdingId 各自獨立參數（AND 而非 OR），
   *  無法安全還原「姓名或扣繳編號」單框模糊搜尋，故此處只送 name，扣繳編號不再支援快速搜尋 */
  query: string;
  advanced: WithholdingAdvancedFilter;
  sort: WithholdingSortState;
  page: number;
  limit: number;
}

export interface UseWithholdingListResult {
  records: WithholdingRecord[];
  loading: boolean;
  error: string;
  /** 回應筆數等於 limit 時視為可能還有下一頁；後端 filter 未回傳篩選後總筆數，無法算出精確總頁數 */
  hasNextPage: boolean;
  /** 本次搜尋（不分頁）金額加總 */
  searchTotals: WithholdingAmountTotals;
  /** 本年度（僅受 paymentYear／paymentMonth 篩選影響）金額加總與筆數 */
  yearlyTotals: WithholdingAmountTotals;
  yearlyTotalCount: number;
  reload: () => void;
}

/**
 * 各類扣繳列表資料取得，依 category 分派到租金或其餘 8 類的 /filter 端點。
 * 9 類（不含租金）與租金的回應加總欄位命名不同（rentAmount／grossIncome／giftAmount），
 * 這裡統一正規化成 incomeAmount，呼叫端（WithholdingListView）不需關心類別差異。
 */
export function useWithholdingList(params: UseWithholdingListParams): UseWithholdingListResult {
  const { category, year, month, query, advanced, sort, page, limit } = params;
  const [records, setRecords] = useState<WithholdingRecord[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
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
  const sortType = SORT_KEY_TO_TYPE[sort.key];
  const trimmedQuery = query.trim();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const commonBody = {
      paymentYear: year,
      paymentMonth: month === 0 ? undefined : month,
      sortType,
      isDesc: sort.dir === 'desc',
      limitCount: limit,
      page,
      name: trimmedQuery || undefined,
      rentAmountMin: minAmount,
      rentAmountMax: maxAmount,
      isRemitWithholding,
      isRemitNhi,
    };

    const request =
      category === '51'
        ? filterRental(commonBody).then(result => ({
            records: result.list.map(mapRentalDtoToRecord),
            search: {
              incomeAmount: result.searchTotalRentAmount,
              withholdingAmount: result.searchTotalWithholdingAmount,
              nhiAmount: result.searchTotalNhiAmount,
              netPayment: result.searchTotalPaymentAmount,
            },
            yearly: {
              incomeAmount: result.yearlyTotalRentAmount,
              withholdingAmount: result.yearlyTotalWithholdingAmount,
              nhiAmount: result.yearlyTotalNhiAmount,
              netPayment: result.yearlyTotalPaymentAmount,
            },
            yearlyCount: result.yearlyTotalCount,
          }))
        : filterWithholdingOther(category as OtherWithholdingCategoryCode, commonBody).then(result => ({
            records: result.list.map(dto => mapWithholdingOtherDtoToRecord(category as OtherWithholdingCategoryCode, dto)),
            search: {
              incomeAmount: result.searchTotalGrossIncome ?? result.searchTotalGiftAmount ?? 0,
              withholdingAmount: result.searchTotalWithholdingAmount,
              nhiAmount: result.searchTotalNhiAmount ?? 0,
              netPayment: result.searchTotalPaymentAmount,
            },
            yearly: {
              incomeAmount: result.yearlyTotalGrossIncome ?? result.yearlyTotalGiftAmount ?? 0,
              withholdingAmount: result.yearlyTotalWithholdingAmount,
              nhiAmount: result.yearlyTotalNhiAmount ?? 0,
              netPayment: result.yearlyTotalPaymentAmount,
            },
            yearlyCount: result.yearlyTotalCount,
          }));

    request
      .then(({ records: rows, search, yearly, yearlyCount }) => {
        if (cancelled) return;
        setRecords(rows);
        setHasNextPage(rows.length === limit);
        setSearchTotals(search);
        setYearlyTotals(yearly);
        setYearlyTotalCount(yearlyCount);
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

  return { records, loading, error, hasNextPage, searchTotals, yearlyTotals, yearlyTotalCount, reload: () => setReloadKey(k => k + 1) };
}
