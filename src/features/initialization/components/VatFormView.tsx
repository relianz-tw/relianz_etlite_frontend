'use client';

import { useState } from 'react';
import { useInitialization } from '../state/InitializationContext';
import { VAT_BLOCKS, VAT_CARRY_CREDIT_KEY, VAT_CREDIT_FIELD_KEYS, VAT_PAYABLE_KEY, type VatPartDef } from '../reports/vatSectionTitles';
import { PaperSectionFields } from './PaperSectionFields';
import { ReportAmountInput } from './ReportAmountInput';
import { cn, fmtCurrency } from '@/lib/utils';
import { ChevronDown, CircleCheck, Wallet } from 'lucide-react';
import type { ReportKey } from '../state/initializationReducer';
import type { ReportFieldDef, ReportSectionDef } from '../reports/types';

/** 金額欄 → 稅額欄的配對規則：銷售額／金額欄名尾端換成 _TAX（小計列同理 _SUM 前面換） */
const PAIR_RULES: [RegExp, string][] = [
  [/_SALES$/, '_TAX'],
  [/_AMT$/, '_TAX'],
  [/_SALES_SUM$/, '_TAX_SUM'],
  [/_AMT_SUM$/, '_TAX_SUM'],
];

/** 圈號 ①–⑳，紙本用來在公式裡指稱合計欄（如 ⑨＋⑩） */
const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';

/** 欄位名稱尾端的「(1)」「(12)」是圈號標記；「(1)+(3)」這類公式說明不是，不處理 */
function splitMarker(label: string): { text: string; marker?: string } {
  const match = /\((\d{1,2})\)$/.exec(label);
  if (!match || label.includes(')+(')) return { text: label };
  const n = Number(match[1]);
  return { text: label.slice(0, match.index), marker: n >= 1 && n <= CIRCLED.length ? CIRCLED[n - 1] : `(${n})` };
}

/** 「統一發票扣抵聯－進貨及費用金額」→ 群組「統一發票扣抵聯」、項目「進貨及費用」；沒有「－」則無群組 */
function splitLabel(label: string): { group?: string; leaf: string; fullLeaf: string; marker?: string } {
  const { text, marker } = splitMarker(label);
  const dash = text.search(/[－]/);
  const group = dash > 0 ? text.slice(0, dash) : undefined;
  const fullLeaf = dash > 0 ? text.slice(dash + 1) : text;
  return { group, leaf: fullLeaf.replace(/(銷售額|金額|稅額)$/, '') || fullLeaf, fullLeaf, marker };
}

interface VatRow {
  main: ReportFieldDef;
  /** 同一列的稅額欄 */
  tax?: ReportFieldDef;
  group?: string;
  leaf: string;
  markers: [string | undefined, string | undefined];
}

/** 把區塊欄位配成「金額｜稅額」列，並解析群組與圈號 */
function buildRows(fields: ReportFieldDef[]): { rows: VatRow[]; hasPairs: boolean } {
  const byKey = new Map(fields.map(f => [f.key, f]));
  const consumed = new Set<string>();
  const rows: VatRow[] = [];
  for (const field of fields) {
    if (consumed.has(field.key)) continue;
    let tax: ReportFieldDef | undefined;
    for (const [pattern, replacement] of PAIR_RULES) {
      if (!pattern.test(field.key)) continue;
      tax = byKey.get(field.key.replace(pattern, replacement));
      if (tax && tax !== field) break;
      tax = undefined;
    }
    if (tax) consumed.add(tax.key);
    const { group, leaf, fullLeaf, marker } = splitLabel(field.label);
    // 欄名後綴（金額／稅額）只在成對或群組列去掉，由欄標題表示；單獨的欄位（如「已納稅額」）保留完整名稱
    rows.push({ main: field, tax, group, leaf: tax || group ? leaf : fullLeaf, markers: [marker, tax ? splitLabel(tax.label).marker : undefined] });
  }
  return { rows, hasPairs: rows.some(r => r.tax) };
}

interface VatFormViewProps {
  reportId: ReportKey;
  sections: ReportSectionDef[];
}

