'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import Checkbox from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import type { ReportChoiceDef, ReportDateRangeDef, ReportFieldDef, ReportRowDef, ReportSectionDef, ReportSectionItem } from '../../reports/types';
import { ReportFieldRow } from '../ReportFieldRow';
import { fieldLabelClass, FIELD_LABEL_BASE, labelWidthFor } from '../fieldLabel';
import { validateDateRange } from '../../reports/fieldValidators';
import { ChoiceGroup } from './ChoiceGroup';
import { FieldWarning } from './FieldWarning';
import { CodeChip } from './CodeChip';
import { FieldInput, StoreFieldInput } from './FieldInput';
import { PaperStoreProvider, effectiveNumber, isFieldShown, isFieldVisible, usePaperStore, type PaperStore } from './PaperStore';
import { BOLD_CHECK_KEYS, DIVIDER_BEFORE_SECTIONS, EXEMPT_COLLAPSE, EXEMPT_FLAG_KEYS } from '../../reports/exemptRules';
import { RECON_DIFF_FIELD, RECON_GROUPS, itemGroupCode, splitItemsByGroup } from './reconGroups';
import { PaperTable } from './PaperTable';
import { TemplateText } from './TemplateText';

/** BOOK／ADJ 成對欄位的欄標題（metadata 只給 column 代碼，沒有標題文字） */
const COLUMN_HEADS = { BOOK: '帳載結算金額', ADJ: '自行依法調整後金額' } as const;

/** 對帳模式只呈現有數字的金額列與表格，其餘（輸入欄、勾選、段落）不畫 */
const COMPARE_KINDS: ReportSectionItem['kind'][] = ['amountRows', 'table'];

