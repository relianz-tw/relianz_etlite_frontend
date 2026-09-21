'use client';

import { getWithholdingDetail } from '@/api/withholding';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import GeneralForm from './components/GeneralForm';
import RentalForm from './components/RentalForm';
import { mapWithholdingDetailToRecord } from './mapper';
import type { CategoryCode, WithholdingRecord } from './types';
import { resolveWithholdingBackHref } from './urlState';

interface WithholdingFormViewProps {
  /** 提供時為編輯模式；此時網址須帶 ?ic=<類別代碼>（由列表點擊或新增流程帶入），
   *  用於決定該打哪一支明細查詢／更新 API，見下方 categoryCode */
  recordId?: string;
}

/**
 * 依 ?ic= 類別代碼派發到租金專屬表單或其餘 8 類共用的通用表單；
 * 編輯模式在此統一以 GET /ael/withholding/detail 取得單筆資料後再往下傳，
 * 不比照原專案（relianz_cashflow_frontend）撈整批列表再前端 find。
 */
export default function WithholdingFormView({ recordId }: WithholdingFormViewProps) {
  const searchParams = useSearchParams();
  const categoryCode = (searchParams.get('ic') as CategoryCode | null) ?? '9A';
  // 來源可能是彙總列表（L1）或群組明細（L2），?from= 帶完整返回路徑，沒有時退回 L1 首頁
  const backHref = resolveWithholdingBackHref(searchParams.get('from') ?? undefined);

  const [record, setRecord] = useState<WithholdingRecord | undefined>(undefined);
  const [loading, setLoading] = useState(Boolean(recordId));
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!recordId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    getWithholdingDetail(recordId, categoryCode)
      .then(dto => {
        if (!cancelled) setRecord(mapWithholdingDetailToRecord(categoryCode, dto));
      })
      .catch(err => {
        if (!cancelled) setError(getFriendlyErrorMessage(err, '找不到此扣繳資料'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId, categoryCode, reloadKey]);

  if (recordId && loading) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white text-sm text-neutral-mid">載入中...</div>;
  }
  if (recordId && (error || !record)) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white text-sm text-neutral-mid">{error || '找不到此扣繳資料'}</div>;
  }

  const onReload = () => setReloadKey(k => k + 1);

  if (categoryCode === '51') {
    return <RentalForm recordId={recordId} record={record} onReload={onReload} backHref={backHref} />;
  }
  return <GeneralForm recordId={recordId} categoryCode={categoryCode} record={record} onReload={onReload} backHref={backHref} />;
}
