'use client';

import { cn } from '@/lib/utils';
import { Minus, Plus, Zap } from 'lucide-react';
import { useState, type ChangeEvent, type FocusEvent } from 'react';

interface MoneyInputProps {
  value: number;
  onChange?: (value: number) => void;
  widthClassName?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  /** 開啟後於輸入框左側顯示正負切換鈕，value 可為負數；不開啟時行為與原本完全一致 */
  allowSign?: boolean;
  /** allowSign 開啟時，value 為 0（尚未輸入）時切換鈕的預設方向；僅影響尚未輸入前的視覺與後續輸入的正負號 */
  negativeByDefault?: boolean;
  /** 由 AI／自動辨識帶入值且使用者尚未修改時為 true，顯示綠框＋閃電提示（見 DESIGN.md AI 填入欄位提示） */
  aiFilled?: boolean;
}

export default function MoneyInput({
  value,
  onChange,
  widthClassName = 'w-full',
  className = '',
  disabled,
  readOnly,
  allowSign,
  negativeByDefault,
  aiFilled,
}: MoneyInputProps) {
  // value 為 0 時正負號無法從數值本身判斷（0 與 -0 顯示相同），故另外保留一份「目前選定的正負號」，
  // 供使用者尚未輸入數字前先切換方向，之後輸入的數字即套用此方向
  const [zeroSign, setZeroSign] = useState<1 | -1>(negativeByDefault ? -1 : 1);
  const sign: 1 | -1 = value !== 0 ? (value < 0 ? -1 : 1) : zeroSign;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const num = digits === '' ? 0 : Number(digits);
    onChange?.(num === 0 ? 0 : sign * num);
  };

  const handleSetSign = (nextSign: 1 | -1) => {
    if (nextSign === sign) return;
    if (value !== 0) onChange?.(-value);
    else setZeroSign(nextSign);
  };

  // 游標點入時全選現有數字，方便直接輸入覆寫既有金額
  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // 尚未輸入（0）時輸入框留空、改以灰色 placeholder 顯示 0，
  // 避免使用者點入後得先刪掉既有的 0 才能輸入
  // 唯讀／停用欄位多為計算結果（如總金額、折讓總額），0 是有意義的結果值，仍以實色顯示
  const isEmptyZero = value === 0 && !disabled && !readOnly;
  const display = isEmptyZero ? '' : Math.abs(value).toLocaleString('en-US');

  return (
    <div className={cn('flex items-center gap-1.5', widthClassName)}>
      {allowSign && (
        <div
          className={cn(
            'flex h-7 shrink-0 items-center gap-0.5 rounded-md bg-surface-cream p-0.5',
            (disabled || readOnly) && 'cursor-not-allowed opacity-50',
          )}
        >
          <button
            type="button"
            onClick={() => handleSetSign(1)}
            disabled={disabled || readOnly}
            aria-label="設為正值"
            aria-pressed={sign === 1}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-[4px] transition-colors',
              sign === 1 ? 'bg-brand-blue text-white' : 'text-neutral-mid hover:bg-surface-warm hover:text-neutral-dark',
            )}
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={() => handleSetSign(-1)}
            disabled={disabled || readOnly}
            aria-label="設為負值"
            aria-pressed={sign === -1}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-[4px] transition-colors',
              sign === -1 ? 'bg-brand-blue text-white' : 'text-neutral-mid hover:bg-surface-warm hover:text-neutral-dark',
            )}
          >
            <Minus size={14} />
          </button>
        </div>
      )}
      <div
        className={cn(
          'flex h-10 min-w-0 flex-1 items-center gap-1 rounded-lg border-[1.5px] px-3 transition-colors',
          'focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/15',
          aiFilled ? 'border-semantic-success bg-semantic-success/5' : 'border-neutral-blue-gray/50',
          !aiFilled && (disabled ? 'bg-surface-cream' : 'bg-white'),
          className,
        )}
      >
        {aiFilled && <Zap aria-hidden="true" size={14} className="shrink-0 fill-semantic-success text-semantic-success" />}
        <span className="shrink-0 text-sm text-neutral-mid">$</span>
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          readOnly={readOnly}
          value={display}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="0"
          className="w-full min-w-0 bg-transparent text-right text-base text-neutral-dark outline-none placeholder:text-neutral-mid disabled:text-neutral-mid nav:text-sm"
        />
      </div>
    </div>
  );
}
