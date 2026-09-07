'use client';

import { updateLabourPaymentDate } from '@/api/labour';
import { parseRocDate } from '@/components/ui/DatePicker';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import LockedBanner from '../components/LockedBanner';
import { useLock } from '../components/LockContext';
import WithholdingTabs from '../components/WithholdingTabs';
import LaborCards from './components/LaborCards';
import LaborFilterBar, { EMPTY_LABOR_ADVANCED, type LaborAdvancedFilter, type LaborQuickField } from './components/LaborFilterBar';
import LaborImportDialog from './components/LaborImportDialog';
import LaborTable from './components/LaborTable';
import { toYyyymmdd } from './data';
import { useLaborDates, useLaborList, type LaborSearchFilters, type SignFilter } from './useLaborList';

export default function LaborListView() {
  const { isLocked } = useLock();
  const { dates, loading: datesLoading } = useLaborDates();

  const years = useMemo(() => Array.from(new Set(dates.map(d => d.year))).sort((a, b) => b - a), [dates]);

  const [signFilter, setSignFilter] = useState<SignFilter>('all');
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState(0); // 0 = 全部月份
  const [importOpen, setImportOpen] = useState(false);

  // 年月下拉資料到位後預設選最新一年（GET /ael/labour/date 依 year DESC 排序）
  useEffect(() => {
    if (year === null && years.length > 0) setYear(years[0]);
  }, [year, years]);

  const monthOptions = useMemo(() => {
    if (year === null) return [];
    return Array.from(new Set(dates.filter(d => d.year === year).map(d => d.month))).sort((a, b) => a - b);
  }, [dates, year]);

  const [quickField, setQuickField] = useState<LaborQuickField>('name');
  const [query, setQuery] = useState('');
  const [appliedQuick, setAppliedQuick] = useState<{ field: LaborQuickField; value: string } | null>(null);
  const [advanced, setAdvanced] = useState<LaborAdvancedFilter>(EMPTY_LABOR_ADVANCED);
  const [appliedAdvanced, setAppliedAdvanced] = useState<LaborAdvancedFilter>(EMPTY_LABOR_ADVANCED);

  const filters: LaborSearchFilters = useMemo(() => {
    const toNum = (s: string) => (s.trim() ? Number(s) : undefined);
    const serviceFrom = parseRocDate(appliedAdvanced.serviceDateFrom);
    const serviceTo = parseRocDate(appliedAdvanced.serviceDateTo);
    const paymentFrom = parseRocDate(appliedAdvanced.paymentDateFrom);
    const paymentTo = parseRocDate(appliedAdvanced.paymentDateTo);
    return {
      ...(appliedQuick?.value.trim() ? { [appliedQuick.field]: appliedQuick.value.trim() } : {}),
      payableAmountMin: toNum(appliedAdvanced.payableAmountMin),
      payableAmountMax: toNum(appliedAdvanced.payableAmountMax),
      withholdingTaxMin: toNum(appliedAdvanced.withholdingTaxMin),
      withholdingTaxMax: toNum(appliedAdvanced.withholdingTaxMax),
      secondHealthInsuranceFeeMin: toNum(appliedAdvanced.secondHealthInsuranceFeeMin),
      secondHealthInsuranceFeeMax: toNum(appliedAdvanced.secondHealthInsuranceFeeMax),
      serviceDateStart: serviceFrom ? toYyyymmdd(serviceFrom) : undefined,
      serviceDateEnd: serviceTo ? toYyyymmdd(serviceTo) : undefined,
      paymentDateStart: paymentFrom ? toYyyymmdd(paymentFrom) : undefined,
      paymentDateEnd: paymentTo ? toYyyymmdd(paymentTo) : undefined,
    };
  }, [appliedQuick, appliedAdvanced]);

  const { records, loading, error, patchRecord } = useLaborList({
    year: year ?? 0,
    month,
    signFilter,
    filters,
    enabled: year !== null,
  });

  const handleYearChange = (v: string) => {
    setYear(Number(v));
    setMonth(0);
  };

  const handleSearch = () => setAppliedQuick({ field: quickField, value: query });
  const handleClearQuick = () => {
    setQuery('');
    setAppliedQuick(null);
  };
  const handleAdvancedApply = (next?: LaborAdvancedFilter) => setAppliedAdvanced(next ?? advanced);

  const handlePaymentDateChange = async (uuid: string, date: Date) => {
    const paymentYear = date.getFullYear();
    const paymentMonth = date.getMonth() + 1;
    const paymentDay = date.getDate();
    await updateLabourPaymentDate({ labourUuid: uuid, paymentYear, paymentMonth, paymentDay });
    patchRecord(uuid, { paymentYear, paymentMonth, paymentDay });
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="flex flex-col gap-4 nav:flex-row nav:items-start nav:justify-between">
          <div>
            <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">勞報單</h1>
          </div>
          <WithholdingTabs active="labor" />
        </div>

        <LockedBanner />

        <div className="flex flex-col gap-3 nav:flex-row nav:items-center nav:justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="w-32">
              <Select widthClassName="w-full" value={year !== null ? String(year) : ''} onValueChange={handleYearChange} disabled={datesLoading || years.length === 0}>
                {years.length === 0 ? (
                  <option value="">無資料</option>
                ) : (
                  years.map(y => (
                    <option key={y} value={String(y)}>
                      {y - 1911} 年
                    </option>
                  ))
                )}
              </Select>
            </div>
            <div className="w-32">
              <Select widthClassName="w-full" value={String(month)} onValueChange={v => setMonth(Number(v))} disabled={year === null}>
                <option value="0">全部月份</option>
                {monthOptions.map(m => (
                  <option key={m} value={String(m)}>
                    {m} 月
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-32">
              <Select widthClassName="w-full" value={signFilter} onValueChange={v => setSignFilter(v as SignFilter)}>
                <option value="all">全部</option>
                <option value="signed">已簽署</option>
                <option value="unsigned">未簽署</option>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" icon={Upload} disabled={isLocked} onClick={() => setImportOpen(true)}>
              批次匯入
            </Button>
            <Link href="/withholding/labor/create" className="inline-flex">
              <Button icon={Plus} disabled={isLocked}>
                新增勞報單
              </Button>
            </Link>
          </div>
        </div>

        <LaborFilterBar
          quickField={quickField}
          onQuickFieldChange={setQuickField}
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          onClearQuick={handleClearQuick}
          advanced={advanced}
          onAdvancedChange={setAdvanced}
          onAdvancedApply={handleAdvancedApply}
        />

        {datesLoading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : years.length === 0 ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">目前尚無勞報單資料，請先點擊右上角「新增勞報單」建立第一筆資料。</div>
        ) : loading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : error ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{error}</div>
        ) : (
          <>
            <LaborTable rows={records} isLocked={isLocked} onPaymentDateChange={handlePaymentDateChange} />
            <LaborCards rows={records} />
          </>
        )}
      </div>

      <LaborImportDialog open={importOpen} onClose={() => setImportOpen(false)} disabled={isLocked} />
    </div>
  );
}
