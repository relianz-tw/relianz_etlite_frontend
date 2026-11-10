'use client';

import { getFormMetadata } from '@/api/peit';
import type { VatCompareDiff } from '@/api/peit';
import { buildReportPage } from '@/features/initialization/reports';
import type { ReportFieldDef, ReportPageDef } from '@/features/initialization/reports';
import { PaperForm } from '@/features/initialization/components/paper/PaperForm';
import type { PaperStore } from '@/features/initialization/components/paper/PaperStore';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { cn, formatTWD } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { hasDelta } from './derive';

/** 申報書類型 → GET /ael/peit/form/metadata 的 formNo（11＝401、12＝403） */
const FORM_NO: Record<string, number> = { '401': 11, '403': 12 };

/** 同一年度、同一種申報書的欄位排版只取一次；失敗時移除快取，下次重試 */
const pageCache = new Map<string, Promise<ReportPageDef>>();
function loadPage(formKind: string, taxYear: number): Promise<ReportPageDef> {
  const key = `${formKind}-${taxYear}`;
  let promise = pageCache.get(key);
  if (!promise) {
    promise = getFormMetadata(FORM_NO[formKind], taxYear).then(buildReportPage);
    promise.catch(() => pageCache.delete(key));
    pageCache.set(key, promise);
  }
  return promise;
}

/** 比例欄位（0–1 小數）以百分比顯示，其餘為金額元 */
const formatValue = (field: ReportFieldDef, value: number | null): string => {
  if (value === null) return '—';
  return field.type === 'decimal' ? `${(value * 100).toFixed(2)}%` : formatTWD(value);
};

const formatDelta = (field: ReportFieldDef, d: VatCompareDiff): string => {
  if (d.delta === null) return '—';
  if (!hasDelta(d)) return '0';
  return `${d.delta > 0 ? '+' : '−'}${formatValue(field, Math.abs(d.delta))}`;
};

/** 一個欄位的「帳簿試算｜已申報｜差額」三個數字，直向排列，列與表格格子共用 */
function CompareCells({ field, diff }: { field: ReportFieldDef; diff: VatCompareDiff }) {
  const changed = hasDelta(diff);
  const line = 'flex items-baseline justify-between gap-2';
  return (
    <div className={cn('flex min-w-[120px] flex-col gap-0.5 rounded-md px-2 py-1 text-[13px] tabular-nums', changed && 'bg-brand-tan/10')}>
      <span className={line}>
        <span className='text-xs text-neutral-mid'>帳簿試算</span>
        <span className='text-neutral-dark'>{formatValue(field, diff.invoiceValue)}</span>
      </span>
      <span className={line}>
        <span className='text-xs text-neutral-mid'>已申報</span>
        <span className='text-neutral-dark'>{formatValue(field, diff.filedValue)}</span>
      </span>
      <span className={line}>
        <span className='text-xs text-neutral-mid'>差額</span>
        <span className={changed ? 'font-bold text-neutral-dark' : 'text-neutral-mid'}>{formatDelta(field, diff)}</span>
      </span>
    </div>
  );
}

interface CompareFormViewProps {
  /** 401 或 403 */
  formKind: string;
  taxYear: number;
  diffs: VatCompareDiff[];
}

const EMPTY_FIELD = { value: '', aiFilled: false };
const noop = () => {};

/**
 * 比對表：與開帳 401／403 表單共用同一套紙本對照版面（PaperForm），每個欄位改為
 * 「帳簿試算｜已申報｜差額」三個唯讀數字。區塊、表格、列配對都取自 metadata，數字一律用 compare 回傳值，前端不加總。
 */
export default function CompareFormView({ formKind, taxYear, diffs }: CompareFormViewProps) {
  const [page, setPage] = useState<ReportPageDef | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setPage(null);
    setError('');
    loadPage(formKind, taxYear)
      .then(p => !cancelled && setPage(p))
      .catch(err => !cancelled && setError(getFriendlyErrorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [formKind, taxYear]);

  const store = useMemo<PaperStore | null>(() => {
    if (!page) return null;
    const diffMap = new Map(diffs.map(d => [d.fieldCode, d]));
    return {
      page,
      get: () => EMPTY_FIELD,
      set: noop,
      rows: [],
      addRow: noop,
      removeRow: noop,
      setRowField: noop,
      // 帳簿與申報皆為 0／空且沒有差額的欄位視為沒有數字，預設收合避免上百列雜訊
      isFilled: field => {
        const d = diffMap.get(field.key);
        return !!d && (d.invoiceValue !== 0 || (d.filedValue ?? 0) !== 0 || hasDelta(d));
      },
      collapseThreshold: 0,
      canCollapse: true,
      // 只列 compare 有回傳的欄位
      renderValue: field => {
        const d = diffMap.get(field.key);
        return d ? <CompareCells field={field} diff={d} /> : null;
      },
      valueWidthClass: '170px',
    };
  }, [page, diffs]);

  if (error) return <div className='rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error'>{error}</div>;
  if (!page || !store) return <div className='rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid'>載入中…</div>;

  return <PaperForm sections={page.sections} store={store} />;
}