/** 欄位代號 chip：官方代號加圈號，如「21 ①」 */
function CodeChip({ code, marker }: { code?: string; marker?: string }) {
  return (
    <span className={cn('inline-flex h-6 w-11 shrink-0 items-center justify-center rounded bg-brand-blue/10 px-1.5 text-xs font-bold tabular-nums text-brand-blue', !code && 'invisible')}>
      {code ?? '0'}
      {marker && <span className='ml-0.5'>{marker}</span>}
    </span>
  );
}

/**
 * 營業稅 401／403 紙本對照版面：銷項、進項依紙本分「銷售額（金額）｜稅額」兩欄，代號 chip 貼在各欄金額框左側，
 * 群組小標（如「統一發票扣抵聯」）下接縮排明細，小計淡藍底、扣除項前加「−」；最後以結果卡顯示本期應繳或留抵。
 * 合計與稅額計算都取欄位值（辨識帶入或使用者輸入），前端不自行加總。
 */
export function VatFormView({ reportId, sections }: VatFormViewProps) {
  const { state, dispatch } = useInitialization();
  const data = state.reports[reportId]?.fields ?? {};
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fieldData = (key: string) => data[key] ?? { value: '', aiFilled: false };
  const setField = (key: string, value: string | number) => dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId, key, value } });
  const hasValue = (key: string) => Number(data[key]?.value) !== 0 && data[key]?.value !== undefined && data[key]?.value !== '';
  const isRowField = (f: ReportFieldDef) => f.type === 'money' || f.type === 'decimal';

  const sectionMap = new Map(sections.map(s => [s.key, s]));

  const renderCell = (field: ReportFieldDef, marker: string | undefined, colLabel: string | undefined) => (
    <div className='col-start-2 flex min-w-0 flex-col gap-1 md:col-start-auto'>
      {colLabel && <span className='text-xs text-neutral-mid md:hidden'>{colLabel}</span>}
      <div className='flex items-center gap-2'>
        <CodeChip code={field.officialCode} marker={marker} />
        <div className='min-w-0 flex-1'>
          <ReportAmountInput field={field} data={fieldData(field.key)} onChange={value => setField(field.key, value)} />
        </div>
      </div>
    </div>
  );

  const renderRows = (part: VatPartDef, section: ReportSectionDef) => {
    const { rows, hasPairs } = buildRows(section.fields.filter(isRowField));
    if (rows.length === 0) return null;
    const heads: [string, string] = rows.find(r => r.tax)?.main.key.endsWith('_AMT') ? ['金額', '稅額'] : ['銷售額', '稅額'];

    // 辨識帶入後，沒有金額的列預設收合；稅額計算裡留抵／退稅欄位沒有值時也收合
    const hasAiValue = section.fields.some(f => fieldData(f.key).aiFilled);
    const isOpen = expanded[part.key] ?? false;
    const isCollapsible = (row: VatRow) => {
      const filled = hasValue(row.main.key) || (row.tax && hasValue(row.tax.key));
      if (filled) return false;
      // 留抵／退稅欄位是小計列，但只有留抵或退稅時才需要填，沒有值時仍收合
      if (part.key === 'TAX_COMPUTE') return VAT_CREDIT_FIELD_KEYS.includes(row.main.key);
      return !row.main.isSubtotal && hasAiValue;
    };
    const hiddenCount = rows.filter(isCollapsible).length;
    const visibleRows = isOpen ? rows : rows.filter(r => !isCollapsible(r));

    const gridClass = hasPairs ? 'md:grid-cols-[24px_minmax(0,1fr)_200px_200px]' : 'md:grid-cols-[24px_minmax(0,1fr)_260px]';
    let lastGroup: string | undefined;

    return (
      <div className='flex flex-col'>
        {hasPairs && (
          <div className='hidden grid-cols-[24px_minmax(0,1fr)_200px_200px] gap-x-3 px-3 pb-1.5 text-xs font-bold text-neutral-mid md:grid'>
            <span />
            <span>項目</span>
            <span className='pl-12'>{heads[0]}</span>
            <span className='pl-12'>{heads[1]}</span>
          </div>
        )}
        {visibleRows.map(row => {
          const showGroup = row.group && row.group !== lastGroup;
          lastGroup = row.group;
          const operator = row.main.isSubtotal ? '＝' : row.main.isDeduction ? '−' : '';
          return (
            <div key={row.main.key} className='flex flex-col'>
              {showGroup && <div className='px-3 pb-1 pt-3 text-[13px] font-bold text-neutral-dark'>{row.group}</div>}
              <div
                className={cn(
                  'grid grid-cols-[20px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 rounded-md px-3 py-1.5',
                  gridClass,
                  row.main.isSubtotal && 'mt-1 bg-brand-blue/5'
                )}
              >
                <span className='text-center text-lg text-neutral-mid'>{operator}</span>
                <span className={cn('min-w-0 break-words text-sm leading-snug text-neutral-dark', row.group && 'pl-5', row.main.isSubtotal ? 'font-bold' : 'font-medium')}>
                  {row.leaf}
                </span>
                {renderCell(row.main, row.markers[0], hasPairs ? heads[0] : undefined)}
                {row.tax ? renderCell(row.tax, row.markers[1], heads[1]) : hasPairs && <span className='hidden md:block' />}
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
    );
  };

  const renderPart = (part: VatPartDef, last: boolean) => {
    const section = sectionMap.get(part.key);
    if (!section || (section.fields.length === 0 && (section.choices?.length ?? 0) === 0)) return null;
    return (
      <div key={part.key} className={cn('flex flex-col gap-4 py-[18px]', !last && 'border-b border-neutral-blue-gray/30')}>
        {part.title && (
          <div className='flex flex-wrap items-baseline gap-x-3'>
            <h3 className='text-base font-bold text-neutral-dark'>{part.title}</h3>
            {part.note && <span className='text-[13px] text-neutral-mid'>{part.note}</span>}
          </div>
        )}
        <PaperSectionFields reportId={reportId} section={section} isRowField={isRowField}>
          {renderRows(part, section)}
        </PaperSectionFields>
      </div>
    );
  };

  const payable = Number(data[VAT_PAYABLE_KEY]?.value) || 0;
  const carryCredit = Number(data[VAT_CARRY_CREDIT_KEY]?.value) || 0;
  const hasResult = sectionMap.has('TAX_COMPUTE');

  return (
    <>
      {VAT_BLOCKS.map(block => {
        const parts = block.parts.filter(p => {
          const s = sectionMap.get(p.key);
          return s && (s.fields.length > 0 || (s.choices?.length ?? 0) > 0);
        });
        if (parts.length === 0) return null;
        return (
          <section key={block.title} className='flex flex-col rounded-lg border border-neutral-blue-gray/30 bg-white p-5 md:px-6'>
            <h2 className='border-b-2 border-neutral-dark pb-2 text-lg font-bold text-neutral-dark'>{block.title}</h2>
            {parts.map((p, i) => renderPart(p, i === parts.length - 1))}
          </section>
        );
      })}

      {hasResult && (
        <section
          aria-live='polite'
          className={cn(
            'flex items-center gap-4 rounded-lg border p-5 md:px-6',
            payable > 0 ? 'border-brand-blue/35 bg-brand-blue/10' : 'border-semantic-success/40 bg-semantic-success/5'
          )}
        >
          {payable > 0 ? <Wallet size={28} className='shrink-0 text-brand-blue' /> : <CircleCheck size={28} className='shrink-0 text-semantic-success' />}
          <div className='flex min-w-0 flex-col gap-0.5'>
            <span className='text-sm font-bold text-neutral-dark'>{payable > 0 ? '本期應實繳稅額' : '本期累積留抵稅額'}</span>
            <span className='text-2xl font-bold tabular-nums text-neutral-dark'>{fmtCurrency(payable > 0 ? payable : carryCredit)}</span>
            <span className='text-[13px] text-neutral-mid'>
              {payable > 0 ? '申報前請先持營業稅繳款書繳納，並附繳款書申報聯' : '留抵稅額將自動帶入下期「上期累積留抵稅額」'}
            </span>
          </div>
        </section>
      )}
    </>
  );
}
