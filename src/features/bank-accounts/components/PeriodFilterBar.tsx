'use client';

import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import { RotateCcw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PeriodFilterBarProps {
  /** 目前套用中的起始日，YYYYMMDD */
  dateFrom: string;
  /** 目前套用中的結束日，YYYYMMDD */
  dateTo: string;
  /** 「近一個月」預設起訖日，供「重設」按鈕使用 */
  defaultDateFrom: string;
  defaultDateTo: string;
  onApply: (dateFrom: string, dateTo: string) => void;
}

function ymdToDate(ymd: string): Date | undefined {
  if (!/^\d{8}$/.test(ymd)) return undefined;
  return new Date(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)));
}

function dateToYmd(date: Date | undefined): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/** 期間查詢：兩個日期欄位同時作為「近一個月」預設值的顯示與自訂區間的輸入，套用前驗證結束日不得早於起始日 */
export default function PeriodFilterBar({ dateFrom, dateTo, defaultDateFrom, defaultDateTo, onApply }: PeriodFilterBarProps) {
  const [fromDraft, setFromDraft] = useState<Date | undefined>(() => ymdToDate(dateFrom));
  const [toDraft, setToDraft] = useState<Date | undefined>(() => ymdToDate(dateTo));
  const [error, setError] = useState('');

  // 外部套用值變動時（重設按鈕或網址列直接帶參數）同步草稿，避免顯示與實際套用中的期間不一致
  useEffect(() => {
    setFromDraft(ymdToDate(dateFrom));
    setToDraft(ymdToDate(dateTo));
  }, [dateFrom, dateTo]);

  const handleApply = () => {
    if (!fromDraft || !toDraft) {
      setError('請選擇起始日與結束日');
      return;
    }
    if (fromDraft > toDraft) {
      setError('結束日不得早於起始日');
      return;
    }
    setError('');
    onApply(dateToYmd(fromDraft), dateToYmd(toDraft));
  };

  const handleReset = () => {
    // 直接重設草稿：effectiveDateFrom/dateTo 在未套用自訂區間時本就等於預設值，
    // 若僅呼叫 onApply 而不改變 dateFrom/dateTo 這兩個 prop 的實際值，下方同步用的 useEffect 不會觸發，
    // 畫面會殘留使用者先前輸入但未通過驗證的草稿日期，故此處一併同步更新畫面上的草稿
    setFromDraft(ymdToDate(defaultDateFrom));
    setToDraft(ymdToDate(defaultDateTo));
    setError('');
    onApply(defaultDateFrom, defaultDateTo);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col items-start gap-2.5 nav:flex-row nav:items-center">
        <div className="flex flex-1 items-center gap-2">
          <DatePicker value={fromDraft} onChange={setFromDraft} placeholder="起始日" />
          <span className="shrink-0 text-sm text-neutral-mid">–</span>
          <DatePicker value={toDraft} onChange={setToDraft} placeholder="結束日" />
        </div>
        <div className="flex w-full gap-2.5 nav:w-auto">
          <Button variant="ghost" icon={RotateCcw} className="flex-1 nav:flex-none" onClick={handleReset}>
            近一個月
          </Button>
          <Button variant="primary" icon={Search} className="flex-1 nav:flex-none" onClick={handleApply}>
            套用查詢
          </Button>
        </div>
      </div>
      {error && <p className="text-xs text-semantic-error">{error}</p>}
    </div>
  );
}
