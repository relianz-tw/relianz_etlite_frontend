'use client';

import { Fragment, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Plus, X } from 'lucide-react';
import type { ReportFieldDef, ReportPaperTableDef, ReportTableColumnDef } from '../../reports/types';
import { RowCards } from '../ReportTable';
import { computeRowFieldValue } from '../../reports/formula';
import { FieldInput, StoreFieldInput } from './FieldInput';
import { isFieldShown, usePaperStore } from './PaperStore';

/** 紙本斜線（不可填的格子、左上角斜線格）：對角線用既有 neutral-blue-gray token */
const SLASH_CLASS = 'bg-[linear-gradient(to_bottom_right,transparent_calc(50%-0.5px),theme(colors.neutral.blue-gray)_50%,transparent_calc(50%+0.5px))]';

/** 固定列超過此數量且有辨識值時，沒有值的列預設收合 */
const ROW_COLLAPSE_THRESHOLD = 6;

const TOTAL_ROW_NOS = ['TOTAL', 'SUBTOTAL'];

interface HeaderCell {
  text: string;
  colSpan: number;
  rowSpan: number;
  refNo?: string;
  official?: string;
}

/** 欄標題與合併表頭：columns[].groups 由上到下，相鄰欄且前綴相同的群組合併，沒有群組的欄標題往下跨列 */
function buildHeader(columns: ReportTableColumnDef[]): HeaderCell[][] {
  const depth = Math.max(0, ...columns.map(c => c.groups.length));
  const rows: HeaderCell[][] = [];
  const samePrefix = (a: string[], b: string[], upTo: number) => a.slice(0, upTo + 1).join('\u0000') === b.slice(0, upTo + 1).join('\u0000');
  for (let level = 0; level <= depth; level++) {
    const cells: HeaderCell[] = [];
    let i = 0;
    while (i < columns.length) {
      const c = columns[i];
      if (level < c.groups.length) {
        let j = i + 1;
        while (j < columns.length && columns[j].groups.length > level && samePrefix(columns[j].groups, c.groups, level)) j++;
        cells.push({ text: c.groups[level], colSpan: j - i, rowSpan: 1 });
        i = j;
      } else {
        if (level === c.groups.length) cells.push({ text: c.title, colSpan: 1, rowSpan: depth - c.groups.length + 1, refNo: c.refNo, official: c.officialCode });
        i++;
      }
    }
    rows.push(cells);
  }
  return rows;
}

/** 格子：紙本編號放輸入框左側同一行（對帳模式為三值）；欄標題已經有代號時格子不再重複顯示 */
function Cell({ field, hideCode }: { field: ReportFieldDef; hideCode?: boolean }) {
  const hasCode = !hideCode && (field.officialCode || field.refNo);
  return (
    <div className='flex min-w-[120px] items-center gap-1.5'>
      {hasCode && <span className='shrink-0 text-[11px] font-bold leading-none text-brand-blue'>{[field.officialCode, field.refNo].filter(Boolean).join(' ')}</span>}
      <div className='min-w-0 flex-1'>
        <StoreFieldInput field={field} />
      </div>
    </div>
  );
}

const GROUP_TOKEN = /(\{\{field:[^}]+\}\})/g;

interface RowGroup {
  /** 屬於這一組的資料列索引（store.rows 的位置） */
  indices: number[];
}

/** 把連續且分組欄位值相同的列併成一組；分組欄位全空的列也併成連續一組（填入類別後才會分開） */
function buildRowGroups(rows: Record<string, { value: string | number }>[], keys: string[]): RowGroup[] {
  const groups: RowGroup[] = [];
  let lastKey: string | null = null;
  rows.forEach((row, index) => {
    const key = keys.map(k => String(row[k]?.value ?? '')).join('\u0000');
    if (key === lastKey) groups[groups.length - 1].indices.push(index);
    else groups.push({ indices: [index] });
    lastKey = key;
  });
  return groups;
}