/** 段落模板內有 {{field:}}（輸入框）或 {{group:}}（勾選框）才算有要填的內容 */
const HAS_INPUT_TOKEN = /\{\{(field|group):/;

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
    case 'text':
      // 純說明文字（沒有要輸入的欄位或勾選）不顯示，只有內嵌輸入框／勾選框的段落才畫
      return HAS_INPUT_TOKEN.test(item.block.template);
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

  // 辨識帶入後欄位很多的區塊，沒有金額（0 或空白）的列預設收合，只留有數字的列
  // 算式欄位（小計、合計）也一樣：帶入的是 0 或試算結果是 0 就收起來；有數字（帶入、輸入或試算出來）才留著
  const hasAmount = (f: ReportFieldDef) => {
    const n = effectiveNumber(f.key, store);
    return n !== null && n !== 0;
  };
  const collapsible = (r: ReportRowDef) => !hasAmount(r.main) && !(r.adj && hasAmount(r.adj));
  const canCollapse = store.canCollapse && shown.length > store.collapseThreshold;
  const visible = canCollapse && !open ? shown.filter(r => !collapsible(r)) : shown;
  const hiddenCount = shown.length - visible.length;

  const valueWidth = store.valueWidthClass ?? (hasPairs ? '170px' : '240px');
  const cols = hasPairs ? `minmax(0,1fr) ${valueWidth} ${valueWidth}` : `minmax(0,1fr) ${valueWidth}`;

  return (
    <div className='flex flex-col'>
      {hasPairs && (
        <div className='hidden gap-x-3 px-3 pb-1.5 text-xs font-bold text-neutral-mid nav:grid nav:[grid-template-columns:var(--cols)]' style={{ '--cols': cols } as CSSProperties}>
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
            className='grid grid-cols-1 items-center gap-x-3 gap-y-1.5 rounded-md px-3 py-1.5 nav:[grid-template-columns:var(--cols)]'
            style={{ '--cols': cols } as CSSProperties}
          >
            <div className='flex min-w-0 items-center gap-2'>
              {hasChip && <CodeChip official={main.officialCode} refNo={main.refNo} placeholder />}
              <div className='min-w-0 break-words text-sm font-medium leading-7 text-neutral-dark'>
                {/* 減項標籤本身沒有「減：」時（紙本縮排在「減：」那列底下的子項），前面補「減：」 */}
                {main.isDeduction && !main.label.startsWith('減') && '減：'}
                {main.labelTemplate ? <TemplateText template={main.labelTemplate} /> : main.label}
                {main.note && <span className='ml-1 text-[13px] font-normal text-neutral-mid'>（{main.note}）</span>}
                {main.formulaText && <span className='ml-1 text-[13px] font-normal text-neutral-mid'>（{main.formulaText}）</span>}
              </div>
            </div>
            {/* 成對區塊裡沒有另一半的欄位，輸入框依自己的欄放：帳載（BOOK）放第一欄，調整後（ADJ，如 137 帳載斜線）放第二欄 */}
            <div className={cn('grid gap-2', adj ? 'grid-cols-2 nav:contents' : 'grid-cols-1', hasPairs && !adj && (main.column === 'ADJ' ? 'nav:col-start-3' : 'nav:col-span-1'))}>
              <ValueCell field={main} head={hasPairs ? (main.column ? COLUMN_HEADS[main.column] : undefined) : undefined} />
              {adj && <ValueCell field={adj} head={COLUMN_HEADS.ADJ} />}
            </div>
          </div>
        );
      })}
      {canCollapse && (hiddenCount > 0 || (open && shown.some(collapsible))) && (
        <button type='button' onClick={() => setOpen(v => !v)} className='mt-2 flex min-h-11 items-center gap-1 self-start px-3 py-1 text-[13px] font-medium text-brand-blue hover:underline nav:min-h-0'>
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
      {head && <span className='text-xs text-neutral-mid nav:hidden'>{head}</span>}
      <StoreFieldInput field={field} />
    </div>
  );
}

/** 起訖日期一排：標籤＋兩個日期框；寬度與兩欄輸入格的一欄相同，標籤與輸入框左緣才對得齊 */
function DateRangeRow({ range, store, paired }: { range: ReportDateRangeDef; store: PaperStore; paired?: boolean }) {
  const warning = validateDateRange(store.get(range.start.key).value, store.get(range.end.key).value);
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', !paired && 'nav:max-w-[calc(50%-0.75rem)]')}>
      <div className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 nav:flex-nowrap'>
        <span className={cn(FIELD_LABEL_BASE, fieldLabelClass(range.title))}>{range.title}</span>
        {/* 兩個日期框同一排，各佔剩餘寬度的一半；桌機最寬約 11rem、不撐滿整列，手機標籤獨佔一行、兩框各半寬 */}
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <div className='min-w-0 flex-1 nav:max-w-44'>
            <FieldInput field={range.start} data={store.get(range.start.key)} onChange={value => store.set(range.start.key, value)} />
          </div>
          <span className='shrink-0 text-sm text-neutral-mid'>至</span>
          <div className='min-w-0 flex-1 nav:max-w-44'>
            <FieldInput field={range.end} data={store.get(range.end.key)} onChange={value => store.set(range.end.key, value)} />
          </div>
        </div>
      </div>
      {warning && <FieldWarning message={warning} />}
    </div>
  );
}

/** 和起訖日期同一排的欄位（損益表「所得期間」旁邊放收件編號） */
const PAIRED_WITH_DATE_RANGE_KEY = 'HDR_RECEIPT_NO';

