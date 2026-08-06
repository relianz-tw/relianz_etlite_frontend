import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  /** 是否為必填欄位，會在 label 右側加上星號標示（見 DESIGN.md 必填標示規範） */
  required?: boolean;
  /** 顯示在 label 右側的標記（如尚未串接真實資料的 Badge） */
  badge?: ReactNode;
  helper?: string;
  className?: string;
  children: ReactNode;
}

/** 表單欄位的共用 label + helper 包裝，僅供 transaction feature 內部使用。
 *  手機 label 在上、輸入框在下；桌機（nav:）改為 label 與輸入框同排，一排一個欄位。 */
export default function Field({ label, required, badge, helper, className = '', children }: FieldProps) {
  return (
    <div className={`nav:flex nav:items-start nav:gap-4 ${className}`}>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-neutral-dark nav:mb-0 nav:w-32 nav:shrink-0 nav:pt-2.5">
        {label}
        {required && (
          <span aria-hidden="true" className="text-semantic-error">
            *
          </span>
        )}
        {badge}
      </label>
      <div className="nav:flex-1">
        {children}
        {helper && <p className="mt-1 text-xs leading-relaxed text-neutral-mid">{helper}</p>}
      </div>
    </div>
  );
}
