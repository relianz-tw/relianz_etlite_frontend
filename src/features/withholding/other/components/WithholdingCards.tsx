'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { fmtCurrency } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { categoryLabel, nhiDeclareStatusText } from '../data';
import type { WithholdingSortKey, WithholdingSortState } from '../urlState';
import type { WithholdingRecord } from '../types';

const SORT_KEY_LABELS: Record<WithholdingSortKey, string> = { paymentDate: '支付日期', grossIncome: '所得金額' };
const SORT_KEYS: WithholdingSortKey[] = ['paymentDate', 'grossIncome'];

function rocDate(year: number, month: number, day: number): string {
  return `${year - 1911}/${month}/${day}`;
}

/** 手機排序入口：下拉選欄位（預設 asc）＋方向鈕（僅切換 asc/desc），與桌機表格共用同一份排序資料 */
function MobileSortControl({
  sort,
  onFieldChange,
  onDirToggle,
}: {
  sort: WithholdingSortState;
  onFieldChange: (key: WithholdingSortKey | null) => void;
  onDirToggle: () => void;
}) {
  const DirIcon = sort.dir === 'asc' ? ArrowUp : sort.dir === 'desc' ? ArrowDown : ArrowUpDown;
  return (
    <div className="flex items-center gap-1.5">
      <Select widthClassName="w-32" value={sort.key ?? ''} onValueChange={v => onFieldChange(v ? (v as WithholdingSortKey) : null)}>
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

function WithholdingCard({ row, onClick }: { row: WithholdingRecord; onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex cursor-pointer flex-col gap-2 rounded-lg border border-neutral-blue-gray/30 bg-white p-4 hover:border-brand-blue/40">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[15px] font-semibold text-neutral-dark">{row.withholdingId}</span>
          <Badge tone="info">{categoryLabel(row.categoryCode)}</Badge>
        </div>
        <span className="whitespace-nowrap font-mono text-xs text-neutral-mid">{rocDate(row.paymentYear, row.paymentMonth, row.paymentDay)}</span>
      </div>
      <div className="truncate text-[13px] text-neutral-mid">{row.recipientName || '-'}</div>
      <span className="font-mono text-lg font-semibold tabular-nums text-neutral-dark">{fmtCurrency(row.netPayment)}</span>
      <div className="flex justify-between text-xs text-neutral-mid">
        <span>所得金額 {fmtCurrency(row.grossIncome)}</span>
        <span>扣繳稅額 {fmtCurrency(row.withholdingAmount)}</span>
      </div>
      <div className="flex justify-end gap-1.5">
        <Badge tone={row.withholdingPaid ? 'success' : 'neutral'}>{row.withholdingPaid ? '扣繳已繳納' : '扣繳未繳納'}</Badge>
        {row.nhiAmount > 0 && (
          <Badge tone={row.isNhiDeclared ? 'info' : row.nhiPaid ? 'success' : 'neutral'}>
            {row.isNhiDeclared ? nhiDeclareStatusText(row.nhiDeclareStatus) : row.nhiPaid ? '健保已繳納' : '健保未繳納'}
          </Badge>
        )}
      </div>
    </div>
  );
}

interface WithholdingCardsProps {
  rows: WithholdingRecord[];
  totalCount: number;
  allTotals: { netPayment: number };
  pageTotals: { netPayment: number };
  sort: WithholdingSortState;
  onSortFieldChange: (key: WithholdingSortKey | null) => void;
  onSortDirToggle: () => void;
}

export default function WithholdingCards({ rows, totalCount, allTotals, pageTotals, sort, onSortFieldChange, onSortDirToggle }: WithholdingCardsProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2.5 nav:hidden">
      <div className="sticky top-16 z-40 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-blue-gray/30 bg-white p-4">
        <div className="flex flex-col gap-0.5 text-sm text-neutral-mid">
          <span className="whitespace-nowrap">
            本頁加總 <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(pageTotals.netPayment)}</span>
          </span>
          <span className="whitespace-nowrap">
            全部加總 <span className="font-semibold text-neutral-dark">{totalCount}</span> 筆{' '}
            <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(allTotals.netPayment)}</span>
          </span>
        </div>
        <MobileSortControl sort={sort} onFieldChange={onSortFieldChange} onDirToggle={onSortDirToggle} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">此期間沒有更多的資料了</div>
      ) : (
        rows.map(row => <WithholdingCard key={row.uuid} row={row} onClick={() => router.push(`/withholding/other/${row.uuid}`)} />)
      )}
    </div>
  );
}
