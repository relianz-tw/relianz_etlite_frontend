'use client';

import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { fmtCurrency } from '@/lib/utils';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

interface ReconAmountFilterProps {
  /** 目前套用中的金額下限／上限；空字串代表不限 */
  amountFrom: string;
  amountTo: string;
  onApply: (amountFrom: string, amountTo: string) => void;
}

/**
 * 金額篩選：預設收合為單一觸發鈕（不限金額 / 目前套用區間），互動模式比照 ReconDateFilter——
 * 彈出層內先編輯草稿，按下「套用」才送出並觸發候選清單重新拉取，避免每敲一位數字就重打 API。
 */
export default function ReconAmountFilter({ amountFrom, amountTo, onApply }: ReconAmountFilterProps) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(amountFrom);
  const [draftTo, setDraftTo] = useState(amountTo);
  const hasFilter = !!(amountFrom || amountTo);
  const label = hasFilter
    ? `${amountFrom ? fmtCurrency(Number(amountFrom)) : '不限'} – ${amountTo ? fmtCurrency(Number(amountTo)) : '不限'}`
    : '不限金額';

  // 每次開啟彈出層都以目前已套用的值重設草稿，避免上次取消編輯到一半的殘留值
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setDraftFrom(amountFrom);
      setDraftTo(amountTo);
    }
  };

  const handleApply = () => {
    onApply(draftFrom, draftTo);
    setOpen(false);
  };
  const handleClear = () => {
    setDraftFrom('');
    setDraftTo('');
    onApply('', '');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 shrink-0 items-center gap-2 rounded-lg border-[1.5px] border-neutral-blue-gray/50 bg-white px-3 text-xs text-neutral-dark transition-colors hover:border-brand-blue nav:text-sm"
        >
          <SlidersHorizontal size={14} className="shrink-0 text-neutral-mid" />
          <span className="whitespace-nowrap font-mono">{label}</span>
          <ChevronDown size={14} className="shrink-0 text-neutral-mid" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,340px)] p-4">
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-neutral-mid">金額區間</label>
          <div className="flex items-center gap-2">
            <MoneyInput value={draftFrom ? Number(draftFrom) : 0} onChange={v => setDraftFrom(v ? String(v) : '')} />
            <span className="shrink-0 text-sm text-neutral-mid">至</span>
            <MoneyInput value={draftTo ? Number(draftTo) : 0} onChange={v => setDraftTo(v ? String(v) : '')} />
          </div>
          <div className="flex justify-end gap-2.5 border-t border-neutral-blue-gray/20 pt-3">
            <Button variant="ghost" onClick={handleClear}>
              清除
            </Button>
            <Button variant="primary" onClick={handleApply}>
              套用
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
