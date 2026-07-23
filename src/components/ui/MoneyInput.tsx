'use client';

import { cn } from '@/lib/utils';
import type { ChangeEvent } from 'react';

interface MoneyInputProps {
  value: number;
  onChange?: (value: number) => void;
  widthClassName?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export default function MoneyInput({ value, onChange, widthClassName = 'w-full', className = '', disabled, readOnly }: MoneyInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    onChange?.(digits === '' ? 0 : Number(digits));
  };

  return (
    <div
      className={cn(
        'flex h-10 items-center gap-1 rounded-lg border-[1.5px] border-neutral-blue-gray/50 px-3 transition-colors',
        'focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/15',
        disabled ? 'bg-surface-cream' : 'bg-white',
        widthClassName,
        className,
      )}
    >
      <span className="shrink-0 text-sm text-neutral-mid">$</span>
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        readOnly={readOnly}
        value={value.toLocaleString('en-US')}
        onChange={handleChange}
        className="w-full min-w-0 bg-transparent text-right text-sm text-neutral-dark outline-none disabled:text-neutral-mid"
      />
    </div>
  );
}