/** 分組標題列：headerTemplate 的 {{field:X}} 畫成輸入框，改值時同組每一列一起改 */
function GroupHeader({ template, fields, group }: { template: string; fields: ReportFieldDef[]; group: RowGroup }) {
  const store = usePaperStore();
  const first = store.rows[group.indices[0]];
  return (
    <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-neutral-dark'>
      {template.split(GROUP_TOKEN).map((part, i) => {
        const m = /^\{\{field:([^}]+)\}\}$/.exec(part);
        if (!m) return <span key={i}>{part}</span>;
        const field = fields.find(f => f.key === m[1]);
        if (!field) return null;
        return (
          <span key={i} className='inline-block w-44 align-middle font-normal'>
            <FieldInput field={field} data={first?.[field.key] ?? { value: '', aiFilled: false }} onChange={value => group.indices.forEach(index => store.setRowField(index, field.key, value))} />
          </span>
        );
      })}
    </div>
  );
}

/** 紙本表格（metadata tables[]）：多層表頭、斜線角、斜線格、列標題合併、合計列、可新增列與序號 */
export function PaperTable({ table }: { table: ReportPaperTableDef }) {
  const store = usePaperStore();
  const [open, setOpen] = useState(false);

  // 可重複列的表格一進來預設有一列空白列（只在進頁時補，之後使用者可以刪光）；對帳頁不補、列欄位對不上表頭改用卡片的也不補
  useEffect(() => {
    const grid = table.repeatable && (table.rowColumnsMatch || table.rowColumns.length === 0);
    if (grid && !store.renderValue && store.rows.length === 0) store.addRow([...table.rowColumns, ...table.groupFields]);
    // 只在進頁時執行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const header = buildHeader(table.columns);
  const hasGroupCol = table.rows.some(r => r.group);
  const hasLabelCol = table.rows.some(r => r.label) || !!table.corner;
  const hasNumber = !!table.rowNumber;
  const headerDepth = header.length;

  // 可重複表但列欄位對不上表頭：資料列改用卡片，固定列（合計）仍畫成表格
  const cardFallback = table.repeatable && !table.rowColumnsMatch && table.rowColumns.length > 0;
  const gridRepeatable = table.repeatable && !cardFallback;

  const cellOf = (rowNo: string | number, columnCode: string) => table.cells[`${rowNo}|${columnCode}`];
  const rowCells = (rowNo: string | number) => table.columns.map(c => cellOf(rowNo, c.code)).filter((f): f is ReportFieldDef => !!f);
  const rowShown = (rowNo: string | number) => rowCells(rowNo).some(f => isFieldShown(f, store));
  const rowFilled = (rowNo: string | number) => rowCells(rowNo).some(f => store.isFilled(f));

  // 對帳模式只列有數字的列
  // 有分組時小計列改為每組各畫一列，固定列只留合計
  const grouped = !!table.groupBy && gridRepeatable;
  const fixedRows = table.rows.filter(r => (grouped && r.rowNo === 'SUBTOTAL' ? false : store.renderValue ? rowShown(r.rowNo) : true));
  const canCollapse = store.canCollapse && fixedRows.length > ROW_COLLAPSE_THRESHOLD;
  const isCollapsible = (rowNo: string | number) => !TOTAL_ROW_NOS.includes(String(rowNo)) && !rowFilled(rowNo);
  const visibleRows = canCollapse && !open ? fixedRows.filter(r => !isCollapsible(r.rowNo)) : fixedRows;
  const hiddenCount = fixedRows.length - visibleRows.length;

  const dataRows = gridRepeatable ? store.rows : [];
  const showGrid = visibleRows.length > 0 || gridRepeatable;
  if (!showGrid && !cardFallback) return null;

  // 合併列標題：rowGroup 相同且相鄰的列，第一列放群組格並 rowSpan
  const groupSpan = (index: number) => {
    const g = visibleRows[index].group;
    if (!g || (index > 0 && visibleRows[index - 1].group === g)) return 0;
    let n = 1;
    while (index + n < visibleRows.length && visibleRows[index + n].group === g) n++;
    return n;
  };

  // 表名本身已以「明細」結尾（如「投資人明細」）就不再重複加字
  const addLabel = `新增一列${table.title ?? ''}${table.title?.endsWith('明細') ? '' : '明細'}`;
  const border = 'border border-neutral-blue-gray/30';

  const leadCols = (hasNumber ? 1 : 0) + (hasGroupCol ? 1 : 0) + (hasLabelCol ? 1 : 0);

  const renderDataRow = (row: Record<string, { value: string | number; aiFilled: boolean }>, index: number) => (
    <tr key={`data-${index}`}>
      {hasNumber && <td className={cn(border, 'px-2 text-center tabular-nums text-neutral-mid')}>{String(index + 1).padStart(table.rowNumber?.pad || 1, '0')}</td>}
      {hasGroupCol && <td className={border} />}
      {hasLabelCol && <td className={border} />}
      {table.columns.map(c => {
        const col = table.rowColumns.find(f => f.columnCode === c.code);
        return (
          <td key={c.code} className={cn(border, 'min-w-[120px] p-1.5 align-middle')}>
            {col && <FieldInput field={col} data={row[col.key] ?? { value: '', aiFilled: false }} autoValue={computeRowFieldValue(col, table.rowColumns, row)} onChange={value => store.setRowField(index, col.key, value)} />}
          </td>
        );
      })}
      <td className={cn(border, 'px-1 text-center')}>
        <button type='button' onClick={() => store.removeRow(index)} aria-label='刪除此列' className='rounded-full p-1 text-neutral-mid hover:bg-surface-cream hover:text-neutral-dark'>
          <X size={16} />
        </button>
      </td>
    </tr>
  );

  // 新增一列：有分組時沿用最後一組的分組欄位值（加進同一組）；新增類別則分組欄位留空，自成一組
  const addDataRow = (inheritGroup: boolean) => {
    const at = store.rows.length;
    const last = store.rows[at - 1];
    store.addRow([...table.rowColumns, ...table.groupFields]);
    if (inheritGroup && last) for (const f of table.groupFields) store.setRowField(at, f.key, last[f.key]?.value ?? '');
  };


  return (
    <div className='flex min-w-0 flex-col gap-2'>
      {(table.title || table.note) && (
        <div className='flex flex-wrap items-baseline gap-x-3'>
          {table.title && <h3 className='text-base font-bold text-neutral-dark'>{table.title}</h3>}
          {table.note && <span className='text-[13px] text-neutral-mid'>{table.note}</span>}
        </div>
      )}

      {showGrid && (
        <div className='overflow-x-auto rounded-lg border border-neutral-blue-gray/30'>
          <table className='w-full border-collapse text-sm'>
            <thead className='bg-surface-cream text-xs font-bold text-neutral-dark'>
              {header.map((cells, level) => (
                <tr key={level}>
                  {level === 0 && hasNumber && (
                    <th rowSpan={headerDepth} className={cn(border, 'w-14 px-2 py-2 text-center')}>
                      {table.rowNumber?.title}
                    </th>
                  )}
                  {level === 0 && hasGroupCol && <th rowSpan={headerDepth} className={cn(border, 'px-2 py-2')} />}
                  {level === 0 && hasLabelCol && (
                    <th rowSpan={headerDepth} className={cn(border, 'min-w-[140px] p-0', table.corner && SLASH_CLASS)}>
                      {table.corner && (
                        <div className='flex h-full min-h-14 flex-col justify-between px-2 py-1'>
                          <span className='text-right'>{table.corner.column}</span>
                          <span className='text-left'>{table.corner.row}</span>
                        </div>
                      )}
                    </th>
                  )}
                  {cells.map((c, i) => (
                    <th key={i} colSpan={c.colSpan} rowSpan={c.rowSpan} className={cn(border, 'px-2 py-2 text-center align-middle')}>
                      {c.text}
                      {c.official && <span className='ml-1 text-brand-blue'>({c.official})</span>}
                      {c.refNo && <span className='ml-1 text-brand-blue'>{c.refNo}</span>}
                    </th>
                  ))}
                  {level === 0 && gridRepeatable && !store.renderValue && <th rowSpan={headerDepth} className={cn(border, 'w-10')} />}
                </tr>
              ))}
            </thead>
            <tbody>
              {grouped
                ? buildRowGroups(dataRows, table.groupBy!.fieldCodes).map((group, gi) => (
                    <Fragment key={`group-${gi}`}>
                      <tr className='bg-surface-cream/60'>
                        <td colSpan={leadCols + table.columns.length + 1} className={cn(border, 'px-2 py-2')}>
                          {table.groupBy!.headerTemplate && <GroupHeader template={table.groupBy!.headerTemplate} fields={table.groupFields} group={group} />}
                        </td>
                      </tr>
                      {group.indices.map(index => renderDataRow(dataRows[index], index))}
                      <tr className='font-bold'>
                        {Array.from({ length: leadCols }).map((_, i) => (
                          <td key={i} className={cn(border, 'px-2 py-1.5 align-middle text-neutral-dark')}>
                            {i === leadCols - 1 ? table.groupBy!.subtotalLabel : null}
                          </td>
                        ))}
                        {table.columns.map(c =>
                          cellOf('SUBTOTAL', c.code) ? (
                            <td key={c.code} className={cn(border, 'p-1.5 align-middle')}>
                              {/* 各組小計由後端算（formula.scope=group），欄位只有一個值，無法逐組顯示，這裡固定顯示「—」 */}
                              <div className='flex h-10 items-center justify-end rounded-lg border-[1.5px] border-neutral-blue-gray/30 bg-surface-cream px-3 text-sm text-neutral-dark'>—</div>
                            </td>
                          ) : (
                            <td key={c.code} className={cn(border, SLASH_CLASS)} />
                          )
                        )}
                        <td className={border} />
                      </tr>
                    </Fragment>
                  ))
                : dataRows.map((row, index) => renderDataRow(row, index))}
              {visibleRows.map((row, index) => {
                const total = TOTAL_ROW_NOS.includes(String(row.rowNo));
                const span = groupSpan(index);
                return (
                  <tr key={String(row.rowNo)} className={cn(total && 'font-bold')}>
                    {hasNumber && <td className={border} />}
                    {hasGroupCol && span > 0 && (
                      <td rowSpan={span} className={cn(border, 'px-2 py-1.5 align-middle font-medium text-neutral-dark')}>
                        {row.group}
                      </td>
                    )}
                    {hasGroupCol && !row.group && <td className={border} />}
                    {hasLabelCol && <td className={cn(border, 'px-2 py-1.5 align-middle text-neutral-dark')}>{row.label}</td>}
                    {table.columns.map(c => {
                      const f = cellOf(row.rowNo, c.code);
                      // 紙本斜線：沒有欄位的格子畫斜線；對帳模式下有欄位但沒有數字的格子留白
                      if (!f || f.hidden) return <td key={c.code} className={cn(border, SLASH_CLASS)} />;
                      return (
                        <td key={c.code} className={cn(border, 'p-1.5 align-middle')}>
                          {isFieldShown(f, store) && <Cell field={f} hideCode={!!(c.refNo || c.officialCode)} />}
                        </td>
                      );
                    })}
                    {gridRepeatable && !store.renderValue && <td className={border} />}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {canCollapse && (hiddenCount > 0 || (open && fixedRows.some(r => isCollapsible(r.rowNo)))) && (
        <button type='button' onClick={() => setOpen(v => !v)} className='flex items-center gap-1 self-start px-1 py-1 text-[13px] font-medium text-brand-blue hover:underline'>
          <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
          {open ? '收合沒有金額的列' : `顯示其餘 ${hiddenCount} 列沒有金額的項目`}
        </button>
      )}

      {cardFallback && <RowCards columns={table.rowColumns} addLabel={addLabel} />}

      {gridRepeatable && !store.renderValue && (
        <div className={cn('grid gap-2', grouped ? 'sm:grid-cols-2' : 'grid-cols-1')}>
          <button
            type='button'
            onClick={() => addDataRow(true)}
            className='flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-blue-gray/50 py-3 text-sm font-medium text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5'
          >
            <Plus size={16} />
            {addLabel}
          </button>
          {grouped && (
            <button
              type='button'
              onClick={() => addDataRow(false)}
              className='flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-blue-gray/50 py-3 text-sm font-medium text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5'
            >
              <Plus size={16} />
              新增類別
            </button>
          )}
        </div>
      )}
    </div>
  );
}
