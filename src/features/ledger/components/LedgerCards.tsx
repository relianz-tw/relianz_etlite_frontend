'use client';

import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Select from '@/components/ui/Select';
import { ChevronDown, ChevronRight, CircleX, DollarSign, Download, X } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { EXPENSE_CATEGORIES, PROJECT_NAMES, SALES_CHANNELS, fmtCurrency } from '../data';
import type { PurchaseRow, PurchaseSubTab, SalesRow, SalesSubTab } from '../types';
import { useLongPress } from '../useLongPress';
import AddChannelDialog from './AddChannelDialog';
import ExportRangeDialog from './ExportRangeDialog';
import ManualEntryDialog from './ManualEntryDialog';

const ADD_CHANNEL_OPTION = '+ 新增管道';

type LedgerCardsProps = { totalCount: number; totalAmount: string } & (
  | { side: 'sales'; subTab: SalesSubTab; rows: SalesRow[] }
  | { side: 'purchase'; subTab: PurchaseSubTab; rows: PurchaseRow[] }
);

function CardShell({
  children,
  selectable,
  isSelected,
  onSelectToggle,
  longPressHandlers,
}: {
  children: ReactNode;
  selectable?: boolean;
  isSelected?: boolean;
  onSelectToggle?: () => void;
  longPressHandlers: ReturnType<typeof useLongPress>;
}) {
  return (
    <div
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      onClick={selectable ? onSelectToggle : undefined}
      onKeyDown={
        selectable
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectToggle?.();
              }
            }
          : undefined
      }
      className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
        isSelected ? 'border-brand-blue bg-brand-blue/5' : 'border-neutral-blue-gray/30 bg-white'
      } ${selectable ? 'cursor-pointer select-none' : ''}`}
      {...longPressHandlers}
    >
      {selectable && (
        <div className="pointer-events-none pt-0.5">
          <Checkbox shape="circle" checked={!!isSelected} onChange={() => {}} aria-label="選取憑證" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

function ExpandToggle({ hasChildren, expanded, onToggle }: { hasChildren: boolean; expanded: boolean; onToggle: () => void }) {
  if (!hasChildren) return null;
  return (
    <button type="button" onClick={onToggle} className="text-neutral-mid">
      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    </button>
  );
}

function ChildrenList({ children }: { children: SalesRow['children'] }) {
  if (!children) return null;
  return (
    <div className="mt-1 flex flex-col gap-1.5 border-t border-neutral-blue-gray/20 pt-2">
      {children.map(child => (
        <div key={child.id} className="flex items-center justify-between text-xs text-neutral-mid">
          <span className="font-mono">{child.label ?? child.id}</span>
          <span className="font-mono tabular-nums">{fmtCurrency(child.amount)}</span>
        </div>
      ))}
    </div>
  );
}

function SalesCard({
  row,
  subTab,
  expanded,
  onToggle,
  channels,
  channelValue,
  onChannelSelect,
  onManualEntry,
  selectionMode,
  isSelected,
  onSelectToggle,
  onLongPressStart,
}: {
  row: SalesRow;
  subTab: SalesSubTab;
  expanded: boolean;
  onToggle: () => void;
  channels: string[];
  channelValue: string;
  onChannelSelect: (value: string) => void;
  onManualEntry: () => void;
  selectionMode: boolean;
  isSelected: boolean;
  onSelectToggle: () => void;
  onLongPressStart: (id: string) => void;
}) {
  const longPress = useLongPress({ onLongPress: () => onLongPressStart(row.id) });
  return (
    <CardShell selectable={selectionMode} isSelected={isSelected} onSelectToggle={onSelectToggle} longPressHandlers={longPress}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {!selectionMode && <ExpandToggle hasChildren={!!row.children} expanded={expanded} onToggle={onToggle} />}
          <span className="font-mono text-[15px] font-semibold text-neutral-dark">{row.id}</span>
        </div>
        <span className="whitespace-nowrap font-mono text-xs text-neutral-mid">{row.date}</span>
      </div>
      <div className="truncate text-[13px] text-neutral-mid">{row.counterparty}</div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-lg font-semibold tabular-nums text-neutral-dark">{fmtCurrency(row.amount)}</span>
        {!selectionMode && (
          <div className="flex gap-1.5">
            {subTab === 'receivable' && (
              <Button size="sm" variant="outline" icon={DollarSign} onClick={onManualEntry}>
                入帳
              </Button>
            )}
            {row.voided ? (
              <span className="rounded-md bg-surface-cream px-2.5 py-1 text-xs font-semibold text-neutral-mid">已作廢</span>
            ) : (
              <Button size="sm" variant="ghost" icon={CircleX}>
                作廢
              </Button>
            )}
          </div>
        )}
      </div>
      {!selectionMode && subTab === 'received' && (
        <Select widthClassName="w-full" value={channelValue} onValueChange={onChannelSelect}>
          {channels.map(c => (
            <option key={c}>{c}</option>
          ))}
          <option>{ADD_CHANNEL_OPTION}</option>
        </Select>
      )}
      {!selectionMode && expanded && <ChildrenList children={row.children} />}
    </CardShell>
  );
}

function PurchaseCard({
  row,
  expanded,
  onToggle,
  selectionMode,
  isSelected,
  onSelectToggle,
  onLongPressStart,
  categoryValue,
  onCategorySelect,
  projectValue,
  onProjectSelect,
}: {
  row: PurchaseRow;
  expanded: boolean;
  onToggle: () => void;
  selectionMode: boolean;
  isSelected: boolean;
  onSelectToggle: () => void;
  onLongPressStart: (id: string) => void;
  categoryValue: string;
  onCategorySelect: (value: string) => void;
  projectValue: string;
  onProjectSelect: (value: string) => void;
}) {
  const locked = row.source !== 'invoice';
  const longPress = useLongPress({ onLongPress: () => onLongPressStart(row.id) });
  return (
    <CardShell selectable={selectionMode} isSelected={isSelected} onSelectToggle={onSelectToggle} longPressHandlers={longPress}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {!selectionMode && <ExpandToggle hasChildren={!!row.children} expanded={expanded} onToggle={onToggle} />}
          <span className="font-mono text-[15px] font-semibold text-neutral-dark">{row.id}</span>
        </div>
        <span className="whitespace-nowrap font-mono text-xs text-neutral-mid">{row.date}</span>
      </div>
      <div className="truncate text-[13px] text-neutral-mid">{row.party}</div>
      <span className="font-mono text-lg font-semibold tabular-nums text-neutral-dark">{fmtCurrency(row.amount)}</span>
      {!selectionMode && (
        <div className="grid grid-cols-2 gap-2">
          <Select widthClassName="w-full" value={locked ? row.category : categoryValue} onValueChange={onCategorySelect} disabled={locked}>
            {locked ? <option>{row.category}</option> : EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </Select>
          <Select widthClassName="w-full" value={locked ? row.project || '未指定專案' : projectValue} onValueChange={onProjectSelect} disabled={locked}>
            {locked ? <option>{row.project || '未指定專案'}</option> : PROJECT_NAMES.map(p => <option key={p || 'none'}>{p || '未指定專案'}</option>)}
          </Select>
        </div>
      )}
      {!selectionMode && expanded && <ChildrenList children={row.children} />}
    </CardShell>
  );
}

export default function LedgerCards(props: LedgerCardsProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [channels, setChannels] = useState(SALES_CHANNELS);
  const [channelOverrides, setChannelOverrides] = useState<Record<string, string>>({});
  const [addChannelRowId, setAddChannelRowId] = useState<string | null>(null);
  const [manualEntryRow, setManualEntryRow] = useState<SalesRow | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  const [projectOverrides, setProjectOverrides] = useState<Record<string, string>>({});
  const [batchCategory, setBatchCategory] = useState('');
  const [batchProject, setBatchProject] = useState('');

  const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const handleChannelSelect = (rowId: string, value: string) => {
    if (value === ADD_CHANNEL_OPTION) {
      setAddChannelRowId(rowId);
      return;
    }
    setChannelOverrides(o => ({ ...o, [rowId]: value }));
  };
  const handleChannelCreated = (name: string) => {
    setChannels(c => [...c, name]);
    if (addChannelRowId) setChannelOverrides(o => ({ ...o, [addChannelRowId]: name }));
    setAddChannelRowId(null);
  };

  // 長按任一卡片進入選擇模式並選取該卡；再次長按或點擊其他卡片皆為切換選取
  const enterSelectionMode = (id: string) => {
    setSelectionMode(true);
    setSelected(s => ({ ...s, [id]: true }));
  };
  const toggleSelect = (id: string) => setSelected(s => ({ ...s, [id]: !s[id] }));
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelected({});
    setBatchCategory('');
    setBatchProject('');
  };

  const rowIds = props.rows.map(r => r.id);
  const selectedCount = rowIds.filter(id => selected[id]).length;
  const allSelected = rowIds.length > 0 && selectedCount === rowIds.length;
  const toggleSelectAll = () => setSelected(allSelected ? {} : Object.fromEntries(rowIds.map(id => [id, true])));
  const selectedAmount = fmtCurrency(props.rows.filter(r => selected[r.id]).reduce((sum, r) => sum + r.amount, 0));

  // 批次套用費用類別／專案：僅作用於發票來源（可編輯）的已選列，勞報單／薪資列固定不受影響
  const editableSelectedIds =
    props.side === 'purchase' ? props.rows.filter(r => selected[r.id] && r.source === 'invoice').map(r => r.id) : [];
  const handleBatchApply = () => {
    if (batchCategory) setCategoryOverrides(o => ({ ...o, ...Object.fromEntries(editableSelectedIds.map(id => [id, batchCategory])) }));
    if (batchProject) setProjectOverrides(o => ({ ...o, ...Object.fromEntries(editableSelectedIds.map(id => [id, batchProject])) }));
    setBatchCategory('');
    setBatchProject('');
  };

  return (
    <div className="flex flex-col gap-2.5 nav:hidden">
      <AddChannelDialog open={addChannelRowId !== null} onClose={() => setAddChannelRowId(null)} onSubmit={handleChannelCreated} />
      <ManualEntryDialog
        open={manualEntryRow !== null}
        onClose={() => setManualEntryRow(null)}
        row={manualEntryRow}
        onSubmit={() => setManualEntryRow(null)}
      />
      <ExportRangeDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} onExport={() => setExportDialogOpen(false)} />

      {/* 頂部摘要／選擇操作列：sticky 貼在 Navbar（h-16）下方 */}
      <div className="sticky top-16 z-40 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-blue-gray/30 bg-white p-4">
        {selectionMode ? (
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <Checkbox checked={allSelected} onChange={toggleSelectAll} aria-label={allSelected ? '取消全選' : '全選'} />
              <button type="button" onClick={toggleSelectAll} className="text-sm font-semibold text-neutral-dark">
                {allSelected ? '取消全選' : '全選'}
              </button>
              <span className="whitespace-nowrap text-sm text-neutral-mid">
                已選 <span className="font-semibold text-neutral-dark">{selectedCount}</span> 筆{' '}
                <span className="font-mono font-semibold tabular-nums text-neutral-dark">{selectedAmount}</span>
              </span>
            </div>
            <Button variant="ghost" size="sm" icon={X} onClick={exitSelectionMode}>
              取消
            </Button>
          </>
        ) : (
          <>
            <span className="text-sm text-neutral-mid">
              目前顯示 <span className="font-semibold text-neutral-dark">{props.totalCount}</span> 筆{' '}
              <span className="font-mono font-semibold tabular-nums text-neutral-dark">{props.totalAmount}</span>
            </span>
            <Button variant="warm" size="sm" icon={Download} onClick={() => setExportDialogOpen(true)}>
              匯出總表
            </Button>
          </>
        )}
      </div>

      {selectionMode && props.side === 'purchase' && (
        <div className="flex flex-col gap-2 rounded-md border border-neutral-blue-gray/30 bg-white p-4">
          <div className="grid grid-cols-2 gap-2">
            <Select widthClassName="w-full" value={batchCategory} onValueChange={setBatchCategory}>
              <option value="">變更費用類別</option>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select widthClassName="w-full" value={batchProject} onValueChange={setBatchProject}>
              <option value="">變更專案</option>
              {PROJECT_NAMES.filter(Boolean).map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="primary"
            size="md"
            className="w-full"
            disabled={editableSelectedIds.length === 0 || (!batchCategory && !batchProject)}
            onClick={handleBatchApply}
          >
            變更
          </Button>
        </div>
      )}

      {props.side === 'sales'
        ? props.rows.map(row => (
            <SalesCard
              key={row.id}
              row={row}
              subTab={props.subTab}
              expanded={!!expanded[row.id]}
              onToggle={() => toggleExpand(row.id)}
              channels={channels}
              channelValue={channelOverrides[row.id] ?? row.channel}
              onChannelSelect={v => handleChannelSelect(row.id, v)}
              onManualEntry={() => setManualEntryRow(row)}
              selectionMode={selectionMode}
              isSelected={!!selected[row.id]}
              onSelectToggle={() => toggleSelect(row.id)}
              onLongPressStart={enterSelectionMode}
            />
          ))
        : props.rows.map(row => (
            <PurchaseCard
              key={row.id}
              row={row}
              expanded={!!expanded[row.id]}
              onToggle={() => toggleExpand(row.id)}
              selectionMode={selectionMode}
              isSelected={!!selected[row.id]}
              onSelectToggle={() => toggleSelect(row.id)}
              onLongPressStart={enterSelectionMode}
              categoryValue={categoryOverrides[row.id] ?? row.category}
              onCategorySelect={v => setCategoryOverrides(o => ({ ...o, [row.id]: v }))}
              projectValue={projectOverrides[row.id] ?? row.project}
              onProjectSelect={v => setProjectOverrides(o => ({ ...o, [row.id]: v }))}
            />
          ))}
    </div>
  );
}
