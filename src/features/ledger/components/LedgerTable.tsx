'use client';

import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Select from '@/components/ui/Select';
import { ChevronDown, ChevronRight, CircleX, DollarSign, FileMinus } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import { EXPENSE_CATEGORIES, PROJECT_NAMES, SALES_CHANNELS, fmtCurrency } from '../data';
import type { PurchaseRow, PurchaseSubTab, SalesRow, SalesSubTab } from '../types';
import AddChannelDialog from './AddChannelDialog';
import ManualEntryDialog from './ManualEntryDialog';

const ADD_CHANNEL_OPTION = '+ 新增管道';

type LedgerTableProps = { totalCount: number; totalAmount: string } & (
  | { side: 'sales'; subTab: SalesSubTab; rows: SalesRow[] }
  | { side: 'purchase'; subTab: PurchaseSubTab; rows: PurchaseRow[] }
);

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark';

function SortHeader({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <ChevronDown size={12} className="text-neutral-blue-gray" />
    </span>
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

/** 批次更新列（僅進項表格使用）：套用費用類別／專案至目前選取（且可編輯）的列 */
function BatchUpdateRow({
  colSpan,
  selectedCount,
  selectedAmount,
  batchCategory,
  onBatchCategoryChange,
  batchProject,
  onBatchProjectChange,
  onApply,
}: {
  colSpan: number;
  selectedCount: number;
  selectedAmount: string;
  batchCategory: string;
  onBatchCategoryChange: (value: string) => void;
  batchProject: string;
  onBatchProjectChange: (value: string) => void;
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
            <Select widthClassName="w-40" value={batchCategory} onValueChange={onBatchCategoryChange}>
              <option value="">變更費用類別</option>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select widthClassName="w-40" value={batchProject} onValueChange={onBatchProjectChange}>
              <option value="">變更專案</option>
              {PROJECT_NAMES.filter(Boolean).map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              variant="primary"
              disabled={selectedCount === 0 || (!batchCategory && !batchProject)}
              onClick={onApply}
            >
              變更
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function LedgerTable(props: LedgerTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [channels, setChannels] = useState(SALES_CHANNELS);
  const [channelOverrides, setChannelOverrides] = useState<Record<string, string>>({});
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  const [projectOverrides, setProjectOverrides] = useState<Record<string, string>>({});
  const [batchCategory, setBatchCategory] = useState('');
  const [batchProject, setBatchProject] = useState('');
  const [addChannelRowId, setAddChannelRowId] = useState<string | null>(null);
  const [manualEntryRow, setManualEntryRow] = useState<SalesRow | null>(null);
  const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const toggleCheck = (id: string) => setChecked(c => ({ ...c, [id]: !c[id] }));

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

  const dialogs = (
    <>
      <AddChannelDialog open={addChannelRowId !== null} onClose={() => setAddChannelRowId(null)} onSubmit={handleChannelCreated} />
      <ManualEntryDialog
        open={manualEntryRow !== null}
        onClose={() => setManualEntryRow(null)}
        row={manualEntryRow}
        onSubmit={() => setManualEntryRow(null)}
      />
    </>
  );

  if (props.side === 'sales') {
    const { subTab, rows, totalCount, totalAmount } = props;
    const showChannel = subTab === 'received';
    return (
      <>
      {dialogs}
      <div className="hidden overflow-hidden rounded-md border border-neutral-blue-gray/30 bg-white nav:block">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-10" />
            <col className="w-[160px]" />
            <col className="w-[150px]" />
            <col />
            {showChannel && <col className="w-[150px]" />}
            <col className="w-[120px]" />
            <col className={showChannel ? 'w-[300px]' : 'w-[380px]'} />
          </colgroup>
          <thead className="bg-surface-off-white">
            <tr className="border-b border-neutral-blue-gray/40">
              <th className={thClass} />
              <th className={thClass}>
                <SortHeader label="交易編號" />
              </th>
              <th className={`${thClass} text-right`}>
                <SortHeader label="交易金額" />
              </th>
              <th className={thClass}>
                <SortHeader label="買受人" />
              </th>
              {showChannel && <th className={thClass}>銷售管道</th>}
              <th className={thClass}>
                <SortHeader label="開立日期" />
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
                      <span className="font-mono text-[13px] font-semibold">{row.id}</span>
                    </div>
                  </td>
                  <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(row.amount)}</td>
                  <td className={`${tdClass} truncate`}>{row.counterparty}</td>
                  {showChannel && (
                    <td className={tdClass}>
                      <Select
                        widthClassName="w-32"
                        value={channelOverrides[row.id] ?? row.channel}
                        onValueChange={v => handleChannelSelect(row.id, v)}
                      >
                        {channels.map(c => (
                          <option key={c}>{c}</option>
                        ))}
                        <option>{ADD_CHANNEL_OPTION}</option>
                      </Select>
                    </td>
                  )}
                  <td className={`${tdClass} font-mono`}>{row.date}</td>
                  <td className={`${tdClass} text-right`}>
                    <div className="flex justify-end gap-1.5">
                      {subTab === 'receivable' && (
                        <Button size="sm" variant="outline" icon={DollarSign} className="w-[104px]" onClick={() => setManualEntryRow(row)}>
                          手動入帳
                        </Button>
                      )}
                      {row.voided ? (
                        <Button size="sm" variant="ghost" disabled icon={CircleX} className="w-[84px]">
                          已作廢
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" icon={CircleX} className="w-[84px]">
                          作廢
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" icon={FileMinus} className="w-[104px]">
                        {row.allowanceCount > 0 ? `折讓 (${row.allowanceCount})` : '折讓'}
                      </Button>
                    </div>
                  </td>
                </tr>
                {expanded[row.id] &&
                  row.children?.map(child => (
                    <tr key={child.id} className="border-b border-neutral-blue-gray/20 bg-surface-off-white/60 last:border-0">
                      <td className={tdClass} />
                      <td className={`${tdClass} pl-8 font-mono text-[13px] text-neutral-mid`}>{child.label ?? child.id}</td>
                      <td className={`${tdClass} text-right font-mono text-neutral-mid tabular-nums`}>{fmtCurrency(child.amount)}</td>
                      <td className={`${tdClass} font-mono text-neutral-mid`} colSpan={showChannel ? 4 : 3}>
                        {child.date ?? ''}
                      </td>
                    </tr>
                  ))}
              </Fragment>
            ))}
          </tbody>
          <TableFooter totalCount={totalCount} totalAmount={totalAmount} colSpanAfter={showChannel ? 4 : 3} />
        </table>
      </div>
      </>
    );
  }

  const { rows, totalCount, totalAmount } = props;
  const editableSelected = rows.filter(r => checked[r.id] && r.source === 'invoice');
  const batchSelectedAmount = fmtCurrency(editableSelected.reduce((sum, r) => sum + r.amount, 0));
  const handleBatchApply = () => {
    const ids = editableSelected.map(r => r.id);
    if (batchCategory) setCategoryOverrides(o => ({ ...o, ...Object.fromEntries(ids.map(id => [id, batchCategory])) }));
    if (batchProject) setProjectOverrides(o => ({ ...o, ...Object.fromEntries(ids.map(id => [id, batchProject])) }));
    setBatchCategory('');
    setBatchProject('');
  };
  const editableIds = rows.filter(r => r.source === 'invoice').map(r => r.id);
  const selectedEditableCount = editableIds.filter(id => checked[id]).length;
  const allEditableSelected = editableIds.length > 0 && selectedEditableCount === editableIds.length;
  const someEditableSelected = selectedEditableCount > 0 && !allEditableSelected;
  const toggleSelectAll = () => {
    setChecked(c => {
      const next = { ...c };
      editableIds.forEach(id => {
        next[id] = !allEditableSelected;
      });
      return next;
    });
  };
  return (
    <div className="hidden overflow-hidden rounded-md border border-neutral-blue-gray/30 bg-white nav:block">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-10" />
          <col className="w-[160px]" />
          <col className="w-[150px]" />
          <col />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[120px]" />
        </colgroup>
        <thead className="bg-surface-off-white">
          <tr className="border-b border-neutral-blue-gray/40">
            <th className={thClass}>
              <Checkbox
                checked={allEditableSelected}
                indeterminate={someEditableSelected}
                onChange={toggleSelectAll}
                disabled={editableIds.length === 0}
                aria-label="全選"
              />
            </th>
            <th className={thClass}>
              <SortHeader label="交易編號" />
            </th>
            <th className={`${thClass} text-right`}>
              <SortHeader label="交易金額" />
            </th>
            <th className={thClass}>
              <SortHeader label={props.subTab === 'paid' ? '賣家名稱' : '交易敘述'} />
            </th>
            <th className={thClass}>費用類別</th>
            <th className={thClass}>專案名稱</th>
            <th className={thClass}>
              <SortHeader label="開立日期" />
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
                    <Checkbox
                      checked={locked ? true : !!checked[row.id]}
                      onChange={() => !locked && toggleCheck(row.id)}
                      disabled={locked}
                      aria-label={`選取 ${row.id}`}
                    />
                  </td>
                  <td className={tdClass}>
                    <div className="flex items-center gap-1.5">
                      <ExpandToggle hasChildren={!!row.children} expanded={!!expanded[row.id]} onToggle={() => toggleExpand(row.id)} />
                      <span className="font-mono text-[13px] font-semibold">{row.id}</span>
                    </div>
                  </td>
                  <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>{fmtCurrency(row.amount)}</td>
                  <td className={`${tdClass} truncate`}>{row.party}</td>
                  <td className={tdClass}>
                    <Select
                      widthClassName="w-32"
                      value={locked ? row.category : categoryOverrides[row.id] ?? row.category}
                      onValueChange={v => setCategoryOverrides(o => ({ ...o, [row.id]: v }))}
                      disabled={locked}
                    >
                      {locked ? <option>{row.category}</option> : EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </Select>
                  </td>
                  <td className={tdClass}>
                    <Select
                      widthClassName="w-32"
                      value={locked ? row.project || '—' : projectOverrides[row.id] ?? row.project}
                      onValueChange={v => setProjectOverrides(o => ({ ...o, [row.id]: v }))}
                      disabled={locked}
                    >
                      {locked
                        ? <option>{row.project || '—'}</option>
                        : PROJECT_NAMES.map(p => <option key={p || 'none'}>{p}</option>)}
                    </Select>
                  </td>
                  <td className={`${tdClass} font-mono`}>{row.date}</td>
                </tr>
                {expanded[row.id] &&
                  row.children?.map(child => (
                    <tr key={child.id} className="border-b border-neutral-blue-gray/20 bg-surface-off-white/60 last:border-0">
                      <td className={tdClass} />
                      <td className={`${tdClass} pl-8 font-mono text-[13px] text-neutral-mid`}>{child.label ?? child.id}</td>
                      <td className={`${tdClass} text-right font-mono text-neutral-mid tabular-nums`}>{fmtCurrency(child.amount)}</td>
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
          <BatchUpdateRow
            colSpan={7}
            selectedCount={editableSelected.length}
            selectedAmount={batchSelectedAmount}
            batchCategory={batchCategory}
            onBatchCategoryChange={setBatchCategory}
            batchProject={batchProject}
            onBatchProjectChange={setBatchProject}
            onApply={handleBatchApply}
          />
        </TableFooter>
      </table>
    </div>
  );
}
