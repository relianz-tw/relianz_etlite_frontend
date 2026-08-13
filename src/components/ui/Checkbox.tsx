'use client';

import { Check, Minus } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  shape?: 'square' | 'circle';
  /** 部分選取狀態（例如表頭全選：僅部分列被勾選時顯示） */
  indeterminate?: boolean;
  'aria-label'?: string;
}

export default function Checkbox({ checked, onChange, disabled, shape = 'square', indeterminate, ...rest }: CheckboxProps) {
  const active = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      disabled={disabled}
      onClick={e => {
        // 阻止冒泡：部分呼叫端（如沖帳中心交易列）會在外層容器也綁同一個切換勾選的 onClick，
        // 若不擋掉會讓點在勾選框正中心時觸發兩次切換、視覺上等於沒反應
        e.stopPropagation();
        onChange();
      }}
      className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
        shape === 'circle' ? 'rounded-full' : 'rounded-sm'
      } ${active ? 'border-brand-blue bg-brand-blue' : 'border-neutral-blue-gray bg-white'} ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
      {...rest}
    >
      {checked && <Check size={13} strokeWidth={3} className="text-white" />}
      {!checked && indeterminate && <Minus size={13} strokeWidth={3} className="text-white" />}
    </button>
  );
}
