'use client';

import { fetchLabourList, fetchLabourListAllSignStatus, listLabourDates } from '@/api/labour';
import type { LabourDateDto, LabourFilterBody, LabourFormDto } from '@/api/types';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useMemo, useState } from 'react';
import { mapLabourDtoToRecord } from './data';
import { getLaborLocalExtras } from './localExtras';
import type { LaborRecord } from './types';

export type SignFilter = 'all' | 'signed' | 'unsigned';

export type LaborSearchFilters = Partial<
  Pick<
    LabourFilterBody,
    | 'name'
    | 'serviceName'
    | 'payableAmountMin'
    | 'payableAmountMax'
    | 'withholdingTaxMin'
    | 'withholdingTaxMax'
    | 'secondHealthInsuranceFeeMin'
    | 'secondHealthInsuranceFeeMax'
    | 'serviceDateStart'
    | 'serviceDateEnd'
    | 'paymentDateStart'
    | 'paymentDateEnd'
  >
>;

/** 公司有資料的勞務提供年月，供列表年／月下拉選單使用；僅掛載時查一次（GET /ael/labour/date） */
export function useLaborDates(): { dates: LabourDateDto[]; loading: boolean } {
  const [dates, setDates] = useState<LabourDateDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listLabourDates()
      .then(result => {
        if (!cancelled) setDates(result);
      })
      .catch(() => {
        // 年月下拉查詢失敗僅影響選單，不特別呈現錯誤訊息
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { dates, loading };
}

export interface UseLaborListParams {
  year: number;
  /** 0 = 全年 */
  month: number;
  signFilter: SignFilter;
  filters: LaborSearchFilters;
  /** year 尚未確定（如年月下拉未載入完成）時傳 false，暫不查詢 */
  enabled?: boolean;
}

export interface UseLaborListResult {
  records: LaborRecord[];
  loading: boolean;
  error: string;
  reload: () => void;
  /** 列表內就地更新單筆資料（如付款日樂觀更新），不觸發整批重新查詢 */
  patchRecord: (uuid: string, patch: Partial<LaborRecord>) => void;
}

/**
 * 勞報單主列表資料取得（POST /ael/labour/data/filter）。
 * signFilter 為 'all' 時因後端 isSign 必填，改由 fetchLabourListAllSignStatus 分兩次查詢再合併。
 */
export function useLaborList({ year, month, signFilter, filters, enabled = true }: UseLaborListParams): UseLaborListResult {
  const [dtos, setDtos] = useState<LabourFormDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [localPatches, setLocalPatches] = useState<Record<string, Partial<LaborRecord>>>({});
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    if (!enabled) {
      setLoading(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    const body: Omit<LabourFilterBody, 'companyUuid' | 'isSign'> = { year, month: month === 0 ? undefined : month, ...filters };
    const request = signFilter === 'all' ? fetchLabourListAllSignStatus(body) : fetchLabourList({ ...body, isSign: signFilter === 'signed' });
    request
      .then(list => {
        if (cancelled) return;
        setDtos(list);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, year, month, signFilter, filtersKey, reloadKey]);

  const records = useMemo(
    () => dtos.map(dto => ({ ...mapLabourDtoToRecord(dto, getLaborLocalExtras(dto.labourUuid)), ...localPatches[dto.labourUuid] })),
    [dtos, localPatches],
  );

  return {
    records,
    loading,
    error,
    reload: () => setReloadKey(k => k + 1),
    patchRecord: (uuid, patch) => setLocalPatches(prev => ({ ...prev, [uuid]: { ...prev[uuid], ...patch } })),
  };
}