function InputGrid({ fields }: { fields: ReportFieldDef[] }) {
  const store = usePaperStore();
  return (
    <div className='grid grid-cols-1 gap-4 nav:grid-cols-2 nav:gap-x-6'>
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
                <CodeChip official={f.officialCode} refNo={f.refNo} />
                <Checkbox checked={Number(store.get(f.key).value) === 1} onChange={() => store.set(f.key, Number(store.get(f.key).value) === 1 ? 0 : 1)} aria-label={f.label} />
                <span className='min-w-0'>
                  <TemplateText template={f.labelTemplate} />
                </span>
              </label>
            ) : BOLD_CHECK_KEYS.includes(f.key) ? (
              <label key={f.key} className='flex w-full cursor-pointer items-center gap-2 text-sm font-bold leading-9 text-neutral-dark'>
                <Checkbox checked={Number(store.get(f.key).value) === 1} onChange={() => store.set(f.key, Number(store.get(f.key).value) === 1 ? 0 : 1)} aria-label={f.label} />
                <span className='min-w-0'>{f.label}</span>
              </label>
            ) : (
              <div key={f.key} className='flex items-center gap-2'>
                <CodeChip official={f.officialCode} refNo={f.refNo} />
                <ReportFieldRow field={f} data={store.get(f.key)} onChange={value => store.set(f.key, value)} />
              </div>
            )
          )}
        </div>
      );
    case 'choice':
      return <ChoiceGroup key={index} choice={item.choice} />;
    case 'dateRange':
      return <DateRangeRow key={index} range={item.range} store={store} />;
    case 'text':
      return (
        // 一般行內排版（不用 flex），長文字接著輸入框才會同一行折行，不會把輸入框擠到下一排
        <p key={index} className='text-sm leading-9 text-neutral-dark'>
          {item.block.officialCode && <CodeChip official={item.block.officialCode} className='mr-1 align-middle' />}
          <TemplateText template={item.block.template} />
        </p>
      );
    case 'table':
      return <PaperTable key={index} table={item.table} />;
  }
}

/** 401／403 右上角「註記欄」：核准按月申報、核准合併總繳單位（總機構彙總總繳、各單位分別申報），畫成紙本那個框 */
const NOTE_BOX_MONTHLY_KEY = 'HDR_MONTHLY_FILING';
const NOTE_BOX_UNIT_GROUP = 'VAT_UNIT';

function NoteColumnBox({ monthly, unit }: { monthly: ReportFieldDef; unit: ReportChoiceDef }) {
  const store = usePaperStore();
  const isOn = (key: string) => Number(store.get(key).value) === 1;
  const toggleUnit = (key: string) => {
    const next = !isOn(key);
    // 總機構彙總與各單位分別申報二選一
    if (next) for (const f of unit.fields) if (f.key !== key) store.set(f.key, 0);
    store.set(key, next ? 1 : 0);
  };
  const cell = 'flex min-h-11 items-center gap-2 px-3 py-2 text-sm text-neutral-dark nav:min-h-0';
  return (
    // 手機單欄由上而下堆疊（三欄合計比手機寬），桌機維持紙本的合併儲存格版型
    <div className='grid w-full grid-cols-1 overflow-hidden rounded-md border border-neutral-blue-gray/50 text-sm nav:w-fit nav:max-w-full nav:grid-cols-[auto_auto_1fr]'>
      <div className='flex items-center justify-center border-b border-neutral-blue-gray/50 bg-surface-cream px-3 py-2 font-bold text-neutral-dark nav:row-span-3 nav:border-b-0 nav:border-r nav:py-0'>註記欄</div>
      <label className={cn(cell, 'cursor-pointer border-b border-neutral-blue-gray/50 font-medium nav:col-span-2')}>
        <Checkbox checked={isOn(monthly.key)} onChange={() => store.set(monthly.key, isOn(monthly.key) ? 0 : 1)} aria-label={monthly.label} />
        {monthly.label}
      </label>
      <div className='flex items-center border-b border-neutral-blue-gray/50 px-3 py-2 font-medium text-neutral-dark nav:row-span-2 nav:border-b-0 nav:border-r nav:py-0'>{unit.title}</div>
      {unit.fields.map((f, i) => (
        <label key={f.key} className={cn(cell, 'cursor-pointer', i === 0 && 'border-b border-neutral-blue-gray/50')}>
          <Checkbox checked={isOn(f.key)} onChange={() => toggleUnit(f.key)} aria-label={f.label} />
          {f.label}
        </label>
      ))}
    </div>
  );
}

