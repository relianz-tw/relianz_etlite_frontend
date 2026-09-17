import Label from '@/components/ui/Label';
import TextInput from '@/components/ui/TextInput';
import type { InputHTMLAttributes } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  /** 前綴文字，例如 "$" */
  prefix?: string;
  /** 由 AI／自動辨識帶入值且使用者尚未修改時為 true，顯示綠框＋閃電提示（見 DESIGN.md AI 填入欄位提示） */
  aiFilled?: boolean;
  widthClassName?: string;
}

/**
 * 包裝 etlite 既有 Label + TextInput，補上 label / required / error / errorMessage / prefix API，
 * 讓從姊妹專案（cashflow）移植過來的 onboarding 表單維持原本 1:1 版面，不需逐一改寫
 */
export default function Field({
  label,
  required,
  error,
  errorMessage,
  prefix,
  aiFilled,
  className = '',
  ...rest
}: FieldProps) {
  // prefix（如 "$"）與 aiFilled 的閃電圖示都固定畫在左側 left-3，兩者同時出現時位置會重疊。
  // 折衷做法：兩者併存時不把 aiFilled 交給 TextInput（避免它畫閃電圖示與 pl-8），
  // 改由外層手動補上綠框＋淡綠底色，保留「AI 帶入」的顏色語意，僅省略圖示。
  const hasPrefixAndAi = !!prefix && !!aiFilled;
  return (
    <div className='flex flex-col flex-1'>
      {label && (
        <Label required={required} className='mb-2'>
          {label}
        </Label>
      )}
      <div className='relative'>
        {prefix && (
          <span className='pointer-events-none select-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-mid'>
            {prefix}
          </span>
        )}
        <TextInput
          aiFilled={hasPrefixAndAi ? false : aiFilled}
          className={`${prefix ? 'pl-7' : ''} ${hasPrefixAndAi ? '!border-semantic-success !bg-semantic-success/5' : ''} ${error ? '!border-semantic-error' : ''} ${className}`}
          {...rest}
        />
      </div>
      {error && errorMessage && (
        <p className='pt-1 text-xs text-semantic-error'>{errorMessage}</p>
      )}
    </div>
  );
}
