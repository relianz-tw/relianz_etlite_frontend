'use client';

import { cn } from '@/lib/utils';
import { addYears, subYears } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { DayPicker, useNavigation } from 'react-day-picker';
import type { ComponentProps } from 'react';

export type CalendarProps = ComponentProps<typeof DayPicker>;

const navBtnClass =
  'inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-dark transition-colors hover:bg-neutral-blue-gray/15 disabled:pointer-events-none disabled:opacity-20';

function CalendarCaption({ displayMonth }: { displayMonth: Date }) {
  const { goToMonth, previousMonth, nextMonth } = useNavigation();
  const year = displayMonth.getFullYear() - 1911;
  const month = String(displayMonth.getMonth() + 1).padStart(2, '0');

  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-1">
        <button type="button" className={navBtnClass} onClick={() => goToMonth(subYears(displayMonth, 1))} aria-label="上一年">
          <ChevronsLeft size={16} />
        </button>
        <button
          type="button"
          className={navBtnClass}
          onClick={() => previousMonth && goToMonth(previousMonth)}
          disabled={!previousMonth}
          aria-label="上個月"
        >
          <ChevronLeft size={16} />
        </button>
      </div>
      <span className="mx-3 text-sm font-semibold text-neutral-dark">
        民國 {year} 年 {month} 月
      </span>
      <div className="flex items-center gap-1">
        <button type="button" className={navBtnClass} onClick={() => nextMonth && goToMonth(nextMonth)} disabled={!nextMonth} aria-label="下個月">
          <ChevronRight size={16} />
        </button>
        <button type="button" className={navBtnClass} onClick={() => goToMonth(addYears(displayMonth, 1))} aria-label="下一年">
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      fixedWeeks
      locale={zhTW}
      className={cn('bg-white p-3', className)}
      classNames={{
        months: 'flex flex-col',
        month: 'w-[280px] space-y-3',
        caption: 'flex items-center justify-between px-1',
        table: 'w-full border-collapse',
        head_row: 'flex justify-between',
        head_cell: 'w-9 text-center text-xs font-semibold text-neutral-mid',
        row: 'mt-1 flex justify-between',
        cell: 'relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20',
        day: 'inline-flex h-9 w-9 items-center justify-center rounded-full font-normal text-neutral-dark transition-colors hover:bg-surface-cream aria-selected:opacity-100',
        day_selected: 'bg-brand-blue text-white hover:bg-brand-blue-dark hover:text-white focus:bg-brand-blue-dark focus:text-white',
        day_today: 'bg-neutral-blue-gray/20 font-semibold text-neutral-dark',
        day_outside: 'text-neutral-blue-gray/40 aria-selected:bg-brand-blue/10 aria-selected:text-neutral-dark',
        day_disabled: 'text-neutral-blue-gray/40',
        day_range_middle: 'rounded-none aria-selected:bg-brand-blue/10 aria-selected:text-neutral-dark',
        day_range_start: 'rounded-full',
        day_range_end: 'rounded-full',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{ Caption: CalendarCaption }}
      {...props}
    />
  );
}
