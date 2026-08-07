'use client';

import { settlePayable, settleReceivable } from '@/api/ledger';
import type { ManualSettleAllocation, SettleSummaryFee } from '@/api/types';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Select from '@/components/ui/Select';
import { SubjectNameSelect } from '@/components/ui/SubjectSelect';
import ExportRangeDialog from '@/components/ui/ExportRangeDialog';
import ExportSelectedDialog from '@/components/ui/ExportSelectedDialog';
import { fmtCurrency } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronRight, CircleX, DollarSign, Download, FileMinus, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { PurchaseRow, PurchaseSubTab, SalesRow, SalesSubTab, SortKey, SortState } from '../types';
import { withReturnParam } from '../urlState';
import { useLongPress } from '../useLongPress';
import ManualEntryDialog from './ManualEntryDialog';

const SORT_KEY_LABELS: Record<SortKey, string> = {
  id: '交易編號',
  amount: '交易金額',
  counterparty: '往來對象',
  date: '開立日期',
};
const SORT_KEYS: SortKey[] = ['id', 'amount', 'counterparty', 'date'];

type LedgerCardsProps = {
  totalCount: number;
  totalAmount: string;
  sort: SortState;
  onSortFieldChange: (key: SortKey | null) => void;
  onSortDirToggle: () => void;
} & (
  | { side: 'sales'; subTab: SalesSubTab; rows: SalesRow[]; onReceivableSettled?: () => void; channelNameByUuid: Map<string, string> }
  | { side: 'purchase'; subTab: PurchaseSubTab; rows: PurchaseRow[]; onPayableSettled?: () => void }
);

/** 銷售管道唯讀顯示：帳簿列表無單筆交易更新管道的 API，故僅反查真實 paymentChannelUuid 顯示名稱，不提供編輯 */
function channelLabel(row: SalesRow, channelNameByUuid: Map<string, string>): string {
  if (!row.paymentChannelUuid) return '未分類';
  return channelNameByUuid.get(row.paymentChannelUuid) ?? '未知';
}

/** 手機排序入口：下拉選欄位（預設 asc）＋方向鈕（僅切換 asc/desc），與桌機表格共用同一份排序資料 */
function MobileSortControl({
  sort,
  onFieldChange,
  onDirToggle,
}: {
  sort: SortState;
  onFieldChange: (key: SortKey | null) => void;
  onDirToggle: () => void;
}) {
  const DirIcon = sort.dir === 'asc' ? ArrowUp : sort.dir === 'desc' ? ArrowDown : ArrowUpDown;
  return (
    <div className="flex items-center gap-1.5">
      <Select widthClassName="w-32" value={sort.key ?? ''} onValueChange={v => onFieldChange(v ? (v as SortKey) : null)}>
        <option value="">不排序</option>
        {SORT_KEYS.map(key => (
          <option key={key} value={key}>
            {SORT_KEY_LABELS[key]}
          </option>
        ))}
      </Select>
      <Button variant="ghost" size="sm" icon={DirIcon} disabled={!sort.key} onClick={onDirToggle} aria-label="切換排序方向" />
    </div>
  );
}

