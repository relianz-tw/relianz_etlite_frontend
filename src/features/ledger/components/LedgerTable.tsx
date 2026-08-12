'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import ExportSelectedDialog from '@/components/ui/ExportSelectedDialog';
import Select from '@/components/ui/Select';
import { SubjectNameSelect } from '@/components/ui/SubjectSelect';
import { ChevronDown, ChevronRight, ChevronsUpDown, ChevronUp, CircleX, Download } from 'lucide-react';
import { cn, fmtCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import type { PurchaseRow, PurchaseSubTab, SalesRow, SalesSubTab, SortKey, SortState } from '../types';
import { withReturnParam } from '../urlState';

type LedgerTableProps = { totalCount: number; totalAmount: string; sort: SortState; onSortToggle: (key: SortKey) => void } & (
  | { side: 'sales'; subTab: SalesSubTab; rows: SalesRow[]; channelNameByUuid: Map<string, string> }
  | { side: 'purchase'; subTab: PurchaseSubTab; rows: PurchaseRow[] }
);

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark';

/** 交易金額欄：$ 固定貼齊欄位左緣、數字貼齊欄位右緣，讓同一欄內每列的 $ 對齊在同一直排 */
function AmountCell({ amount, className = '' }: { amount: number; className?: string }) {
  return (
    <span className={cn('flex items-center justify-between font-mono tabular-nums', className)}>
      <span className="text-neutral-mid">$</span>
      <span>{amount.toLocaleString('en-US')}</span>
    </span>
  );
}

/** 銷售管道唯讀顯示：帳簿列表無單筆交易更新管道的 API，故僅反查真實 paymentChannelUuid 顯示名稱，不提供編輯 */
function channelLabel(row: SalesRow, channelNameByUuid: Map<string, string>): string {
  if (!row.paymentChannelUuid) return '未分類';
  return channelNameByUuid.get(row.paymentChannelUuid) ?? '未知';
}

/** 可排序表頭：三態循環 none → asc → desc → none；active 時文字與圖示轉城信藍（見 DESIGN.md「Sortable Table Header」） */
function SortHeader({
  label,
  sortKey,
  sort,
  onToggle,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onToggle: (key: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = sort.key === sortKey;
  const Icon = active ? (sort.dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <button
      type="button"
      onClick={() => onToggle(sortKey)}
      className={`inline-flex items-center gap-1 hover:text-brand-blue ${align === 'right' ? 'flex-row-reverse' : ''} ${
        active ? 'text-brand-blue' : 'text-neutral-mid'
      }`}
    >
      {label}
      <Icon size={12} className={active ? 'text-brand-blue' : 'text-neutral-blue-gray'} />
    </button>
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

/** 表格底部總計列：金額欄與上方「交易金額」欄對齊，緊貼表格最下方；children 可附加額外列（如批次更新列） */
function TableFooter({
  totalCount,
  totalAmount,
  colSpanAfter,
  children,
}: {
  totalCount: number;
  totalAmount: string;
  colSpanAfter: number;
  children?: ReactNode;
}) {
  return (
    <tfoot>
      <tr className="border-t border-neutral-blue-gray/40 bg-surface-off-white">
        <td colSpan={2} className={`${tdClass} text-neutral-mid`}>
          目前顯示 <span className="font-semibold text-neutral-dark">{totalCount}</span> 筆
        </td>
        <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{totalAmount}</td>
        <td colSpan={colSpanAfter} className={tdClass}>
          <div className="flex items-center justify-end gap-2 text-sm text-neutral-mid">
            每頁顯示：
            <Select widthClassName="w-20" defaultValue="10">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </Select>
            筆
          </div>
        </td>
      </tr>
      {children}
    </tfoot>
  );
}

/** 批次更新列（僅進項表格使用）：套用費用類別至目前選取（且可編輯）的列；專案欄位純前端無持久化，已停用編輯 */
function BatchUpdateRow({
  colSpan,
  selectedCount,
  selectedAmount,
  batchCategory,
  onBatchCategoryChange,
  onApply,
}: {
  colSpan: number;
  selectedCount: number;
  selectedAmount: string;
  batchCategory: string;
  onBatchCategoryChange: (value: string) => void;
  onApply: () => void;
}) {
  return (
    <tr className="border-t border-neutral-blue-gray/20 bg-white">
      <td colSpan={colSpan} className={tdClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-neutral-mid">
            目前選擇 <span className="font-semibold text-neutral-dark">{selectedCount}</span> 筆{' '}
            <span className="font-mono font-semibold tabular-nums text-neutral-dark">{selectedAmount}</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="w-48">
              <SubjectNameSelect value={batchCategory} onChange={onBatchCategoryChange} placeholder="變更費用類別" />
            </div>
            <Button size="sm" variant="primary" disabled={selectedCount === 0 || !batchCategory} onClick={onApply}>
              變更
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

/** 已選取交易的操作列：顯示已選筆數與金額，並提供「匯出所選」與「取消選取」 */
function SelectionExportRow({
  colSpan,
  selectedCount,
  selectedAmount,
  onExport,
  onClear,
}: {
  colSpan: number;
  selectedCount: number;
  selectedAmount: string;
  onExport: () => void;
  onClear: () => void;
}) {
  return (
    <tr className="border-t border-neutral-blue-gray/20 bg-white">
      <td colSpan={colSpan} className={tdClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-neutral-mid">
            已選 <span className="font-semibold text-neutral-dark">{selectedCount}</span> 筆{' '}
            <span className="font-mono font-semibold tabular-nums text-neutral-dark">{selectedAmount}</span>
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onClear}>
              取消選取
            </Button>
            <Button size="sm" variant="warm" icon={Download} onClick={onExport}>
              匯出所選
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function LedgerTable(props: LedgerTableProps) {
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  const [batchCategory, setBatchCategory] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const toggleCheck = (id: string) => setChecked(c => ({ ...c, [id]: !c[id] }));

  // 選取狀態：涵蓋目前分頁的全部列（含進項的勞報／薪資列），供全選與「匯出所選」共用
  const allIds = props.rows.map(r => r.id);
  const selectedRows = props.rows.filter(r => checked[r.id]);
  const selectedCount = selectedRows.length;
  const selectedAmount = fmtCurrency(selectedRows.reduce((sum, r) => sum + r.amount, 0));
  const allSelected = allIds.length > 0 && selectedCount === allIds.length;
  const someSelected = selectedCount > 0 && !allSelected;
  const toggleSelectAll = () => {
    setChecked(c => {
      if (allSelected) return {};
      const next = { ...c };
      allIds.forEach(id => {
        next[id] = true;
      });
      return next;
    });
  };
  const clearSelection = () => setChecked({});
  const exportDialog = (
    <ExportSelectedDialog
      open={exportOpen}
      onClose={() => setExportOpen(false)}
      selectedCount={selectedCount}
      selectedAmount={selectedAmount}
      onExport={() => setExportOpen(false)}
    />
  );

  if (props.side === 'sales') {
    const { subTab, rows, totalCount, totalAmount, sort, onSortToggle, channelNameByUuid } = props;
    const showChannel = subTab === 'received';
    return (
      <>
      {exportDialog}
      {/* 上緣接續 LedgerView 渲染的底線分頁列（TabBar），故不設上圓角、不設上邊框 */}
      <div className="hidden overflow-hidden rounded-b-md border border-t-0 border-neutral-blue-gray/30 bg-white nav:block">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-10" />
            <col className="w-[190px]" />
            <col className="w-[150px]" />
            <col />
            {showChannel && <col className="w-[150px]" />}
            <col className="w-[120px]" />
            <col className="w-[120px]" />
          </colgroup>
          <thead className="bg-surface-off-white">
            <tr className="border-b border-neutral-blue-gray/40">
              <th className={thClass}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleSelectAll}
                  disabled={allIds.length === 0}
                  aria-label="全選"
                />
              </th>
              <th className={thClass}>
                <SortHeader label="交易編號" sortKey="id" sort={sort} onToggle={onSortToggle} />
              </th>
              <th className={`${thClass} text-right`}>
                <SortHeader label="交易金額" sortKey="amount" sort={sort} onToggle={onSortToggle} align="right" />
              </th>
              <th className={thClass}>
                <SortHeader label="買受人" sortKey="counterparty" sort={sort} onToggle={onSortToggle} />
              </th>
              {showChannel && <th className={thClass}>銷售管道</th>}
              <th className={thClass}>
                <SortHeader label="開立日期" sortKey="date" sort={sort} onToggle={onSortToggle} />
              </th>
              <th className={`${thClass} text-right`}>動作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <Fragment key={row.id}>
                <tr
                  className={`border-b border-neutral-blue-gray/20 last:border-0 hover:bg-brand-blue/5 ${i % 2 === 1 ? 'bg-surface-warm/30' : ''}`}
                >
                  <td className={tdClass}>
                    <Checkbox checked={!!checked[row.id]} onChange={() => toggleCheck(row.id)} aria-label={`選取 ${row.id}`} />
                  </td>
                  <td className={tdClass}>
                    <div className="flex items-center gap-1.5">
                      <ExpandToggle hasChildren={!!row.children} expanded={!!expanded[row.id]} onToggle={() => toggleExpand(row.id)} />
                      <Link
                        href={withReturnParam(`/ledger/${row.uuid ?? row.id}?side=sales`, searchParams)}
                        className="font-mono text-[13px] font-semibold text-neutral-dark hover:text-brand-blue hover:underline"
                      >
                        {row.id}
                      </Link>
                      {row.isAllowance && (
                        <Badge tone="info" variant="muted">
                          折讓
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className={tdClass}>
                    <AmountCell amount={row.amount} className="font-semibold text-neutral-dark" />
                  </td>
                  <td className={cn(tdClass, 'whitespace-normal break-words')}>{row.counterparty}</td>
                  {showChannel && (
                    <td className={`${tdClass} truncate text-neutral-mid`} title={channelLabel(row, channelNameByUuid)}>
                      {channelLabel(row, channelNameByUuid)}
                    </td>
                  )}
                  <td className={`${tdClass} font-mono`}>{row.date}</td>
                  <td className={`${tdClass} text-right`}>
                    {row.voided ? (
                      <Button size="sm" variant="ghost" disabled icon={CircleX} className="w-[84px]">
                        已作廢
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" icon={CircleX} className="w-[84px]" disabled title="作廢功能尚未串接後端 API">
                        作廢
                      </Button>
                    )}
                  </td>
                </tr>
                {expanded[row.id] &&
                  row.children?.map(child => (
                    <tr key={child.id} className="border-b border-neutral-blue-gray/20 bg-surface-off-white/60 last:border-0">
                      <td className={tdClass} />
                      <td className={`${tdClass} pl-8 font-mono text-[13px] text-neutral-mid`}>{child.label ?? child.id}</td>
                      <td className={tdClass}>
                        <AmountCell amount={child.amount} className="text-neutral-mid" />
                      </td>
                      <td className={`${tdClass} font-mono text-neutral-mid`} colSpan={showChannel ? 4 : 3}>
                        {child.date ?? ''}
                      </td>
                    </tr>
                  ))}
              </Fragment>
            ))}
          </tbody>
          <TableFooter totalCount={totalCount} totalAmount={totalAmount} colSpanAfter={showChannel ? 4 : 3}>
            {selectedCount > 0 && (
              <SelectionExportRow
                colSpan={showChannel ? 7 : 6}
                selectedCount={selectedCount}
                selectedAmount={selectedAmount}
                onExport={() => setExportOpen(true)}
                onClear={clearSelection}
              />
            )}
          </TableFooter>
        </table>
      </div>
      </>
    );
  }

  const { rows, subTab, totalCount, totalAmount, sort, onSortToggle } = props;
  const editableSelected = rows.filter(r => checked[r.id] && r.source === 'invoice');
  const batchSelectedAmount = fmtCurrency(editableSelected.reduce((sum, r) => sum + r.amount, 0));
  const handleBatchApply = () => {
    const ids = editableSelected.map(r => r.id);
    setCategoryOverrides(o => ({ ...o, ...Object.fromEntries(ids.map(id => [id, batchCategory])) }));
    setBatchCategory('');
  };
  return (
    <>
    {exportDialog}
    {/* 上緣接續 LedgerView 渲染的底線分頁列（TabBar），故不設上圓角、不設上邊框 */}
    <div className="hidden overflow-hidden rounded-b-md border border-t-0 border-neutral-blue-gray/30 bg-white nav:block">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-10" />
          <col className="w-[190px]" />
          <col className="w-[150px]" />
          <col />
          <col className="w-[190px]" />
          <col className="w-[150px]" />
          <col className="w-[120px]" />
        </colgroup>
        <thead className="bg-surface-off-white">
          <tr className="border-b border-neutral-blue-gray/40">
            <th className={thClass}>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={toggleSelectAll}
                disabled={allIds.length === 0}
                aria-label="全選"
              />
            </th>
            <th className={thClass}>
              <SortHeader label="交易編號" sortKey="id" sort={sort} onToggle={onSortToggle} />
            </th>
            <th className={`${thClass} text-right`}>
              <SortHeader label="交易金額" sortKey="amount" sort={sort} onToggle={onSortToggle} align="right" />
            </th>
            <th className={thClass}>
              <SortHeader
                label={subTab === 'paid' ? '賣家名稱' : '交易敘述'}
                sortKey="counterparty"
                sort={sort}
                onToggle={onSortToggle}
              />
            </th>
            <th className={thClass}>費用類別</th>
            <th className={thClass}>專案名稱</th>
            <th className={thClass}>
              <SortHeader label="開立日期" sortKey="date" sort={sort} onToggle={onSortToggle} />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const locked = row.source !== 'invoice';
            return (
              <Fragment key={row.id}>
                <tr
                  className={`border-b border-neutral-blue-gray/20 last:border-0 hover:bg-brand-blue/5 ${i % 2 === 1 ? 'bg-surface-warm/30' : ''}`}
                >
                  <td className={tdClass}>
                    <Checkbox checked={!!checked[row.id]} onChange={() => toggleCheck(row.id)} aria-label={`選取 ${row.id}`} />
                  </td>
                  <td className={tdClass}>
                    <div className="flex items-center gap-1.5">
                      <ExpandToggle hasChildren={!!row.children} expanded={!!expanded[row.id]} onToggle={() => toggleExpand(row.id)} />
                      <Link
                        href={withReturnParam(`/ledger/${row.uuid ?? row.id}?side=purchase`, searchParams)}
                        className="font-mono text-[13px] font-semibold text-neutral-dark hover:text-brand-blue hover:underline"
                      >
                        {row.id}
                      </Link>
                      {row.isAllowance && (
                        <Badge tone="info" variant="muted">
                          折讓
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className={tdClass}>
                    <AmountCell amount={row.amount} className="font-semibold text-neutral-dark" />
                  </td>
                  <td className={cn(tdClass, 'whitespace-normal break-words')}>{row.party}</td>
                  <td className={tdClass}>
                    <div className="w-44">
                      <SubjectNameSelect
                        value={locked ? row.category : categoryOverrides[row.id] ?? row.category}
                        onChange={v => setCategoryOverrides(o => ({ ...o, [row.id]: v }))}
                        disabled={locked}
                      />
                    </div>
                  </td>
                  <td className={`${tdClass} truncate text-neutral-mid`} title={row.project || '—'}>
                    {row.project || '—'}
                  </td>
                  <td className={`${tdClass} font-mono`}>{row.date}</td>
                </tr>
                {expanded[row.id] &&
                  row.children?.map(child => (
                    <tr key={child.id} className="border-b border-neutral-blue-gray/20 bg-surface-off-white/60 last:border-0">
                      <td className={tdClass} />
                      <td className={`${tdClass} pl-8 font-mono text-[13px] text-neutral-mid`}>{child.label ?? child.id}</td>
                      <td className={tdClass}>
                        <AmountCell amount={child.amount} className="text-neutral-mid" />
                      </td>
                      <td className={`${tdClass} font-mono text-neutral-mid`} colSpan={4}>
                        {child.date ?? ''}
                      </td>
                    </tr>
                  ))}
              </Fragment>
            );
          })}
        </tbody>
        <TableFooter totalCount={totalCount} totalAmount={totalAmount} colSpanAfter={4}>
          {selectedCount > 0 && (
            <SelectionExportRow
              colSpan={7}
              selectedCount={selectedCount}
              selectedAmount={selectedAmount}
              onExport={() => setExportOpen(true)}
              onClear={clearSelection}
            />
          )}
          {editableSelected.length > 0 && (
            <BatchUpdateRow
              colSpan={7}
              selectedCount={editableSelected.length}
              selectedAmount={batchSelectedAmount}
              batchCategory={batchCategory}
              onBatchCategoryChange={setBatchCategory}
              onApply={handleBatchApply}
            />
          )}
        </TableFooter>
      </table>
    </div>
    </>
  );
}
