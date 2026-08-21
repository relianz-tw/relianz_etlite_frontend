'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';
import { formatTargetBalance } from '../targets';
import type { ReconTarget } from '../targets';

interface ReconTargetSelectProps {
  options: ReconTarget[];
  value: string;
  onChange: (key: string) => void;
  /** 已被主對象或其他分出列選走、不可重複選的 key 集合（呼叫端已排除自己這一列） */
  takenKeys: Set<string>;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * 沖帳對象（銀行帳戶／會計科目）可搜尋下拉。樣式比照 SubjectSelect.tsx 的 trigger／面板，
 * 額外支援：分組標題（銀行帳戶／會計科目）、每列顯示餘額、已被佔用的對象停用並提示原因。
 */
export default function ReconTargetSelect({ options, value, onChange, takenKeys, disabled, placeholder = '請選擇對象' }: ReconTargetSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find(o => o.key === value);
  const triggerLabel = selected ? selected.name : placeholder;

  const q = query.trim();
  const filtered = options.filter(o => !q || o.name.includes(q) || o.subLabel.includes(q));
  const bankOptions = filtered.filter(o => o.kind === 'bankAccount');
  const subjectOptions = filtered.filter(o => o.kind === 'subject');

  const handleSelect = (key: string) => {
    onChange(key);
    setOpen(false);
    setQuery('');
  };

  return (
    <Popover
      open={open}
      onOpenChange={o => {
        if (disabled) return;
        setOpen(o);
        if (!o) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border-[1.5px] border-neutral-blue-gray/50 bg-white px-3 text-sm text-neutral-dark outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 disabled:cursor-not-allowed disabled:bg-surface-cream disabled:text-neutral-mid"
        >
          <span className={`min-w-0 flex-1 truncate text-left ${!selected ? 'text-neutral-mid' : ''}`}>{triggerLabel}</span>
          <ChevronDown size={15} className={`shrink-0 text-neutral-mid transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[max(var(--radix-popover-trigger-width),280px)] p-0">
        <div className="flex items-center gap-2 border-b border-neutral-blue-gray/30 px-3 py-2">
          <Search size={15} className="shrink-0 text-neutral-mid" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜尋帳戶或科目"
            className="w-full min-w-0 bg-transparent text-base text-neutral-dark outline-none placeholder:text-neutral-mid nav:text-sm"
          />
        </div>
        <div role="listbox" className="max-h-72 overflow-auto py-1">
          {bankOptions.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-2 text-xs font-semibold text-neutral-mid">銀行帳戶</p>
              {bankOptions.map(o => (
                <TargetRow key={o.key} target={o} selected={o.key === value} takenDisabled={takenKeys.has(o.key)} onSelect={handleSelect} />
              ))}
            </>
          )}
          {subjectOptions.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-2 text-xs font-semibold text-neutral-mid">會計科目</p>
              {subjectOptions.map(o => (
                <TargetRow key={o.key} target={o} selected={o.key === value} takenDisabled={takenKeys.has(o.key)} onSelect={handleSelect} />
              ))}
            </>
          )}
          {filtered.length === 0 && <p className="px-3 py-2 text-sm text-neutral-mid">查無符合的對象</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface TargetRowProps {
  target: ReconTarget;
  selected: boolean;
  takenDisabled: boolean;
  onSelect: (key: string) => void;
}

function TargetRow({ target, selected, takenDisabled, onSelect }: TargetRowProps) {
  const disabled = takenDisabled;
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      onClick={() => onSelect(target.key)}
      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        selected ? 'bg-brand-blue/10 font-semibold text-brand-blue' : 'text-neutral-dark hover:bg-surface-cream'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate">{target.name}</span>
        <span className="block truncate text-xs text-neutral-mid">{disabled ? '已被其他列選用' : target.subLabel}</span>
      </span>
      <span className="shrink-0 text-xs tabular-nums text-neutral-mid">{formatTargetBalance(target.balance)}</span>
      {selected && <Check size={14} className="shrink-0 text-brand-blue" />}
    </button>
  );
}
