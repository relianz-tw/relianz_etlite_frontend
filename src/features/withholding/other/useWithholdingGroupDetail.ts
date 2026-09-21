'use client';

import { filterWithholdingGroup } from '@/api/withholding';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useState } from 'react';
import { mapSummaryGroupDtoToRow, mapWithholdingDetailToRecord } from './mapper';
import type { CategoryCode, WithholdingGroupRow, WithholdingRecord } from './types';
import { SORT_KEY_TO_TYPE } from './urlState';
import type { WithholdingSortState } from './urlState';
import type { WithholdingAmountTotals } from './useWithholdingList';

const EMPTY_TOTALS: WithholdingAmountTotals = { incomeAmount: 0, withholdingAmount: 0, nhiAmount: 0, netPayment: 0 };

export interface UseWithholdingGroupDetailParams {
  groupKey: string;
  categoryCode: CategoryCode;
  year: number;
  /** 0 = 全部月份 */
  month: number;
  sort: WithholdingSortState;
  page: number;
  limit: number;
}

export interface UseWithholdingGroupDetailResult {
  group: WithholdingGroupRow | undefined;
  records: WithholdingRecord[];
  loading: boolean;
  error: string;
  totalCount: number;
  searchTotals: WithholdingAmountTotals;
  reload: () => void;
}

/** 單一群組（同一所得人同一類別）內的明細列表（L2）：POST /ael/withholding/summary/group/filter */
export function useWithholdingGroupDetail(params: UseWithholdingGroupDetailParams): UseWithholdingGroupDetailResult {
  const { groupKey, categoryCode, year, month, sort, page, limit } = params;
  const [group, setGroup] = useState<WithholdingGroupRow | undefined>(undefined);
  const [records, setRecords] = useState<WithholdingRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTotals, setSearchTotals] = useState<WithholdingAmountTotals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const sortType = SORT_KEY_TO_TYPE[sort.key];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    filterWithholdingGroup({
      incomeType: categoryCode,
      groupKey,
      paymentYear: year,
      paymentMonth: month === 0 ? undefined : month,
      sortType,
      isDesc: sort.dir === 'desc',
      page,
      limitCount: limit,
    })
      .then(result => {
        if (cancelled) return;
        setGroup(mapSummaryGroupDtoToRow(result.group));
        setRecords(result.list.map(dto => mapWithholdingDetailToRecord(categoryCode, dto)));
        setTotalCount(result.searchTotalCount);
        setSearchTotals({
          incomeAmount: result.searchTotalGrossIncome,
          withholdingAmount: result.searchTotalWithholdingAmount,
          nhiAmount: result.searchTotalNhiAmount,
          netPayment: result.searchTotalPaymentAmount,
        });
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
  }, [groupKey, categoryCode, year, month, sortType, sort.dir, page, limit, reloadKey]);

  return { group, records, loading, error, totalCount, searchTotals, reload: () => setReloadKey(k => k + 1) };
}
