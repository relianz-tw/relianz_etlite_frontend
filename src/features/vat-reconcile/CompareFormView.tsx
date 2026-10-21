'use client';

import { getFormMetadata } from '@/api/peit';
import type { VatCompareDiff } from '@/api/peit';
import { buildReportPage } from '@/features/initialization/reports';
import type { ReportFieldDef, ReportPageDef } from '@/features/initialization/reports';
import { buildRows, pairHeads } from '@/features/initialization/reports/vatRows';
import type { VatRow } from '@/features/initialization/reports/vatRows';
import { VAT_BLOCKS } from '@/features/initialization/reports/vatSectionTitles';
import type { VatPartDef } from '@/features/initialization/reports/vatSectionTitles';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { cn, formatTWD } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { hasDelta } from './derive';

/** 申報書類型 → GET /ael/peit/form/metadata 的 formNo（11＝401、12＝403） */
const FORM_NO: Record<string, number> = { '401': 11, '403': 12 };

/** 對帳只涉及金額欄位，這幾個大區塊（營業人資料、附件與申辦）沒有可比對的欄位，不列 */
const COMPARE_BLOCK_TITLES = ['銷項', '進項', '稅額計算'];

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

const isAmountField = (f: ReportFieldDef) => f.type === 'money' || f.type === 'integer' || f.type === 'decimal';

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

/** 該列是否完全沒有數字（帳簿與申報皆為 0／空）：預設收合，避免上百列雜訊 */
const isRowEmpty = (row: VatRow, diffs: Map<string, VatCompareDiff>) =>
  [row.main, row.tax].every(f => {
    const d = f && diffs.get(f.key);
    return !d || (d.invoiceValue === 0 && (d.filedValue ?? 0) === 0 && !hasDelta(d));
  });

const rowHasDelta = (row: VatRow, diffs: Map<string, VatCompareDiff>) =>
  [row.main, row.tax].some(f => {
    const d = f && diffs.get(f.key);
    return !!d && hasDelta(d);
  });

/** 圈號 chip（與開帳 401／403 表單一致）；沒有圈號時留白佔位讓數字對齊 */
function CodeChip({ marker }: { marker?: string }) {
  return (
    <span className={cn('inline-flex h-6 w-11 shrink-0 items-center justify-center rounded bg-brand-blue/10 px-1.5 text-xs font-bold text-brand-blue', !marker && 'invisible')}>
      {marker ?? '0'}
    </span>
  );
}

/** 一組「帳簿試算｜已申報｜差額」；桌機三欄並排，手機單行文字 */
function CompareCells({ field, diff, marker, colLabel }: { field: ReportFieldDef; diff: VatCompareDiff; marker?: string; colLabel?: string }) {
  const changed = hasDelta(diff);
  return (
    <>
      {/* 桌機 */}
      <div className='hidden items-center gap-2 nav:flex'>
        <CodeChip marker={marker} />
        <span className='w-[84px] text-right text-sm tabular-nums text-neutral-dark'>{formatValue(field, diff.invoiceValue)}</span>
        <span className='w-[84px] text-right text-sm tabular-nums text-neutral-dark'>{formatValue(field, diff.filedValue)}</span>
        <span className={cn('w-[84px] text-right text-sm tabular-nums', changed ? 'font-bold text-neutral-dark' : 'text-neutral-mid')}>
          {formatDelta(field, diff)}
        </span>
      </div>
      {/* 手機 */}
      <div className='flex flex-col gap-0.5 text-[13px] tabular-nums nav:hidden'>
        {colLabel && <span className='text-xs text-neutral-mid'>{colLabel}</span>}
        <span className='flex flex-wrap items-center gap-x-2 text-neutral-mid'>
          <span>帳簿 {formatValue(field, diff.invoiceValue)}</span>
          <span>申報 {formatValue(field, diff.filedValue)}</span>
          <span className={changed ? 'font-bold text-neutral-dark' : ''}>差額 {formatDelta(field, diff)}</span>
        </span>
      </div>
    </>
  );
}

interface CompareFormViewProps {
  /** 401 或 403 */
  formKind: string;
  taxYear: number;
  diffs: VatCompareDiff[];
}

/**
 * 對帳明細：沿用開帳 401／403 表單的紙本對照版面（大區塊、小節、群組小標、圈號 chip、小計淡藍底、
 * 金額｜稅額成對），每個欄位改為「帳簿試算｜已申報｜差額」三欄唯讀數字。
 * 欄位分組與排版取自 metadata，數字一律用 compare 回傳值，前端不加總。
 */
