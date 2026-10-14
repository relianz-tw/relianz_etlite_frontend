'use client';

import { getFormMetadata, type FormMetadata } from '@/api/peit';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { buildReportPage } from '../reports';
import { useEffect, useMemo, useState } from 'react';

// metadata 依 formNo + 民國年固定不變，模組層快取避免上一頁／下一頁來回切換時重複打 API
const metadataCache = new Map<string, FormMetadata>();

/** 依文件編號與民國年取得該表欄位定義並組成畫面用的 ReportPageDef；切換年度（如辨識後）會自動重撈 */
export function useFormMetadata(formNo: number, taxYear: number) {
  const key = `${formNo}-${taxYear}`;
  const [, forceRender] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const meta = metadataCache.get(key) ?? null;

  useEffect(() => {
    if (metadataCache.has(key)) return;
    let cancelled = false;
    setError(null);
    getFormMetadata(formNo, taxYear)
      .then(data => {
        metadataCache.set(key, data);
        if (!cancelled) forceRender(n => n + 1);
      })
      .catch(err => {
        if (!cancelled) setError(getFriendlyErrorMessage(err, '表單欄位載入失敗，請重試'));
      });
    return () => {
      cancelled = true;
    };
  }, [key, formNo, taxYear, retryCount]);

  const page = useMemo(() => (meta ? buildReportPage(meta) : null), [meta]);

  return { page, loading: !page && !error, error: page ? null : error, retry: () => setRetryCount(n => n + 1) };
}
