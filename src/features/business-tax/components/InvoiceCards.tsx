'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { fmtCurrency } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { SortKey, SortState, TaxInvoiceRow, TaxSide } from '../types';

const SORT_KEY_LABELS: Record<SortKey, string> = { date: '開立日期', id: '發票號碼' };
const SORT_KEYS: SortKey[] = ['date', 'id'];

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

// 作廢卡片：號碼與金額降階為 neutral-mid + 刪除線（見 DESIGN.md「Voided Row」）
function InvoiceCard({ row, onClick }: { row: TaxInvoiceRow; onClick: () => void }) {
  const idClass = `font-mono text-[15px] font-semibold ${row.isVoid ? 'text-neutral-mid line-through' : 'text-neutral-dark'}`;
  const totalClass = `font-mono text-lg font-semibold tabular-nums ${row.isVoid ? 'text-neutral-mid line-through' : 'text-neutral-dark'}`;

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer flex-col gap-2 rounded-lg border border-neutral-blue-gray/30 bg-white p-4 hover:border-brand-blue/40"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={idClass}>{row.id}</span>
          {row.isAllowance && <Badge tone="info">折讓</Badge>}
          {row.isVoid && <Badge tone="error">已作廢</Badge>}
        </div>
        <span className="whitespace-nowrap font-mono text-xs text-neutral-mid">{row.date}</span>
      </div>
      <div className="flex justify-end">
        <Badge tone={row.declared ? 'success' : 'neutral'}>{row.declared ? '已申報' : '未申報'}</Badge>
      </div>
      <div className="truncate text-[13px] text-neutral-mid" title={row.counterparty}>{row.counterparty}</div>
      <span className={totalClass}>{fmtCurrency(row.total)}</span>
      <div className="flex justify-between text-xs text-neutral-mid">
        <span>未稅金額 {fmtCurrency(row.untaxed)}</span>
        <span>營業稅額 {fmtCurrency(row.tax)}</span>
      </div>
    </div>
  );
}

export default function InvoiceCards({
  side,
  rows,
  totalCount,
  totalAmount,
  sort,
  onSortFieldChange,
  onSortDirToggle,
}: {
  side: TaxSide;
  rows: TaxInvoiceRow[];
  totalCount: number;
  totalAmount: string;
  sort: SortState;
  onSortFieldChange: (key: SortKey | null) => void;
  onSortDirToggle: () => void;
}) {
  const router = useRouter();
  const goToInvoice = (row: TaxInvoiceRow) =>
    router.push(`/business-tax/${row.ledgerUuid}?side=${side}${row.isVoid ? '&void=1' : ''}`);

  return (
    <div className="flex flex-col gap-2.5 nav:hidden">
      <div className="sticky top-16 z-40 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-blue-gray/30 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="whitespace-nowrap text-sm text-neutral-mid">
            目前顯示 <span className="font-semibold text-neutral-dark">{totalCount}</span> 筆{' '}
            <span className="font-mono font-semibold tabular-nums text-neutral-dark">{totalAmount}</span>
          </span>
          <MobileSortControl sort={sort} onFieldChange={onSortFieldChange} onDirToggle={onSortDirToggle} />
        </div>
        <Button variant="warm" size="sm" icon={Download} disabled title="後端尚未提供匯出總表資料，暫停用">
          匯出總表
        </Button>
      </div>

      {rows.map(row => (
        <InvoiceCard key={row.uuid} row={row} onClick={() => goToInvoice(row)} />
      ))}
    </div>
  );
}