export default function CompareFormView({ formKind, taxYear, diffs }: CompareFormViewProps) {
  const [page, setPage] = useState<ReportPageDef | null>(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  if (error) return <div className='rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error'>{error}</div>;
  if (!page) return <div className='rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid'>載入中…</div>;

  const diffMap = new Map(diffs.map(d => [d.fieldCode, d]));
  const sectionMap = new Map(page.sections.map(s => [s.key, s]));

  const renderPart = (part: VatPartDef, last: boolean) => {
    const section = sectionMap.get(part.key);
    // 只列 compare 有回傳的金額欄位
    const { rows, hasPairs } = buildRows((section?.fields ?? []).filter(f => isAmountField(f) && diffMap.has(f.key)));
    if (rows.length === 0) return null;
    const heads = pairHeads(rows);

    const isOpen = expanded[part.key] ?? false;
    // 小計列一律顯示（合計對不對最重要）；其餘全空的列預設收合
    const isCollapsible = (row: VatRow) => !row.main.isSubtotal && isRowEmpty(row, diffMap);
    const hiddenCount = rows.filter(isCollapsible).length;
    const visibleRows = isOpen ? rows : rows.filter(r => !isCollapsible(r));
    const groupWidth = 'nav:w-[320px]';
    let lastGroup: string | undefined;

    return (
      <div key={part.key} className={cn('flex flex-col gap-4 py-[18px]', !last && 'border-b border-neutral-blue-gray/30')}>
        {part.title && (
          <div className='flex flex-wrap items-baseline gap-x-3'>
            <h3 className='text-base font-bold text-neutral-dark'>{part.title}</h3>
            {part.note && <span className='text-[13px] text-neutral-mid'>{part.note}</span>}
          </div>
        )}
        <div className='flex flex-col nav:overflow-x-auto'>
          {/* 桌機欄標題：成對時為「銷售額｜稅額」兩組，每組下有帳簿／申報／差額 */}
          <div className='hidden gap-x-3 px-3 pb-1.5 text-xs font-bold text-neutral-mid nav:flex nav:min-w-fit'>
            <span className='w-5 shrink-0' />
            <span className='min-w-[200px] flex-1'>項目</span>
            {(hasPairs ? [heads[0], heads[1]] : [heads[0] === '金額' ? '金額' : '銷售額']).map(h => (
              <span key={h} className={cn('flex flex-col gap-0.5', groupWidth)}>
                <span className='pl-12'>{hasPairs ? h : ''}</span>
                <span className='flex gap-2 pl-[52px]'>
                  <span className='w-[84px] text-right'>帳簿試算</span>
                  <span className='w-[84px] text-right'>已申報</span>
                  <span className='w-[84px] text-right'>差額</span>
                </span>
              </span>
            ))}
          </div>
          {visibleRows.map(row => {
            const showGroup = row.group && row.group !== lastGroup;
            lastGroup = row.group;
            const operator = row.main.isSubtotal ? '＝' : row.main.isDeduction ? '−' : '';
            const mainDiff = diffMap.get(row.main.key) as VatCompareDiff;
            const taxDiff = row.tax ? diffMap.get(row.tax.key) : undefined;
            return (
              <div key={row.main.key} className='flex flex-col nav:min-w-fit'>
                {showGroup && <div className='px-3 pb-1 pt-3 text-[13px] font-bold text-neutral-dark'>{row.group}</div>}
                <div
                  className={cn(
                    'flex flex-col gap-1.5 rounded-md px-3 py-1.5 nav:flex-row nav:items-center nav:gap-x-3',
                    row.main.isSubtotal && 'mt-1 bg-brand-blue/5',
                    !row.main.isSubtotal && rowHasDelta(row, diffMap) && 'bg-brand-tan/10'
                  )}
                >
                  <div className='flex min-w-0 items-center gap-3 nav:min-w-[200px] nav:flex-1'>
                    <span className='w-5 shrink-0 text-center text-lg text-neutral-mid'>{operator}</span>
                    <span className={cn('min-w-0 break-words text-sm leading-snug text-neutral-dark', row.group && 'pl-5', row.main.isSubtotal ? 'font-bold' : 'font-medium')}>
                      {row.leaf}
                    </span>
                  </div>
                  <div className={cn('pl-8 nav:pl-0', groupWidth)}>
                    <CompareCells field={row.main} diff={mainDiff} marker={row.markers[0]} colLabel={hasPairs ? heads[0] : undefined} />
                  </div>
                  {row.tax && taxDiff ? (
                    <div className={cn('pl-8 nav:pl-0', groupWidth)}>
                      <CompareCells field={row.tax} diff={taxDiff} marker={row.markers[1]} colLabel={heads[1]} />
                    </div>
                  ) : (
                    hasPairs && <span className={cn('hidden', groupWidth, 'nav:block')} />
                  )}
                </div>
              </div>
            );
          })}
          {hiddenCount > 0 || (isOpen && rows.some(isCollapsible)) ? (
            <button
              type='button'
              onClick={() => setExpanded(prev => ({ ...prev, [part.key]: !isOpen }))}
              className='mt-2 flex items-center gap-1 self-start px-3 py-1 text-[13px] font-medium text-brand-blue hover:underline'
            >
              <ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
              {isOpen ? '收合沒有金額的項目' : `顯示其餘 ${hiddenCount} 項沒有金額的欄位`}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className='flex flex-col gap-4'>
      {VAT_BLOCKS.filter(b => COMPARE_BLOCK_TITLES.includes(b.title)).map(block => {
        const parts = block.parts.map((p, i) => ({ p, i }));
        const rendered = parts.map(({ p }, i) => renderPart(p, i === parts.length - 1)).filter(Boolean);
        if (rendered.length === 0) return null;
        return (
          <section key={block.title} className='flex flex-col rounded-lg border border-neutral-blue-gray/30 bg-white p-5 nav:px-6'>
            <h2 className='border-b-2 border-neutral-dark pb-2 text-lg font-bold text-neutral-dark'>{block.title}</h2>
            {rendered}
          </section>
        );
      })}
    </div>
  );
}
