'use client';

import Button from '@/components/ui/Button';
import DatePicker, { formatRocDate, parseRocDate } from '@/components/ui/DatePicker';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useState } from 'react';

export type LaborQuickField = 'name' | 'serviceName';

export interface LaborAdvancedFilter {
  payableAmountMin: string;
  payableAmountMax: string;
  withholdingTaxMin: string;
  withholdingTaxMax: string;
  secondHealthInsuranceFeeMin: string;
  secondHealthInsuranceFeeMax: string;
  serviceDateFrom: string;
  serviceDateTo: string;
  paymentDateFrom: string;
  paymentDateTo: string;
}

export const EMPTY_LABOR_ADVANCED: LaborAdvancedFilter = {
  payableAmountMin: '',
  payableAmountMax: '',
  withholdingTaxMin: '',
  withholdingTaxMax: '',
  secondHealthInsuranceFeeMin: '',
  secondHealthInsuranceFeeMax: '',
  serviceDateFrom: '',
  serviceDateTo: '',
  paymentDateFrom: '',
  paymentDateTo: '',
};

const QUICK_FIELDS: { value: LaborQuickField; label: string; placeholder: string }[] = [
  { value: 'name', label: '姓名', placeholder: '請輸入姓名' },
  { value: 'serviceName', label: '專案名稱', placeholder: '請輸入專案名稱' },
];

interface LaborFilterBarProps {
  quickField: LaborQuickField;
  onQuickFieldChange: (v: LaborQuickField) => void;
  query: string;
  onQueryChange: (v: string) => void;
  onSearch: () => void;
  onClearQuick: () => void;
  advanced: LaborAdvancedFilter;
  onAdvancedChange: (v: LaborAdvancedFilter) => void;
  onAdvancedApply: (next?: LaborAdvancedFilter) => void;
}

/**
 * 勞報單簡易搜尋（姓名／專案名稱擇一）＋進階搜尋（總金額／扣繳稅金／二代健保費／勞務日期／付款日期區間），
 * 比照帳簿 FilterBar 的形狀；POST /ael/labour/data/filter 支援這些欄位同時送出。
 */
export default function LaborFilterBar({ quickField, onQuickFieldChange, query, onQueryChange, onSearch, onClearQuick, advanced, onAdvancedChange, onAdvancedApply }: LaborFilterBarProps) {
  const [advOpen, setAdvOpen] = useState(false);
  const activeField = QUICK_FIELDS.find(f => f.value === quickField) ?? QUICK_FIELDS[0];

  const handleQuickFieldChange = (v: string) => {
    onQuickFieldChange(v as LaborQuickField);
    onQueryChange('');
  };

  const handleClearAdvanced = () => {
    onAdvancedChange(EMPTY_LABOR_ADVANCED);
    onAdvancedApply(EMPTY_LABOR_ADVANCED);
  };

  const AdvancedPanel = (
    <div className="flex flex-col gap-4 rounded-md border border-neutral-blue-gray/30 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">總金額區間</label>
          <div className="flex items-center gap-2">
            <TextInput type="number" placeholder="最小金額" value={advanced.payableAmountMin} onChange={e => onAdvancedChange({ ...advanced, payableAmountMin: e.target.value })} />
            <span className="shrink-0 text-sm text-neutral-mid">至</span>
            <TextInput type="number" placeholder="最大金額" value={advanced.payableAmountMax} onChange={e => onAdvancedChange({ ...advanced, payableAmountMax: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">扣繳稅金區間</label>
          <div className="flex items-center gap-2">
            <TextInput type="number" placeholder="最小金額" value={advanced.withholdingTaxMin} onChange={e => onAdvancedChange({ ...advanced, withholdingTaxMin: e.target.value })} />
            <span className="shrink-0 text-sm text-neutral-mid">至</span>
            <TextInput type="number" placeholder="最大金額" value={advanced.withholdingTaxMax} onChange={e => onAdvancedChange({ ...advanced, withholdingTaxMax: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">二代健保費區間</label>
          <div className="flex items-center gap-2">
            <TextInput
              type="number"
              placeholder="最小金額"
              value={advanced.secondHealthInsuranceFeeMin}
              onChange={e => onAdvancedChange({ ...advanced, secondHealthInsuranceFeeMin: e.target.value })}
            />
            <span className="shrink-0 text-sm text-neutral-mid">至</span>
            <TextInput
              type="number"
              placeholder="最大金額"
              value={advanced.secondHealthInsuranceFeeMax}
              onChange={e => onAdvancedChange({ ...advanced, secondHealthInsuranceFeeMax: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">勞務提供日期區間</label>
          <div className="flex items-center gap-2">
            <DatePicker value={parseRocDate(advanced.serviceDateFrom)} onChange={date => onAdvancedChange({ ...advanced, serviceDateFrom: formatRocDate(date) })} placeholder="起" />
            <span className="shrink-0 text-sm text-neutral-mid">至</span>
            <DatePicker value={parseRocDate(advanced.serviceDateTo)} onChange={date => onAdvancedChange({ ...advanced, serviceDateTo: formatRocDate(date) })} placeholder="迄" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">勞務付款日期區間</label>
          <div className="flex items-center gap-2">
            <DatePicker value={parseRocDate(advanced.paymentDateFrom)} onChange={date => onAdvancedChange({ ...advanced, paymentDateFrom: formatRocDate(date) })} placeholder="起" />
            <span className="shrink-0 text-sm text-neutral-mid">至</span>
            <DatePicker value={parseRocDate(advanced.paymentDateTo)} onChange={date => onAdvancedChange({ ...advanced, paymentDateTo: formatRocDate(date) })} placeholder="迄" />
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 nav:flex-row nav:items-center">
        <div className="w-full nav:w-32">
          <Select widthClassName="w-full" value={quickField} onValueChange={handleQuickFieldChange}>
            {QUICK_FIELDS.map(f => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1">
          <TextInput placeholder={activeField.placeholder} value={query} onChange={e => onQueryChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch()} />
        </div>
        <div className="flex gap-2">
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
      </div>
      {advOpen && AdvancedPanel}
    </div>
  );
}
