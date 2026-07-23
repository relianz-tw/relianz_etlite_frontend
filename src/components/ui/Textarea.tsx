'use client';

import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  widthClassName?: string;
}

export default function Textarea({ widthClassName = 'w-full', className = '', rows = 4, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={`${widthClassName} resize-none rounded-lg border-[1.5px] border-neutral-blue-gray/50 bg-white px-3 py-2 text-sm text-neutral-dark outline-none transition-colors placeholder:text-neutral-mid focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 disabled:cursor-not-allowed disabled:bg-surface-cream disabled:text-neutral-mid ${className}`}
      {...rest}
    />
  );
}
