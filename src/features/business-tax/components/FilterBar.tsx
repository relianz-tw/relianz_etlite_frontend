'use client';

import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { ChevronDown, ChevronUp, Download, Search } from 'lucide-react';
import { useState } from 'react';
import type { AdvancedFilter } from '../types';

export interface FilterBarProps {
  onOpenReport: () => void;
  query: string;
  onQueryChange: (v: string) => void;
  onSearch: () => void;
  advanced: AdvancedFilter;
  onAdvancedChange: (v: AdvancedFilter) => void;
  onAdvancedApply: (next?: AdvancedFilter) => void;
}

const STATUS_OPTIONS: { value: AdvancedFilter['status']; label: string }[] = [
  { value: 'all', label: '全部狀態' },
  { value: 'pending', label: '待申報' },
  { value: 'voided', label: '已作廢' },
];

export default function FilterBar({ onOpenReport, query, onQueryChange, onSearch, advanced, onAdvancedChange, onAdvancedApply }: FilterBarProps) {
  const [advOpen, setAdvOpen] = useState(false);

  const handleClearAdvanced = () => {
    const cleared: AdvancedFilter = { status: 'all', minAmount: '', maxAmount: '' };
    onAdvancedChange(cleared);
    onAdvancedApply(cleared);
  };

  const AdvancedPanel = (
    <div className="flex flex-col gap-3 rounded-md border border-neutral-blue-gray/30 bg-white p-4 nav:flex-row nav:items-end nav:gap-2.5">
      <div className="flex-1">
        <label className="mb-1 block text-xs font-semibold text-neutral-mid">金額下限</label>
        <TextInput
          type="number"
          placeholder="最小金額"
          value={advanced.minAmount}
          onChange={e => onAdvancedChange({ ...advanced, minAmount: e.target.value })}
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs font-semibold text-neutral-mid">金額上限</label>
        <TextInput
          type="number"
          placeholder="最大金額"
          value={advanced.maxAmount}
          onChange={e => onAdvancedChange({ ...advanced, maxAmount: e.target.value })}
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs font-semibold text-neutral-mid">狀態</label>
        <Select value={advanced.status} onValueChange={v => onAdvancedChange({ ...advanced, status: v as AdvancedFilter['status'] })}>
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex gap-2.5">
        <Button variant="ghost" onClick={handleClearAdvanced}>
          清除
        </Button>
        <Button variant="primary" onClick={() => onAdvancedApply()}>
          套用
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* 桌機 */}
      <div className="hidden flex-col gap-3 nav:flex">
        <div className="flex items-center gap-2.5">
          <Select widthClassName="w-32">
            <option>發票號碼</option>
            <option>統一編號</option>
            <option>買受人</option>
          </Select>
          <div className="flex-1">
            <TextInput
              placeholder="請輸入要查詢的發票號碼"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearch()}
            />
          </div>
          <Button variant="primary" icon={Search} onClick={onSearch}>
            搜尋
          </Button>
          <Button variant="ghost" icon={advOpen ? ChevronUp : ChevronDown} iconPosition="right" onClick={() => setAdvOpen(o => !o)}>
            進階搜尋
          </Button>
          <Button variant="warm" icon={Download} onClick={onOpenReport}>
            轉出本期營業稅申報檔
          </Button>
        </div>
        {advOpen && AdvancedPanel}
      </div>

      {/* 手機 */}
      <div className="flex flex-col gap-3 nav:hidden">
        <TextInput
          placeholder="搜尋發票號碼或買受人"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <div className="flex gap-2.5">
          <Button variant="primary" icon={Search} className="flex-1" onClick={onSearch}>
            搜尋
          </Button>
          <Button
            variant="ghost"
            icon={advOpen ? ChevronUp : ChevronDown}
            iconPosition="right"
            className="flex-1"
            onClick={() => setAdvOpen(o => !o)}
          >
            進階搜尋
          </Button>
        </div>
        {advOpen && AdvancedPanel}
        <Button variant="warm" icon={Download} className="w-full" onClick={onOpenReport}>
          轉出本期營業稅申報檔
        </Button>
      </div>
    </>
  );
}
