'use client';

import { useMemo } from 'react';
import { useInitialization } from '../../state/InitializationContext';
import type { ReportField, ReportKey } from '../../state/initializationReducer';
import type { ReportPageDef } from '../../reports/types';
import type { PaperStore } from './PaperStore';

const EMPTY_FIELD: ReportField = { value: '', aiFilled: false };

/** 區塊列數超過此數量，且已有辨識帶入的值時，沒有值的列預設收合 */
const COLLAPSE_THRESHOLD = 12;

/** 開帳精靈用的 PaperStore：讀寫 InitializationContext 裡該頁（reportId）的欄位與可重複列 */
export function useInitPaperStore(reportId: ReportKey, page: ReportPageDef | null): PaperStore | null {
  const { state, dispatch } = useInitialization();
  const report = state.reports[reportId];

  return useMemo(() => {
    if (!page) return null;
    const fields = report?.fields ?? {};
    return {
      page,
      get: key => fields[key] ?? EMPTY_FIELD,
      set: (key, value) => dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId, key, value } }),
      rows: report?.rows ?? [],
      addRow: columns => dispatch({ type: 'ADD_REPORT_ROW', payload: { reportId, columns } }),
      removeRow: index => dispatch({ type: 'REMOVE_REPORT_ROW', payload: { reportId, index } }),
      setRowField: (index, key, value) => dispatch({ type: 'SET_REPORT_ROW_FIELD', payload: { reportId, index, key, value } }),
      isFilled: field => {
        const value = fields[field.key]?.value;
        return value !== undefined && value !== '' && Number(value) !== 0;
      },
      collapseThreshold: COLLAPSE_THRESHOLD,
      // 沒有辨識帶入時使用者可能要逐欄手填，不收合
      canCollapse: Object.values(fields).some(f => f.aiFilled),
    };
  }, [page, report, reportId, dispatch]);
}
