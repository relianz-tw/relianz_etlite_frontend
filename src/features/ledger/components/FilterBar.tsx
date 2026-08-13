'use client';

import Button from '@/components/ui/Button';
import DatePicker, { formatRocDate, parseRocDate } from '@/components/ui/DatePicker';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import NewTransactionDialog from '@/components/NewTransactionDialog';
import { ChevronDown, ChevronUp, Plus, Search, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { AdvancedFilter, QuickSearchField, Side } from '../types';
import { withReturnParam } from '../urlState';

export interface FilterBarProps {
  side: Side;
  quickField: QuickSearchField;
  onQuickFieldChange: (v: QuickSearchField) => void;
  query: string;
  onQueryChange: (v: string) => void;
  onSearch: () => void;
  onClearQuick: () => void;
  advanced: AdvancedFilter;
  onAdvancedChange: (v: AdvancedFilter) => void;
  onAdvancedApply: (next?: AdvancedFilter) => void;
}

/** 簡易搜尋欄位選項：對應後端 filterType，銷項／進項共用 */
const QUICK_FIELDS: { value: QuickSearchField; label: string; placeholder: string }[] = [
  { value: 'id', label: '交易編號', placeholder: '請輸入交易編號' },
  { value: 'invoice', label: '發票號碼', placeholder: '請輸入發票號碼' },
];

type PeriodType = 'month' | 'year';

const PERIOD_TYPE_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'month', label: '月' },
  { value: 'year', label: '年' },
];

/** 依當下日期計算「本月」或「本年度」的起訖日期，供交易期間選擇自動對應日期區間 */
function getPeriodRange(type: PeriodType, today: Date): [Date, Date] {
  if (type === 'month') {
    return [new Date(today.getFullYear(), today.getMonth(), 1), new Date(today.getFullYear(), today.getMonth() + 1, 0)];
  }
  return [new Date(today.getFullYear(), 0, 1), new Date(today.getFullYear(), 11, 31)];
}

const EMPTY_ADVANCED: AdvancedFilter = {
  minAmount: '',
  maxAmount: '',
  dateFrom: '',
  dateTo: '',
};

