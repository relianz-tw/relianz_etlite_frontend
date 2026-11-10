'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import Checkbox from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import type { ReportFieldDef, ReportRowDef, ReportSectionDef, ReportSectionItem } from '../../reports/types';
import { ReportFieldRow } from '../ReportFieldRow';
import { fieldLabelClass, FIELD_LABEL_BASE } from '../fieldLabel';
import { ChoiceGroup } from './ChoiceGroup';
import { CodeChip } from './CodeChip';
import { FieldInput, StoreFieldInput } from './FieldInput';
import { PaperStoreProvider, isFieldShown, isFieldVisible, usePaperStore, type PaperStore } from './PaperStore';
import { PaperTable } from './PaperTable';
import { TemplateText } from './TemplateText';

/** BOOK／ADJ 成對欄位的欄標題（metadata 只給 column 代碼，沒有標題文字） */
const COLUMN_HEADS = { BOOK: '帳載結算金額', ADJ: '自行依法調整後金額' } as const;

/** 對帳模式只呈現有數字的金額列與表格，其餘（輸入欄、勾選、段落）不畫 */
const COMPARE_KINDS: ReportSectionItem['kind'][] = ['amountRows', 'table'];

function isItemShown(item: ReportSectionItem, store: PaperStore): boolean {
  if (store.renderValue && !COMPARE_KINDS.includes(item.kind)) return false;
  switch (item.kind) {
    case 'amountRows':
      return item.rows.some(r => isFieldShown(r.main, store));
    case 'inputs':
    case 'checks':
      return item.fields.some(f => isFieldShown(f, store));
    case 'table':
      return store.renderValue ? Object.values(item.table.cells).some(f => isFieldShown(f, store)) : true;
    default:
      return true;
  }
}

function isSectionShown(section: ReportSectionDef, all: ReportSectionDef[], store: PaperStore): boolean {
  return section.items.some(i => isItemShown(i, store)) || all.some(s => s.parentKey === section.key && isSectionShown(s, all, store));
}

/** 一組逐列的金額欄位：標籤（含模板、備註、算式文字）在左，金額在右，帳載／調整後成對時並排兩欄 */
function AmountRows({ rows }: { rows: ReportRowDef[] }) {
  const store = usePaperStore();
  const [open, setOpen] = useState(false);

  const shown = rows.filter(r => isFieldShown(r.main, store));
  const hasPairs = shown.some(r => r.adj);
  const hasChip = shown.some(r => r.main.officialCode || r.main.refNo);

  // 辨識帶入後欄位很多的區塊，沒有金額的列預設收合，只留有值與小計
  const collapsible = (r: ReportRowDef) => !r.main.isSubtotal && !store.isFilled(r.main) && !(r.adj && store.isFilled(r.adj));
  const canCollapse = store.canCollapse && shown.length > store.collapseThreshold;
  const visible = canCollapse && !open ? shown.filter(r => !collapsible(r)) : shown;
  const hiddenCount = shown.length - visible.length;

  const valueWidth = store.valueWidthClass ?? (hasPairs ? '170px' : '240px');
  const cols = hasPairs ? `minmax(0,1fr) ${valueWidth} ${valueWidth}` : `minmax(0,1fr) ${valueWidth}`;

  return (
    <div className='flex flex-col'>
      {hasPairs && (
        <div className='hidden gap-x-3 px-3 pb-1.5 text-xs font-bold text-neutral-mid md:grid md:[grid-template-columns:var(--cols)]' style={{ '--cols': cols } as CSSProperties}>
          <span>項目</span>
          <span className='text-right'>{COLUMN_HEADS.BOOK}</span>
          <span className='text-right'>{COLUMN_HEADS.ADJ}</span>
        </div>
      )}
      {visible.map(({ main, adj }) => {
        if (!isFieldVisible(main, store)) return null;
        return (
          <div
            key={main.key}
            aria-label={main.isDeduction ? `${main.label}（減項）` : undefined}
            className='grid grid-cols-1 items-center gap-x-3 gap-y-1.5 rounded-md px-3 py-1.5 md:[grid-template-columns:var(--cols)]'
            style={{ '--cols': cols } as CSSProperties}
          >
            <div className='flex min-w-0 items-start gap-2'>
              {hasChip && <CodeChip official={main.officialCode} refNo={main.refNo} placeholder className='mt-px' />}
              <div className={cn('min-w-0 break-words text-sm leading-snug text-neutral-dark', main.isSubtotal ? 'font-bold' : 'font-medium')}>
                {main.labelTemplate ? <TemplateText template={main.labelTemplate} /> : main.label}
                {main.note && <span className='ml-1 text-[13px] font-normal text-neutral-mid'>（{main.note}）</span>}
                {main.formulaText && <span className='ml-1 text-[13px] font-normal text-neutral-mid'>（{main.formulaText}）</span>}
              </div>
            </div>
            {/* 成對區塊裡沒有另一半的欄位，輸入框放在「帳載」那一欄對齊 */}
            <div className={cn('grid gap-2', adj ? 'grid-cols-2 md:contents' : 'grid-cols-1', hasPairs && !adj && 'md:col-span-1')}>
              <ValueCell field={main} head={hasPairs ? (main.column ? COLUMN_HEADS[main.column] : undefined) : undefined} />
              {adj && <ValueCell field={adj} head={COLUMN_HEADS.ADJ} />}
            </div>
          </div>
        );
      })}
      {canCollapse && (hiddenCount > 0 || (open && shown.some(collapsible))) && (
        <button type='button' onClick={() => setOpen(v => !v)} className='mt-2 flex items-center gap-1 self-start px-3 py-1 text-[13px] font-medium text-brand-blue hover:underline'>
          <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
          {open ? '收合沒有金額的項目' : `顯示其餘 ${hiddenCount} 個沒有金額的項目`}
        </button>
      )}
    </div>
  );
}

