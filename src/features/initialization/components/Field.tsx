import Label from '@/components/ui/Label';
import TextInput from '@/components/ui/TextInput';
import type { InputHTMLAttributes } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  /** 由 AI／自動辨識帶入值且使用者尚未修改時為 true，顯示綠框＋閃電提示（見 DESIGN.md AI 填入欄位提示） */
  aiFilled?: boolean;
  widthClassName?: string;
}

/**
 * 包裝既有 Label + TextInput，補上 label / required / error / errorMessage 等 API。
 * 與 features/onboarding/components/Field.tsx 為同一套用法的獨立副本（各 feature 自成模組，避免跨層依賴）。
 */
export default function Field({ label, required, error, errorMessage, aiFilled, className = '', ...rest }: FieldProps) {
  return (
    <div className='flex flex-col flex-1'>
      {label && (
        <Label required={required} className='mb-2'>
          {label}
        </Label>
      )}
      <TextInput aiFilled={aiFilled} className={`${error ? '!border-semantic-error' : ''} ${className}`} {...rest} />
      {error && errorMessage && <p className='pt-1 text-xs text-semantic-error'>{errorMessage}</p>}
    </div>
  );
}