function CardShell({
  children,
  selectable,
  isSelected,
  onSelectToggle,
  onCardClick,
  longPressHandlers,
}: {
  children: ReactNode;
  selectable?: boolean;
  isSelected?: boolean;
  onSelectToggle?: () => void;
  /** 非選取模式下點卡片本身（非內部控制項）觸發，用於導向交易編輯頁 */
  onCardClick?: () => void;
  longPressHandlers: ReturnType<typeof useLongPress>;
}) {
  const handleClick = selectable ? onSelectToggle : onCardClick;
  return (
    <div
      role={handleClick ? 'button' : undefined}
      tabIndex={handleClick ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={
        handleClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
        isSelected ? 'border-brand-blue bg-brand-blue/5' : 'border-neutral-blue-gray/30 bg-white'
      } ${handleClick ? 'cursor-pointer select-none' : ''}`}
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
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        onToggle();
      }}
      className="text-neutral-mid"
    >
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
  channelText,
  onManualEntry,
  onCardClick,
  selectionMode,
  isSelected,
  onSelectToggle,
  onLongPressStart,
  allowanceCount,
}: {
  row: SalesRow;
  subTab: SalesSubTab;
  expanded: boolean;
  onToggle: () => void;
  channelText: string;
  onManualEntry: () => void;
  onCardClick: () => void;
  selectionMode: boolean;
  isSelected: boolean;
  onSelectToggle: () => void;
  onLongPressStart: (id: string) => void;
  allowanceCount: number;
}) {
  const longPress = useLongPress({ onLongPress: () => onLongPressStart(row.id) });
  return (
    <CardShell
      selectable={selectionMode}
      isSelected={isSelected}
      onSelectToggle={onSelectToggle}
      onCardClick={onCardClick}
      longPressHandlers={longPress}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {!selectionMode && <ExpandToggle hasChildren={!!row.children} expanded={expanded} onToggle={onToggle} />}
          <span className="font-mono text-[15px] font-semibold text-neutral-dark">{row.id}</span>
        </div>
        <span className="whitespace-nowrap font-mono text-xs text-neutral-mid">{row.date}</span>
      </div>
      <div className="truncate text-[13px] text-neutral-mid" title={row.counterparty}>{row.counterparty}</div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-lg font-semibold tabular-nums text-neutral-dark">{fmtCurrency(row.amount)}</span>
        {!selectionMode && (
          <div className="flex flex-wrap justify-end gap-1.5" onClick={e => e.stopPropagation()}>
            {subTab === 'receivable' && (
              <Button size="sm" variant="outline" icon={DollarSign} onClick={onManualEntry}>
                入帳
              </Button>
            )}
            {row.voided ? (
              <span className="rounded-md bg-surface-cream px-2.5 py-1 text-xs font-semibold text-neutral-mid">已作廢</span>
            ) : (
              <Button size="sm" variant="ghost" icon={CircleX} disabled title="作廢功能尚未串接後端 API">
                作廢
              </Button>
            )}
            <Button size="sm" variant="ghost" icon={FileMinus} disabled title="折讓功能尚未串接後端 API">
              {allowanceCount > 0 ? `折讓 (${allowanceCount})` : '折讓'}
            </Button>
          </div>
        )}
      </div>
      {!selectionMode && subTab === 'received' && <div className="truncate text-xs text-neutral-mid">{channelText}</div>}
      {!selectionMode && expanded && <ChildrenList children={row.children} />}
    </CardShell>
  );
}

function PurchaseCard({
  row,
  subTab,
  expanded,
  onToggle,
  onManualEntry,
  onCardClick,
  selectionMode,
  isSelected,
  onSelectToggle,
  onLongPressStart,
  categoryValue,
  onCategorySelect,
}: {
  row: PurchaseRow;
  subTab: PurchaseSubTab;
  expanded: boolean;
  onToggle: () => void;
  onManualEntry: () => void;
  onCardClick: () => void;
  selectionMode: boolean;
  isSelected: boolean;
  onSelectToggle: () => void;
  onLongPressStart: (id: string) => void;
  categoryValue: string;
  onCategorySelect: (value: string) => void;
}) {
  const locked = row.source !== 'invoice';
  const longPress = useLongPress({ onLongPress: () => onLongPressStart(row.id) });
  return (
    <CardShell
      selectable={selectionMode}
      isSelected={isSelected}
      onSelectToggle={onSelectToggle}
      onCardClick={onCardClick}
      longPressHandlers={longPress}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {!selectionMode && <ExpandToggle hasChildren={!!row.children} expanded={expanded} onToggle={onToggle} />}
          <span className="font-mono text-[15px] font-semibold text-neutral-dark">{row.id}</span>
        </div>
        <span className="whitespace-nowrap font-mono text-xs text-neutral-mid">{row.date}</span>
      </div>
      <div className="truncate text-[13px] text-neutral-mid" title={row.party}>{row.party}</div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-lg font-semibold tabular-nums text-neutral-dark">{fmtCurrency(row.amount)}</span>
        {!selectionMode && subTab === 'payable' && (
          <div onClick={e => e.stopPropagation()}>
            <Button size="sm" variant="outline" icon={DollarSign} onClick={onManualEntry}>
              入帳
            </Button>
          </div>
        )}
      </div>
      {!selectionMode && (
        <div className="grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
          <SubjectNameSelect value={locked ? row.category : categoryValue} onChange={onCategorySelect} disabled={locked} />
          <span className="flex h-10 items-center truncate px-1 text-sm text-neutral-mid" title={row.project || '未指定專案'}>
            {row.project || '未指定專案'}
          </span>
        </div>
      )}
      {!selectionMode && expanded && <ChildrenList children={row.children} />}
    </CardShell>
  );
}

export default function LedgerCards(props: LedgerCardsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const goToTransaction = (id: string) => router.push(withReturnParam(`/ledger/${id}?side=${props.side}`, searchParams));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [manualEntryRow, setManualEntryRow] = useState<SalesRow | PurchaseRow | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportSelectedOpen, setExportSelectedOpen] = useState(false);
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  const [batchCategory, setBatchCategory] = useState('');

  const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // 依銷項/進項呼叫 /ael/ledger/receivables/settle 或 /ael/ledger/payables/settle 送出手動入帳；
  // 成功後觸發父層重新查詢應收/應付帳款列表
  const handleManualSettle = async (allocation: ManualSettleAllocation) => {
    const allocations: SettleSummaryFee[] = allocation.feeAmount > 0 ? [{ name: '手續費', feeAmount: allocation.feeAmount }] : [];
    if (props.side === 'sales') {
      await settleReceivable({
        ledgerUuid: allocation.ledgerUuid,
        paymentDate: allocation.paymentDate,
        bankAccountUuid: allocation.bankAccountUuid,
        settleAmount: allocation.amount,
        depositAmount: allocation.actualAmount,
        memo: '',
        allocations,
      });
      props.onReceivableSettled?.();
    } else {
      await settlePayable({
        ledgerUuid: allocation.ledgerUuid,
        paymentDate: allocation.paymentDate,
        bankAccountUuid: allocation.bankAccountUuid,
        settleAmount: allocation.amount,
        paymentAmount: allocation.actualAmount,
        memo: '',
        allocations,
      });
      props.onPayableSettled?.();
    }
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
  };

  const rowIds = props.rows.map(r => r.id);
  const selectedCount = rowIds.filter(id => selected[id]).length;
  const allSelected = rowIds.length > 0 && selectedCount === rowIds.length;
  const toggleSelectAll = () => setSelected(allSelected ? {} : Object.fromEntries(rowIds.map(id => [id, true])));
  const selectedAmount = fmtCurrency(props.rows.filter(r => selected[r.id]).reduce((sum, r) => sum + r.amount, 0));

  // 批次套用費用類別：僅作用於發票來源（可編輯）的已選列，勞報單／薪資列固定不受影響；
  // 專案欄位純前端無持久化，已停用編輯
  const editableSelectedIds =
    props.side === 'purchase' ? props.rows.filter(r => selected[r.id] && r.source === 'invoice').map(r => r.id) : [];
  const handleBatchApply = () => {
    setCategoryOverrides(o => ({ ...o, ...Object.fromEntries(editableSelectedIds.map(id => [id, batchCategory])) }));
    setBatchCategory('');
  };

  return (
    <div className="flex flex-col gap-2.5 nav:hidden">
      <ManualEntryDialog
        open={manualEntryRow !== null}
        onClose={() => setManualEntryRow(null)}
        side={props.side}
        row={manualEntryRow}
        onSubmit={handleManualSettle}
      />
      <ExportRangeDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} onExport={() => setExportDialogOpen(false)} />
      <ExportSelectedDialog
        open={exportSelectedOpen}
        onClose={() => setExportSelectedOpen(false)}
        selectedCount={selectedCount}
        selectedAmount={selectedAmount}
        onExport={() => setExportSelectedOpen(false)}
      />

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
            <div className="flex items-center gap-2">
              <Button
                variant="warm"
                size="sm"
                icon={Download}
                disabled={selectedCount === 0}
                onClick={() => setExportSelectedOpen(true)}
              >
                匯出所選
              </Button>
              <Button variant="ghost" size="sm" icon={X} onClick={exitSelectionMode}>
                取消
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="whitespace-nowrap text-sm text-neutral-mid">
                目前顯示 <span className="font-semibold text-neutral-dark">{props.totalCount}</span> 筆{' '}
                <span className="font-mono font-semibold tabular-nums text-neutral-dark">{props.totalAmount}</span>
              </span>
              <MobileSortControl sort={props.sort} onFieldChange={props.onSortFieldChange} onDirToggle={props.onSortDirToggle} />
            </div>
            <Button variant="warm" size="sm" icon={Download} onClick={() => setExportDialogOpen(true)}>
              匯出總表
            </Button>
          </>
        )}
      </div>

      {selectionMode && props.side === 'purchase' && (
        <div className="flex flex-col gap-2 rounded-md border border-neutral-blue-gray/30 bg-white p-4">
          <SubjectNameSelect value={batchCategory} onChange={setBatchCategory} placeholder="變更費用類別" />
          <Button
            variant="primary"
            size="md"
            className="w-full"
            disabled={editableSelectedIds.length === 0 || !batchCategory}
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
              channelText={channelLabel(row, props.channelNameByUuid)}
              onManualEntry={() => setManualEntryRow(row)}
              onCardClick={() => goToTransaction(row.uuid ?? row.id)}
              selectionMode={selectionMode}
              isSelected={!!selected[row.id]}
              onSelectToggle={() => toggleSelect(row.id)}
              onLongPressStart={enterSelectionMode}
              allowanceCount={row.allowances.length}
            />
          ))
        : props.rows.map(row => (
            <PurchaseCard
              key={row.id}
              row={row}
              subTab={props.subTab}
              expanded={!!expanded[row.id]}
              onToggle={() => toggleExpand(row.id)}
              onManualEntry={() => setManualEntryRow(row)}
              onCardClick={() => goToTransaction(row.uuid ?? row.id)}
              selectionMode={selectionMode}
              isSelected={!!selected[row.id]}
              onSelectToggle={() => toggleSelect(row.id)}
              onLongPressStart={enterSelectionMode}
              categoryValue={categoryOverrides[row.id] ?? row.category}
              onCategorySelect={v => setCategoryOverrides(o => ({ ...o, [row.id]: v }))}
            />
          ))}
    </div>
  );
}