/** 金額欄：手機在輸入框上方顯示欄名（桌機欄名在列表上方） */
function ValueCell({ field, head }: { field: ReportFieldDef; head?: string }) {
  return (
    <div className='flex min-w-0 flex-col gap-1'>
      {head && <span className='text-xs text-neutral-mid md:hidden'>{head}</span>}
      <StoreFieldInput field={field} />
    </div>
  );
}

function InputGrid({ fields }: { fields: ReportFieldDef[] }) {
  const store = usePaperStore();
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6'>
      {fields.filter(f => isFieldShown(f, store)).map(f => (
        <ReportFieldRow key={f.key} field={f} data={store.get(f.key)} onChange={value => store.set(f.key, value)} />
      ))}
    </div>
  );
}

function renderItem(item: ReportSectionItem, index: number, store: PaperStore): ReactNode {
  switch (item.kind) {
    case 'amountRows':
      return <AmountRows key={index} rows={item.rows} />;
    case 'inputs':
      return <InputGrid key={index} fields={item.fields} />;
    case 'checks':
      return (
        <div key={index} className='flex flex-wrap gap-x-8 gap-y-2'>
          {item.fields.filter(f => isFieldShown(f, store)).map(f =>
            // 勾選項文字內嵌輸入框（如「…利息支出合計數 ___ 元」）：勾選框後接模板文字
            f.labelTemplate ? (
              <label key={f.key} className='flex w-full items-center gap-2 text-sm leading-9 text-neutral-dark'>
                <Checkbox checked={Number(store.get(f.key).value) === 1} onChange={() => store.set(f.key, Number(store.get(f.key).value) === 1 ? 0 : 1)} aria-label={f.label} />
                <span className='min-w-0'>
                  <TemplateText template={f.labelTemplate} />
                </span>
              </label>
            ) : (
              <ReportFieldRow key={f.key} field={f} data={store.get(f.key)} onChange={value => store.set(f.key, value)} />
            )
          )}
        </div>
      );
    case 'choice':
      return <ChoiceGroup key={index} choice={item.choice} />;
    case 'dateRange': {
      const { range } = item;
      return (
        <div key={index} className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2'>
          <span className={cn(FIELD_LABEL_BASE, fieldLabelClass(range.title), 'md:w-[19%]')}>{range.title}</span>
          <div className='flex min-w-0 flex-1 items-center gap-2'>
            <div className='min-w-0 flex-1'>
              <FieldInput field={range.start} data={store.get(range.start.key)} onChange={value => store.set(range.start.key, value)} />
            </div>
            <span className='text-sm text-neutral-mid'>至</span>
            <div className='min-w-0 flex-1'>
              <FieldInput field={range.end} data={store.get(range.end.key)} onChange={value => store.set(range.end.key, value)} />
            </div>
          </div>
        </div>
      );
    }
    case 'text':
      return (
        <p key={index} className='flex flex-wrap items-center gap-x-1 text-sm leading-9 text-neutral-dark'>
          {item.block.officialCode && <CodeChip official={item.block.officialCode} className='mr-1' />}
          <TemplateText template={item.block.template} />
        </p>
      );
    case 'table':
      return <PaperTable key={index} table={item.table} />;
  }
}

function SectionBlock({ section, all, store, depth }: { section: ReportSectionDef; all: ReportSectionDef[]; store: PaperStore; depth: number }) {
  const children = all.filter(s => s.parentKey === section.key && isSectionShown(s, all, store));
  return (
    <section className={cn('flex flex-col gap-4', depth === 0 ? 'p-5 md:px-6' : 'pt-2')}>
      {section.title &&
        (depth === 0 ? (
          <h2 className='border-b-2 border-neutral-dark pb-2 text-[17px] font-bold text-neutral-dark'>{section.title}</h2>
        ) : (
          <h3 className='text-base font-bold text-neutral-dark'>{section.title}</h3>
        ))}
      {section.items.filter(i => isItemShown(i, store)).map((item, i) => renderItem(item, i, store))}
      {children.map(c => (
        <SectionBlock key={c.key} section={c} all={all} store={store} depth={depth + 1} />
      ))}
    </section>
  );
}

interface PaperFormProps {
  sections: ReportSectionDef[];
  store: PaperStore;
}

/**
 * 紙本對照表單（營所稅各表、營業稅 401／403、申報對帳共用）：依 metadata 排好的 sections／items 逐項渲染，
 * 區塊標題、列配對、表格、段落、勾選框都由後端決定；小計與算式欄唯讀，前端不加總。
 */
export function PaperForm({ sections, store }: PaperFormProps) {
  const roots = sections.filter(s => (!s.parentKey || !sections.some(p => p.key === s.parentKey)) && isSectionShown(s, sections, store));
  if (roots.length === 0) return null;
  return (
    <PaperStoreProvider value={store}>
      <div className='flex flex-col divide-y divide-neutral-blue-gray/30 rounded-lg border border-neutral-blue-gray/30 bg-white'>
        {roots.map(s => (
          <SectionBlock key={s.key} section={s} all={sections} store={store} depth={0} />
        ))}
      </div>
    </PaperStoreProvider>
  );
}
