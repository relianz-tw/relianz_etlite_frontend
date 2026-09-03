'use client';

import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useState } from 'react';
import { EMPTY_ADVANCED } from '../urlState';
import type { WithholdingAdvancedFilter } from '../urlState';

export interface WithholdingFilterBarProps {
  query: string;
  onQueryChange: (v: string) => void;
  onSearch: () => void;
  advanced: WithholdingAdvancedFilter;
  onAdvancedChange: (v: WithholdingAdvancedFilter) => void;
  onAdvancedApply: (next?: WithholdingAdvancedFilter) => void;
}

export default function WithholdingFilterBar({ query, onQueryChange, onSearch, advanced, onAdvancedChange, onAdvancedApply }: WithholdingFilterBarProps) {
  const [advOpen, setAdvOpen] = useState(false);

  const handleClearAdvanced = () => {
    onAdvancedChange(EMPTY_ADVANCED);
    onAdvancedApply(EMPTY_ADVANCED);
  };

  const AdvancedPanel = (
    <div className="flex flex-col gap-4 rounded-md border border-neutral-blue-gray/30 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 nav:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">所得金額區間</label>
          <div className="flex items-center gap-2">
            <TextInput type="number" placeholder="最小金額" value={advanced.minAmount} onChange={e => onAdvancedChange({ ...advanced, minAmount: e.target.value })} />
            <span className="shrink-0 text-sm text-neutral-mid">至</span>
            <TextInput type="number" placeholder="最大金額" value={advanced.maxAmount} onChange={e => onAdvancedChange({ ...advanced, maxAmount: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">各類扣繳繳款狀態</label>
          <Select
            widthClassName="w-full"
            value={advanced.withholdingPaid}
            onValueChange={v => onAdvancedChange({ ...advanced, withholdingPaid: v as WithholdingAdvancedFilter['withholdingPaid'] })}
          >
            <option value="">不限</option>
            <option value="true">已繳納</option>
            <option value="false">未繳納</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">二代健保繳費狀態</label>
          <Select
            widthClassName="w-full"
            value={advanced.nhiPaid}
            onValueChange={v => onAdvancedChange({ ...advanced, nhiPaid: v as WithholdingAdvancedFilter['nhiPaid'] })}
          >
            <option value="">不限</option>
            <option value="true">已繳納</option>
            <option value="false">未繳納</option>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2.5 border-t border-neutral-blue-gray/20 pt-3">
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
          <div className="flex-1">
            <TextInput
              placeholder="請輸入所得人姓名或扣繳編號"
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
        <TextInput
          placeholder="搜尋所得人姓名或扣繳編號"
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
    </>
  );
}
