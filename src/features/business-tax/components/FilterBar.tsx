'use client';

import Button from '@/components/ui/Button';
import DatePicker, { formatRocDate, parseRocDate } from '@/components/ui/DatePicker';
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

const EMPTY_ADVANCED: AdvancedFilter = { minAmount: '', maxAmount: '', dateFrom: '', dateTo: '', taxIdNumber: '', companyName: '', isVoid: '' };

export default function FilterBar({ onOpenReport, query, onQueryChange, onSearch, advanced, onAdvancedChange, onAdvancedApply }: FilterBarProps) {
  const [advOpen, setAdvOpen] = useState(false);

  const handleClearAdvanced = () => {
    onAdvancedChange(EMPTY_ADVANCED);
    onAdvancedApply(EMPTY_ADVANCED);
  };

  const AdvancedPanel = (
    <div className="flex flex-col gap-4 rounded-md border border-neutral-blue-gray/30 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 nav:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">開立日期區間</label>
          <div className="flex items-center gap-2">
            <DatePicker
              value={parseRocDate(advanced.dateFrom)}
              onChange={date => onAdvancedChange({ ...advanced, dateFrom: formatRocDate(date) })}
              placeholder="起"
            />
            <span className="shrink-0 text-sm text-neutral-mid">至</span>
            <DatePicker
              value={parseRocDate(advanced.dateTo)}
              onChange={date => onAdvancedChange({ ...advanced, dateTo: formatRocDate(date) })}
              placeholder="迄"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">金額區間</label>
          <div className="flex items-center gap-2">
            <TextInput type="number" placeholder="最小金額" value={advanced.minAmount} onChange={e => onAdvancedChange({ ...advanced, minAmount: e.target.value })} />
            <span className="shrink-0 text-sm text-neutral-mid">至</span>
            <TextInput type="number" placeholder="最大金額" value={advanced.maxAmount} onChange={e => onAdvancedChange({ ...advanced, maxAmount: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">是否已作廢</label>
          <Select
            widthClassName="w-full"
            value={advanced.isVoid}
            onValueChange={v => onAdvancedChange({ ...advanced, isVoid: v as AdvancedFilter['isVoid'] })}
          >
            <option value="">不限</option>
            <option value="false">未作廢</option>
            <option value="true">已作廢</option>
          </Select>
        </div>
        <div>
          {/* 進項比對賣方、銷項比對買方統編／名稱，語意由 side 決定，欄位標籤統一用「對方」不分邊 */}
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">統一編號</label>
          <TextInput placeholder="請輸入統一編號" value={advanced.taxIdNumber} onChange={e => onAdvancedChange({ ...advanced, taxIdNumber: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">公司名稱</label>
          <TextInput placeholder="請輸入公司名稱" value={advanced.companyName} onChange={e => onAdvancedChange({ ...advanced, companyName: e.target.value })} />
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
              placeholder="請輸入發票字軌或號碼"
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
          <Button variant="warm" icon={Download} onClick={onOpenReport} disabled title="後端尚未提供轉出申報檔資料，暫停用">
            轉出本期營業稅申報檔
          </Button>
        </div>
        {advOpen && AdvancedPanel}
      </div>

      {/* 手機 */}
      <div className="flex flex-col gap-3 nav:hidden">
        <TextInput
          placeholder="搜尋發票字軌或號碼"
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
        <Button variant="warm" icon={Download} className="w-full" onClick={onOpenReport} disabled title="後端尚未提供轉出申報檔資料，暫停用">
          轉出本期營業稅申報檔
        </Button>
      </div>
    </>
  );
}
