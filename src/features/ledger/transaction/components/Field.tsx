import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  helper?: string;
  className?: string;
  children: ReactNode;
}

/** 表單欄位的共用 label + helper 包裝，僅供 transaction feature 內部使用 */
export default function Field({ label, helper, className = '', children }: FieldProps) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">{label}</label>
      {children}
      {helper && <p className="mt-1 text-xs leading-relaxed text-neutral-mid">{helper}</p>}
    </div>
  );
}