export default function FilterBar({
  side,
  quickField,
  onQuickFieldChange,
  query,
  onQueryChange,
  onSearch,
  onClearQuick,
  advanced,
  onAdvancedChange,
  onAdvancedApply,
}: FilterBarProps) {
  const searchParams = useSearchParams();
  // 手開發票的目的地：帶入目前銷項／進項側別，並保留返回帳簿時的篩選狀態
  const manualHref = withReturnParam(`/ledger/new?side=${side}`, searchParams);
  const [advOpen, setAdvOpen] = useState(false);
  const [newTxOpen, setNewTxOpen] = useState(false);

  // 交易期間：預設為「月」，切換月／年時自動對應到當下該月／該年的起訖日期，日期亦可再手動調整；
  // 三者的變更皆直接寫入 advanced.dateFrom/dateTo 並立即套用篩選（呼叫 filter API），銷項／進項共用同一組邏輯
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [periodFrom, setPeriodFrom] = useState<Date | undefined>(() => getPeriodRange('month', new Date())[0]);
  const [periodTo, setPeriodTo] = useState<Date | undefined>(() => getPeriodRange('month', new Date())[1]);
  const handlePeriodTypeChange = (type: PeriodType) => {
    setPeriodType(type);
    const [start, end] = getPeriodRange(type, new Date());
    setPeriodFrom(start);
    setPeriodTo(end);
    const next = { ...advanced, dateFrom: formatRocDate(start), dateTo: formatRocDate(end) };
    onAdvancedChange(next);
    onAdvancedApply(next);
  };
  const handlePeriodFromChange = (date: Date | undefined) => {
    setPeriodFrom(date);
    const next = { ...advanced, dateFrom: formatRocDate(date) };
    onAdvancedChange(next);
    onAdvancedApply(next);
  };
  const handlePeriodToChange = (date: Date | undefined) => {
    setPeriodTo(date);
    const next = { ...advanced, dateTo: formatRocDate(date) };
    onAdvancedChange(next);
    onAdvancedApply(next);
  };

  const activeField = QUICK_FIELDS.find(f => f.value === quickField) ?? QUICK_FIELDS[0];

  // 切換簡易搜尋欄位時清空輸入值，避免帶著不相干欄位的舊值搜尋
  const handleQuickFieldChange = (v: string) => {
    onQuickFieldChange(v as QuickSearchField);
    onQueryChange('');
  };

  const handleClearAdvanced = () => {
    onAdvancedChange(EMPTY_ADVANCED);
    onAdvancedApply(EMPTY_ADVANCED);
  };

  const quickInput = (
    <TextInput placeholder={activeField.placeholder} value={query} onChange={e => onQueryChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch()} />
  );

  const AdvancedPanel = (
    <div className="flex flex-col gap-4 rounded-md border border-neutral-blue-gray/30 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">交易日期區間</label>
          <div className="flex items-center gap-2">
            <DatePicker value={parseRocDate(advanced.dateFrom)} onChange={date => onAdvancedChange({ ...advanced, dateFrom: formatRocDate(date) })} placeholder="起" />
            <span className="shrink-0 text-sm text-neutral-mid">至</span>
            <DatePicker value={parseRocDate(advanced.dateTo)} onChange={date => onAdvancedChange({ ...advanced, dateTo: formatRocDate(date) })} placeholder="迄" />
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
      </div>

      <div className="flex justify-end gap-2.5 border-t border-neutral-blue-gray/20 pt-3">
        <Button variant="ghost" onClick={handleClearAdvanced}>
          清除條件
        </Button>
        <Button variant="primary" onClick={() => onAdvancedApply()}>
          套用
        </Button>
      </div>
    </div>
  );

  const QuickFieldSelect = ({ widthClassName }: { widthClassName: string }) => (
    <Select widthClassName={widthClassName} value={quickField} onValueChange={handleQuickFieldChange}>
      {QUICK_FIELDS.map(f => (
        <option key={f.value} value={f.value}>
          {f.label}
        </option>
      ))}
    </Select>
  );

  return (
    <>
      {/* 桌機 */}
      <div className="hidden flex-col gap-3 nav:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex flex-[2] items-center gap-2">
            <div className="w-24 shrink-0">
              <SegmentedControl options={PERIOD_TYPE_OPTIONS} value={periodType} onChange={handlePeriodTypeChange} size="sm" />
            </div>
            <DatePicker value={periodFrom} onChange={handlePeriodFromChange} placeholder="起" />
            <span className="shrink-0 text-sm text-neutral-mid">–</span>
            <DatePicker value={periodTo} onChange={handlePeriodToChange} placeholder="迄" />
          </div>
          <Button variant="warm" icon={Plus} onClick={() => setNewTxOpen(true)}>
            新增交易
          </Button>
        </div>
        <div className="flex items-center gap-2.5">
          <QuickFieldSelect widthClassName="w-40" />
          <div className="flex-1">{quickInput}</div>
          <Button variant="primary" icon={Search} onClick={onSearch}>
            搜尋
          </Button>
          {query && (
            <Button variant="ghost" icon={X} onClick={onClearQuick} title="清除搜尋條件">
              清除
            </Button>
          )}
          <Button variant="ghost" icon={advOpen ? ChevronUp : ChevronDown} iconPosition="right" onClick={() => setAdvOpen(o => !o)}>
            進階搜尋
          </Button>
        </div>
        {advOpen && AdvancedPanel}
      </div>

      {/* 手機 */}
      <div className="flex flex-col gap-3 nav:hidden">
        <div className="flex flex-col gap-2">
          <SegmentedControl options={PERIOD_TYPE_OPTIONS} value={periodType} onChange={handlePeriodTypeChange} size="sm" />
          <div className="flex items-center gap-2">
            <DatePicker value={periodFrom} onChange={handlePeriodFromChange} placeholder="起" />
            <span className="shrink-0 text-sm text-neutral-mid">–</span>
            <DatePicker value={periodTo} onChange={handlePeriodToChange} placeholder="迄" />
          </div>
        </div>
        <Button variant="primary" icon={Plus} className="w-full" onClick={() => setNewTxOpen(true)}>
          新增交易
        </Button>
        <QuickFieldSelect widthClassName="w-full" />
        {quickInput}
        <div className="flex gap-2.5">
          <Button variant="primary" icon={Search} className="flex-1" onClick={onSearch}>
            搜尋
          </Button>
          <Button variant="ghost" icon={advOpen ? ChevronUp : ChevronDown} iconPosition="right" className="flex-1" onClick={() => setAdvOpen(o => !o)}>
            進階搜尋
          </Button>
        </div>
        {query && (
          <Button variant="ghost" icon={X} onClick={onClearQuick}>
            清除搜尋條件
          </Button>
        )}
        {advOpen && AdvancedPanel}
      </div>

      <NewTransactionDialog open={newTxOpen} onClose={() => setNewTxOpen(false)} manualHref={manualHref} />
    </>
  );
}
