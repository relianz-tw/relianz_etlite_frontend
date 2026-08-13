'use client';

import type { InputHTMLAttributes } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  widthClassName?: string;
}

export default function TextInput({ widthClassName = 'w-full', className = '', disabled, placeholder, ...rest }: TextInputProps) {
  return (
    <input
      disabled={disabled}
      // 停用狀態（唯讀檢視）沒有值時不顯示 placeholder 提示文字，因使用者無法輸入，留空即可
      placeholder={disabled ? undefined : placeholder}
      className={`h-10 ${widthClassName} rounded-lg border-[1.5px] border-neutral-blue-gray/50 bg-white px-3 text-base text-neutral-dark outline-none transition-colors placeholder:text-neutral-mid focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 disabled:cursor-not-allowed disabled:bg-surface-cream disabled:text-neutral-mid nav:text-sm ${className}`}
      {...rest}
    />
  );
}
