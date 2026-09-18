'use client';

import { listWithholdingCodes } from '@/api/withholding';
import type { WithholdingCodeDto } from '@/api/types';
import { useEffect, useState } from 'react';

/**
 * 各類扣繳碼表（GET /ael/withholding/code），type=1 執行業務業別／2 稿費必要費用別／3 其他所得給付項目。
 * 僅掛載時查一次，失敗僅影響下拉選單、不特別呈現錯誤訊息（比照 useLaborDates）。
 */
export function useWithholdingCodes(type: 1 | 2 | 3): { codes: WithholdingCodeDto[]; loading: boolean } {
  const [codes, setCodes] = useState<WithholdingCodeDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listWithholdingCodes(type)
      .then(result => {
        if (!cancelled) setCodes(result);
      })
      .catch(() => {
        // 碼表查詢失敗僅影響下拉選單，不特別呈現錯誤訊息
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  return { codes, loading };
}
