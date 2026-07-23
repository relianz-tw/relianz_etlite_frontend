'use client';

import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { Calendar } from './Calendar';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/** Date → 民國年 YYY/MM/DD */
function formatRocDate(date: Date | undefined): string {
  if (!date) return '';
  const year = date.getFullYear() - 1911;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/** 輸入值 → 自動插入斜線格式 YYY/MM/DD */
function applyFormat(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 7);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}/${digits.slice(3)}`;
  return `${digits.slice(0, 3)}/${digits.slice(3, 5)}/${digits.slice(5)}`;
}

/** 民國年字串 → Date（無效回傳 undefined） */
function parseRocDate(text: string): Date | undefined {
  const digits = text.replace(/\D/g, '');
  if (digits.length !== 7) return undefined;
  const year = parseInt(digits.slice(0, 3)) + 1911;
  const month = parseInt(digits.slice(3, 5)) - 1;
  const day = parseInt(digits.slice(5, 7));
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return undefined;
  return date;
}

export default function DatePicker({ value, onChange, placeholder = '選擇日期', className = '', disabled = false }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState(formatRocDate(value));

  useEffect(() => {
    setInputText(formatRocDate(value));
  }, [value]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = applyFormat(e.target.value);
    setInputText(formatted);
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 0) {
      onChange(undefined);
    } else if (digits.length === 7) {
      const parsed = parseRocDate(formatted);
      if (parsed) onChange(parsed);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const allowed =
      /^\d$/.test(e.key) ||
      ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) ||
      ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()));
    if (!allowed) e.preventDefault();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-lg border-[1.5px] border-neutral-blue-gray/50 bg-white px-3 transition-colors',
            'focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/15',
            disabled && 'pointer-events-none bg-surface-cream',
            className,
          )}
        >
          <input
            type="text"
            inputMode="numeric"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={9}
            className="w-full min-w-0 bg-transparent text-sm text-neutral-dark outline-none placeholder:text-neutral-mid disabled:text-neutral-mid"
          />
          <CalendarIcon size={16} className="shrink-0 cursor-pointer text-neutral-mid" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          onSelect={date => {
            onChange(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
