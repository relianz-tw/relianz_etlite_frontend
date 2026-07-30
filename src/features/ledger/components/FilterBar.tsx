'use client';

import Button from '@/components/ui/Button';
import DatePicker, { formatRocDate, parseRocDate } from '@/components/ui/DatePicker';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import { SubjectNameSelect } from '@/components/ui/SubjectSelect';
import TextInput from '@/components/ui/TextInput';
import { ChevronDown, ChevronUp, Plus, Search, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { officialSubjectYear, PROJECT_NAMES, SALES_CHANNELS } from '../data';
import type { AdvancedFilter, QuickSearchField, Side } from '../types';
import ImportInvoiceDialog from './ImportInvoiceDialog';

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

const STATUS_OPTIONS: { value: AdvancedFilter['status']; label: string }[] = [
  { value: 'all', label: '全部狀態' },
  { value: 'normal', label: '正常' },
  { value: 'voided', label: '已作廢' },
];

/** 簡易搜尋欄位選項：交易編號／往來對象為共用欄位，其餘依銷項／進項顯示 */
const SALES_QUICK_FIELDS: { value: QuickSearchField; label: string; placeholder: string }[] = [
  { value: 'id', label: '交易編號', placeholder: '請輸入交易編號' },
  { value: 'counterparty', label: '買受人', placeholder: '請輸入買受人名稱' },
  { value: 'channel', label: '銷售管道', placeholder: '請選擇銷售管道' },
];
const PURCHASE_QUICK_FIELDS: { value: QuickSearchField; label: string; placeholder: string }[] = [
  { value: 'id', label: '交易編號', placeholder: '請輸入交易編號' },
  { value: 'counterparty', label: '往來對象', placeholder: '請輸入往來對象名稱' },
  { value: 'category', label: '費用類別', placeholder: '請選擇費用類別' },
  { value: 'project', label: '專案名稱', placeholder: '請選擇專案名稱' },
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
  status: 'all',
  minAmount: '',
  maxAmount: '',
  dateFrom: '',
  dateTo: '',
  counterparty: '',
  channel: '',
  category: '',
  project: '',
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
  const router = useRouter();
  const goToNewTransaction = () => router.push(`/ledger/new?side=${side}`);
  const [advOpen, setAdvOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // 交易期間：預設為「月」，切換月／年時自動對應到當下該月／該年的起訖日期，日期亦可再手動調整
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [periodFrom, setPeriodFrom] = useState<Date | undefined>(() => getPeriodRange('month', new Date())[0]);
  const [periodTo, setPeriodTo] = useState<Date | undefined>(() => getPeriodRange('month', new Date())[1]);
  const handlePeriodTypeChange = (type: PeriodType) => {
    setPeriodType(type);
    const [start, end] = getPeriodRange(type, new Date());
    setPeriodFrom(start);
    setPeriodTo(end);
  };

  const quickFields = side === 'sales' ? SALES_QUICK_FIELDS : PURCHASE_QUICK_FIELDS;
  const activeField = quickFields.find(f => f.value === quickField) ?? quickFields[0];

  // 切換簡易搜尋欄位時清空輸入值，避免帶著不相干欄位的舊值搜尋
  const handleQuickFieldChange = (v: string) => {
    onQuickFieldChange(v as QuickSearchField);
    onQueryChange('');
  };

  const handleClearAdvanced = () => {
    onAdvancedChange(EMPTY_ADVANCED);
    onAdvancedApply(EMPTY_ADVANCED);
  };

  const quickInput =
    activeField.value === 'channel' ? (
      <Select value={query} onValueChange={onQueryChange}>
        <option value="">全部銷售管道</option>
        {SALES_CHANNELS.map(c => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
    ) : activeField.value === 'category' ? (
      <SubjectNameSelect value={query} onChange={onQueryChange} year={officialSubjectYear(new Date())} placeholder="全部費用類別" />
    ) : activeField.value === 'project' ? (
      <Select value={query} onValueChange={onQueryChange}>
        <option value="">全部專案</option>
        {PROJECT_NAMES.filter(Boolean).map(p => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </Select>
    ) : (
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

        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-mid">{side === 'sales' ? '買受人' : '往來對象'}</label>
          <TextInput
            placeholder={side === 'sales' ? '請輸入買受人名稱' : '請輸入往來對象名稱'}
            value={advanced.counterparty}
            onChange={e => onAdvancedChange({ ...advanced, counterparty: e.target.value })}
          />
        </div>

        {side === 'sales' ? (
          <>
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-mid">銷售管道</label>
              <Select value={advanced.channel || 'all'} onValueChange={v => onAdvancedChange({ ...advanced, channel: v === 'all' ? '' : v })}>
                <option value="all">全部銷售管道</option>
                {SALES_CHANNELS.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-mid">狀態</label>
              <Select value={advanced.status} onValueChange={v => onAdvancedChange({ ...advanced, status: v as AdvancedFilter['status'] })}>
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-mid">費用類別</label>
              <SubjectNameSelect
                value={advanced.category}
                onChange={v => onAdvancedChange({ ...advanced, category: v })}
                year={officialSubjectYear(new Date())}
                placeholder="全部費用類別"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-mid">專案名稱</label>
              <Select value={advanced.project || 'all'} onValueChange={v => onAdvancedChange({ ...advanced, project: v === 'all' ? '' : v })}>
                <option value="all">全部專案</option>
                {PROJECT_NAMES.filter(Boolean).map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
          </>
        )}
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
      {quickFields.map(f => (
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
          {side === 'sales' && (
            <div className="flex flex-[2] items-center gap-2">
              <div className="w-24 shrink-0">
                <SegmentedControl options={PERIOD_TYPE_OPTIONS} value={periodType} onChange={handlePeriodTypeChange} size="sm" />
              </div>
              <DatePicker value={periodFrom} onChange={setPeriodFrom} placeholder="起" />
              <span className="shrink-0 text-sm text-neutral-mid">–</span>
              <DatePicker value={periodTo} onChange={setPeriodTo} placeholder="迄" />
            </div>
          )}
          <Button variant="outline" icon={Upload} className="flex-1" onClick={() => setImportOpen(true)}>
            匯入電子發票
          </Button>
          <Button variant="warm" icon={Plus} className="flex-1" onClick={goToNewTransaction}>
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
        {side === 'sales' && (
          <div className="flex flex-col gap-2">
            <SegmentedControl options={PERIOD_TYPE_OPTIONS} value={periodType} onChange={handlePeriodTypeChange} size="sm" />
            <div className="flex items-center gap-2">
              <DatePicker value={periodFrom} onChange={setPeriodFrom} placeholder="起" />
              <span className="shrink-0 text-sm text-neutral-mid">–</span>
              <DatePicker value={periodTo} onChange={setPeriodTo} placeholder="迄" />
            </div>
          </div>
        )}
        <div className="flex gap-2.5">
          <Button variant="outline" icon={Upload} className="flex-1" onClick={() => setImportOpen(true)}>
            匯入電子發票
          </Button>
          <Button variant="primary" icon={Plus} className="flex-1" onClick={goToNewTransaction}>
            新增交易
          </Button>
        </div>
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

      <ImportInvoiceDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
