'use client';

import type { InputHTMLAttributes } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  widthClassName?: string;
}

export default function TextInput({ widthClassName = 'w-full', className = '', ...rest }: TextInputProps) {
  return (
    <input
      className={`h-10 ${widthClassName} rounded-lg border-[1.5px] border-neutral-blue-gray/50 bg-white px-3 text-sm text-neutral-dark outline-none transition-colors placeholder:text-neutral-mid focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 disabled:cursor-not-allowed disabled:bg-surface-cream disabled:text-neutral-mid ${className}`}
      {...rest}
    />
  );
}
