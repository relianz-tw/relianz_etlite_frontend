'use client';

import { Zap } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  widthClassName?: string;
  /** 由 AI／自動辨識帶入值且使用者尚未修改時為 true，顯示綠框＋閃電提示（見 DESIGN.md AI 填入欄位提示） */
  aiFilled?: boolean;
}

export default function TextInput({ widthClassName = 'w-full', className = '', disabled, placeholder, aiFilled, ...rest }: TextInputProps) {
  return (
    <div className={`relative ${widthClassName}`}>
      <input
        disabled={disabled}
        // 停用狀態（唯讀檢視）沒有值時不顯示 placeholder 提示文字，因使用者無法輸入，留空即可
        placeholder={disabled ? undefined : placeholder}
        className={`h-10 w-full rounded-lg border-[1.5px] bg-white px-3 text-base text-neutral-dark outline-none transition-colors placeholder:text-neutral-mid focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 disabled:cursor-not-allowed disabled:bg-surface-cream disabled:text-neutral-mid nav:text-sm ${
          aiFilled ? 'border-semantic-success bg-semantic-success/5 pl-8' : 'border-neutral-blue-gray/50'
        } ${className}`}
        {...rest}
      />
      {aiFilled && (
        <Zap
          aria-hidden="true"
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 fill-semantic-success text-semantic-success"
        />
      )}
    </div>
  );
}
