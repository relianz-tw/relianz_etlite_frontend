'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { FixedAssetRow, SortKey, SortState } from '../types';

const SORT_KEY_LABELS: Record<SortKey, string> = {
  acquiredDate: '購入日期',
  name: '名稱',
  originalAmount: '原始金額',
  remainingAmount: '剩餘可扣抵',
};
const SORT_KEYS: SortKey[] = ['acquiredDate', 'name', 'originalAmount', 'remainingAmount'];

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
      <Select widthClassName="w-36" value={sort.key ?? ''} onValueChange={v => onFieldChange(v ? (v as SortKey) : null)}>
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

function AssetCard({ row }: { row: FixedAssetRow }) {
  const dim = row.status === 'completed';
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`font-medium ${dim ? 'text-neutral-mid' : 'text-neutral-dark'}`}>{row.name}</span>
          <Badge tone={row.status === 'active' ? 'info' : 'neutral'}>
            {row.status === 'active' ? '使用中' : '已折舊完畢'}
          </Badge>
        </div>
        <span className={`shrink-0 font-mono text-lg font-semibold tabular-nums ${dim ? 'text-neutral-mid' : 'text-brand-blue'}`}>
          {fmtCurrency(row.remainingAmount)}
        </span>
      </div>
      <div className="text-xs text-neutral-mid">剩餘可扣抵</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-mid">
        <span>科目：{row.subject}</span>
        <span>購入日期：{formatYyyymmddRoc(row.acquiredDate)}</span>
        <span>使用年限：{row.usefulLifeYears} 年</span>
        <span>原始金額：{fmtCurrency(row.originalAmount)}</span>
      </div>
    </div>
  );
}

interface Props {
  rows: FixedAssetRow[];
  totalCount: number;
  sort: SortState;
  onSortFieldChange: (key: SortKey | null) => void;
  onSortDirToggle: () => void;
}

export default function FixedAssetsCards({ rows, totalCount, sort, onSortFieldChange, onSortDirToggle }: Props) {
  return (
    <div className="flex flex-col gap-2.5 nav:hidden">
      <div className="sticky top-16 z-40 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-blue-gray/30 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="whitespace-nowrap text-sm text-neutral-mid">
            共 <span className="font-semibold text-neutral-dark">{totalCount}</span> 筆
          </span>
          <MobileSortControl sort={sort} onFieldChange={onSortFieldChange} onDirToggle={onSortDirToggle} />
        </div>
      </div>

      {rows.map(row => (
        <AssetCard key={row.id} row={row} />
      ))}
    </div>
  );
}
