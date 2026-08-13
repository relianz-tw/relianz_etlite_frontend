'use client';

import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';
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

  const handleToggleSign = () => {
    if (value !== 0) {
      onChange?.(-value);
    } else {
      setZeroSign(prev => (prev === 1 ? -1 : 1));
    }
  };

  // 游標點入時全選現有數字（含預設值 0），避免點擊後直接輸入時遊標落在字元前方，
  // 導致新輸入的數字插入在既有數字之前而非取代（例如顯示 0 時輸入 800 變成 8000）
  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className={cn('flex items-center gap-1.5', widthClassName)}>
      {allowSign && (
        <button
          type="button"
          onClick={handleToggleSign}
          disabled={disabled || readOnly}
          aria-label="切換正負"
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-cream text-neutral-mid transition-colors',
            'hover:bg-surface-warm hover:text-neutral-dark',
            (disabled || readOnly) && 'cursor-not-allowed opacity-50 hover:bg-surface-cream hover:text-neutral-mid',
          )}
        >
          {sign === -1 ? <Minus size={14} /> : <Plus size={14} />}
        </button>
      )}
      <div
        className={cn(
          'flex h-10 min-w-0 flex-1 items-center gap-1 rounded-lg border-[1.5px] border-neutral-blue-gray/50 px-3 transition-colors',
          'focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/15',
          disabled ? 'bg-surface-cream' : 'bg-white',
          className,
        )}
      >
        <span className="shrink-0 text-sm text-neutral-mid">$</span>
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          readOnly={readOnly}
          value={Math.abs(value).toLocaleString('en-US')}
          onChange={handleChange}
          onFocus={handleFocus}
          className="w-full min-w-0 bg-transparent text-right text-base text-neutral-dark outline-none disabled:text-neutral-mid nav:text-sm"
        />
      </div>
    </div>
  );
}