/** 內容項目；調節說明的加項／減項分組畫標題並可折疊，其餘項目照順序渲染 */
function SectionItems({ items, store }: { items: ReportSectionItem[]; store: PaperStore }) {
  const [override, setOverride] = useState<Record<string, boolean>>({});
  const diff = effectiveNumber(RECON_DIFF_FIELD, store);
  const nodes: ReactNode[] = [];
  const noteUnit = items.find((i): i is Extract<ReportSectionItem, { kind: 'choice' }> => i.kind === 'choice' && i.choice.groupCode === NOTE_BOX_UNIT_GROUP)?.choice;
  const noteMonthly = items.flatMap(i => (i.kind === 'checks' ? i.fields : [])).find(f => f.key === NOTE_BOX_MONTHLY_KEY);
  const noteBox = !store.renderValue && noteUnit && noteMonthly;
  // 註記欄合併畫成一個框：放在「核准按月申報」原本的位置，核准合併總繳單位那組不再單獨畫
  const NOTE = 'note' as const;
  const visible: (ReportSectionItem | typeof NOTE)[] = [];
  for (const item of splitItemsByGroup(items)) {
    if (noteBox && item.kind === 'choice' && item.choice.groupCode === NOTE_BOX_UNIT_GROUP) continue;
    if (noteBox && item.kind === 'checks' && item.fields.some(f => f.key === NOTE_BOX_MONTHLY_KEY)) {
      visible.push(NOTE);
      const rest = item.fields.filter(f => f.key !== NOTE_BOX_MONTHLY_KEY);
      if (rest.length > 0 && isItemShown({ ...item, fields: rest }, store)) visible.push({ ...item, fields: rest });
      continue;
    }
    if (isItemShown(item, store)) visible.push(item);
  }

  for (let i = 0; i < visible.length; ) {
    const current = visible[i];
    // 起訖日期後面緊接收件編號：兩個放同一排（日期在左、收件編號在右），其餘輸入欄接著另起一組
    const next = visible[i + 1];
    if (current !== NOTE && current.kind === 'dateRange' && next && next !== NOTE && next.kind === 'inputs' && next.fields[0]?.key === PAIRED_WITH_DATE_RANGE_KEY) {
      const [receipt, ...rest] = next.fields;
      nodes.push(
        <div key={`range-${i}`} className='grid grid-cols-1 gap-4 nav:grid-cols-2 nav:gap-x-6'>
          <DateRangeRow range={current.range} store={store} paired />
          <ReportFieldRow field={receipt} data={store.get(receipt.key)} onChange={value => store.set(receipt.key, value)} />
        </div>
      );
      if (rest.length > 0) visible.splice(i + 1, 1, { ...next, fields: rest });
      else visible.splice(i + 1, 1);
      i++;
      continue;
    }
    if (current === NOTE) {
      nodes.push(<NoteColumnBox key='note-column' monthly={noteMonthly as ReportFieldDef} unit={noteUnit as ReportChoiceDef} />);
      i++;
      continue;
    }
    const code = itemGroupCode(current);
    const group = code ? RECON_GROUPS[code] : undefined;
    if (!code || !group || store.renderValue) {
      nodes.push(renderItem(current, i, store));
      i++;
      continue;
    }
    let end = i;
    while (end < visible.length && itemGroupCode(visible[end] as ReportSectionItem) === code) end++;
    const collapsed = override[code] ?? (diff !== null && group.collapseWhen(diff));
    nodes.push(
      <div key={`group-${code}-${i}`} className='flex flex-col gap-2'>
        <button type='button' aria-expanded={!collapsed} onClick={() => setOverride(prev => ({ ...prev, [code]: !collapsed }))} className='flex min-h-11 items-center gap-1 self-start text-sm font-bold text-neutral-dark nav:min-h-0'>
          <ChevronDown size={14} className={cn('transition-transform', collapsed && '-rotate-90')} />
          {group.label}
        </button>
        {!collapsed && (visible.slice(i, end) as ReportSectionItem[]).map((item, k) => renderItem(item, i + k, store))}
      </div>
    );
    i = end;
  }
  return <>{nodes}</>;
}

