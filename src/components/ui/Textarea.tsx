'use client';

import { Zap } from 'lucide-react';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  widthClassName?: string;
  /** 由 AI／自動辨識帶入值且使用者尚未修改時為 true，顯示綠框＋閃電提示（見 DESIGN.md AI 填入欄位提示） */
  aiFilled?: boolean;
}

export default function Textarea({ widthClassName = 'w-full', className = '', rows = 4, aiFilled, ...rest }: TextareaProps) {
  return (
    <div className={`relative ${widthClassName}`}>
      <textarea
        rows={rows}
        className={`w-full resize-none rounded-lg border-[1.5px] bg-white px-3 py-2 text-sm text-neutral-dark outline-none transition-colors placeholder:text-neutral-mid focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 disabled:cursor-not-allowed disabled:bg-surface-cream disabled:text-neutral-mid ${
          aiFilled ? 'border-semantic-success bg-semantic-success/5 pl-8' : 'border-neutral-blue-gray/50'
        } ${className}`}
        {...rest}
      />
      {aiFilled && (
        <Zap aria-hidden="true" size={14} className="pointer-events-none absolute left-3 top-2.5 fill-semantic-success text-semantic-success" />
      )}
    </div>
  );
}
