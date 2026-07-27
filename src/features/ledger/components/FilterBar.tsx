'use client';

import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { ChevronDown, ChevronUp, Plus, Search, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { AdvancedFilter } from '../types';
import type { Side } from '../types';
import ImportInvoiceDialog from './ImportInvoiceDialog';

export interface FilterBarProps {
  side: Side;
  query: string;
  onQueryChange: (v: string) => void;
  onSearch: () => void;
  advanced: AdvancedFilter;
  onAdvancedChange: (v: AdvancedFilter) => void;
  onAdvancedApply: (next?: AdvancedFilter) => void;
}

const STATUS_OPTIONS: { value: AdvancedFilter['status']; label: string }[] = [
  { value: 'all', label: '全部狀態' },
  { value: 'normal', label: '正常' },
  { value: 'voided', label: '已作廢' },
];

export default function FilterBar({ side, query, onQueryChange, onSearch, advanced, onAdvancedChange, onAdvancedApply }: FilterBarProps) {
  const router = useRouter();
  const goToNewTransaction = () => router.push(`/ledger/new?side=${side}`);
  const [advOpen, setAdvOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

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
      {side === 'sales' && (
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">狀態</label>
          <Select
            value={advanced.status}
            onValueChange={v => onAdvancedChange({ ...advanced, status: v as AdvancedFilter['status'] })}
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      )}
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
          {side === 'sales' && (
            <Select widthClassName="flex-[2]">
              <option>交易期間：114/01/01 – 115/01/01</option>
              <option>本月</option>
              <option>本季</option>
              <option>本年度</option>
            </Select>
          )}
          <Button variant="outline" icon={Upload} className="flex-1" onClick={() => setImportOpen(true)}>
            匯入電子發票
          </Button>
          <Button variant="warm" icon={Plus} className="flex-1" onClick={goToNewTransaction}>
            新增交易
          </Button>
        </div>
        <div className="flex items-center gap-2.5">
          <Select widthClassName="w-32">
            <option>交易編號</option>
            <option>發票號碼</option>
            <option>統一編號</option>
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
        </div>
        {advOpen && AdvancedPanel}
      </div>

      {/* 手機 */}
      <div className="flex flex-col gap-3 nav:hidden">
        {side === 'sales' && (
          <Select>
            <option>交易期間：114/01/01 – 115/01/01</option>
            <option>本月</option>
            <option>本季</option>
            <option>本年度</option>
          </Select>
        )}
        <div className="flex gap-2.5">
          <Button variant="outline" icon={Upload} className="flex-1" onClick={() => setImportOpen(true)}>
            匯入電子發票
          </Button>
          <Button variant="primary" icon={Plus} className="flex-1" onClick={goToNewTransaction}>
            新增交易
          </Button>
        </div>
        <TextInput
          placeholder="搜尋發票號碼、公司或金額"
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
      </div>

      <ImportInvoiceDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