/** 上方分隔線：第一個區塊沒有；連續兩個無標題的內容區塊（如盈餘計算接稅額計算）視為同一塊，不加線；表頭、勾選區塊與前後都分開 */
function dividerBefore(section: ReportSectionDef, prev: ReportSectionDef | undefined): 'line' | 'merged' | 'none' {
  if (!prev) return 'none';
  const isFrame = (s: ReportSectionDef) => s.key === 'HEADER' || s.key === 'FLAGS';
  return !section.title && !prev.title && !isFrame(section) && !isFrame(prev) ? 'merged' : 'line';
}

function SectionBlock({ section, all, store, depth, divider = 'none' }: { section: ReportSectionDef; all: ReportSectionDef[]; store: PaperStore; depth: number; divider?: 'line' | 'merged' | 'none' }) {
  // 勾了免填，它底下歸屬的區塊收起來
  const collapsedKeys = Object.entries(EXEMPT_COLLAPSE).flatMap(([flag, keys]) => (!store.renderValue && Number(store.get(flag).value) === 1 ? keys : []));
  const children = all.filter(s => s.parentKey === section.key && !collapsedKeys.includes(s.key) && isSectionShown(s, all, store));
  // 區塊內輸入欄位與起訖日期的標籤共用同一寬度（依最長標籤），不換行
  const labelWidth = labelWidthFor(section.items.flatMap(item => (item.kind === 'inputs' ? item.fields.map(f => f.label) : item.kind === 'dateRange' ? [item.range.title] : [])));
  return (
    <section style={labelWidth ? ({ '--label-w': labelWidth } as CSSProperties) : undefined} className={cn('flex flex-col gap-4', depth === 0 ? 'p-5 nav:px-6' : 'pt-2', DIVIDER_BEFORE_SECTIONS.includes(section.key) && 'border-t border-neutral-blue-gray/30 pt-4', divider === 'line' && 'border-t border-neutral-blue-gray/30', divider === 'merged' && 'pt-0')}>
      {section.title &&
        (depth === 0 ? (
          <h2 className='border-b-2 border-neutral-dark pb-2 text-[17px] font-bold text-neutral-dark'>{section.title}</h2>
        ) : (
          <h3 className='text-base font-bold text-neutral-dark'>{section.title}</h3>
        ))}
      <SectionItems items={section.items} store={store} />
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
/**
 * 整份可免填的勾選（如未分配盈餘申報書「符合背面申報須知二免申報情形之一，本年度得免填報本申報表」）：
 * 勾選放最上方，勾起來後下面的表單（含表頭的營利事業名稱、統編、收件編號）全部收起，只留這個勾選。
 */

export function PaperForm({ sections, store }: PaperFormProps) {
  const shown = sections.filter(s => (!s.parentKey || !sections.some(p => p.key === s.parentKey)) && isSectionShown(s, sections, store));
  const exemptKey = EXEMPT_FLAG_KEYS.find(k => store.page.fieldMap[k]);
  const flagRoot = exemptKey ? shown.find(s => s.fields.some(f => f.key === exemptKey)) : undefined;
  const exempt = !!exemptKey && !store.renderValue && Number(store.get(exemptKey).value) === 1;
  // 免填勾選排最上方；勾起來時只留勾選
  const ordered = flagRoot ? [flagRoot, ...shown.filter(s => s !== flagRoot)] : shown;
  const roots = exempt ? ordered.filter(s => s === flagRoot) : ordered;
  if (roots.length === 0) return null;
  return (
    <PaperStoreProvider value={store}>
      <div className='flex flex-col rounded-lg border border-neutral-blue-gray/30 bg-white'>
        {roots.map((s, i) => (
          <SectionBlock key={s.key} section={s} all={sections} store={store} depth={0} divider={dividerBefore(s, roots[i - 1])} />
        ))}
      </div>
    </PaperStoreProvider>
  );
}
