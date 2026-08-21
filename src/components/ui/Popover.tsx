'use client';

import { cn } from '@/lib/utils';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'start', sideOffset = 4, style, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      // 內容比可用空間高時（如選項很多的下拉），靠 collision 翻轉方向仍可能超出視窗，
      // 用 Radix 提供的可用高度變數頂住上限，讓內容自己（如清單區）改為捲動而非把視窗撐爆
      style={{ maxHeight: 'var(--radix-popover-content-available-height)', ...style }}
      className={cn(
        'z-[80] flex w-auto flex-col overflow-hidden rounded-lg border border-neutral-blue-gray/50 bg-white p-0 text-neutral-dark shadow-level1 outline-none',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
