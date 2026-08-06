import type { LabelHTMLAttributes } from 'react';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** 是否為必填欄位，會在文字右側加上星號標示（見 DESIGN.md 必填標示規範） */
  required?: boolean;
}

/** 表單欄位共用 label，統一必填星號顯示邏輯。 */
export default function Label({ required, className = '', children, ...rest }: LabelProps) {
  return (
    <label className={`mb-1.5 block text-sm font-semibold text-neutral-dark ${className}`} {...rest}>
      {children}
      {required && (
        <span aria-hidden="true" className="ml-0.5 text-semantic-error">
          *
        </span>
      )}
    </label>
  );
}
