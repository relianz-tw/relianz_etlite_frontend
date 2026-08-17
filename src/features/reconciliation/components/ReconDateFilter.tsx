'use client';

import Checkbox from '@/components/ui/Checkbox';
import PeriodFilterBar from '@/components/ui/PeriodFilterBar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { formatYyyymmddRoc } from '@/lib/utils';
import { CalendarRange, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface ReconDateFilterProps {
  /** 目前套用中的起始日／結束日，YYYYMMDD（unlimitedDate 為 true 時不影響查詢，僅保留供彈出層草稿） */
  dateFrom: string;
  dateTo: string;
  defaultDateFrom: string;
  defaultDateTo: string;
  unlimitedDate: boolean;
  onApply: (dateFrom: string, dateTo: string) => void;
  onToggleUnlimitedDate: () => void;
}

/**
 * 日期篩選：預設收合為單一觸發鈕（不限日期 / 目前套用區間），點擊才展開「不限日期」勾選與期間選擇器。
 * 沖帳中心預設查詢全部未結清交易（unlimitedDate 初始 true，見 ReconciliationView），比起先前常駐展開的
 * 期間列，收合後首屏能少佔一排空間，讓金額面板與交易清單更早出現在可視範圍內。
 */
export default function ReconDateFilter({ dateFrom, dateTo, defaultDateFrom, defaultDateTo, unlimitedDate, onApply, onToggleUnlimitedDate }: ReconDateFilterProps) {
  const [open, setOpen] = useState(false);
  const label = unlimitedDate ? '不限日期' : `${formatYyyymmddRoc(dateFrom)} – ${formatYyyymmddRoc(dateTo)}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 shrink-0 items-center gap-2 rounded-lg border-[1.5px] border-neutral-blue-gray/50 bg-white px-3 text-xs text-neutral-dark transition-colors hover:border-brand-blue nav:text-sm"
        >
          <CalendarRange size={14} className="shrink-0 text-neutral-mid" />
          <span className="whitespace-nowrap font-mono">{label}</span>
          <ChevronDown size={14} className="shrink-0 text-neutral-mid" />
        </button>
      </PopoverTrigger>
      {/* PeriodFilterBar 在 nav 斷點（1000px 視窗寬）以上會切成日期選擇器＋按鈕同一列橫排（見該元件），
          這是依「視窗寬度」而非彈出層本身寬度判斷，故此處彈出層寬度需留夠橫排空間，
          否則桌機視窗超過 1000px 時內容會被 340px 窄版擠壓溢出（見使用者回報的跑版截圖） */}
      <PopoverContent align="end" className="w-[min(92vw,560px)] p-4">
        <div className="flex flex-col gap-3">
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-neutral-dark">
            <Checkbox checked={unlimitedDate} onChange={onToggleUnlimitedDate} aria-label="不限日期，顯示全部未結清交易" />
            不限日期，顯示全部未結清交易
          </label>
          <PeriodFilterBar
            dateFrom={dateFrom}
            dateTo={dateTo}
            defaultDateFrom={defaultDateFrom}
            defaultDateTo={defaultDateTo}
            onApply={(from, to) => {
              onApply(from, to);
              setOpen(false);
            }}
            disabled={unlimitedDate}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
