import Label from '@/components/ui/Label';
import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  required?: boolean;
  helper?: string;
  className?: string;
  children: ReactNode;
}

/** 表單欄位的共用 label + helper 直式包裝（label 在上、輸入框在下），供各類扣繳中心表單共用 */
export default function Field({ label, required, helper, className = '', children }: FieldProps) {
  return (
    <div className={className}>
      <Label required={required}>{label}</Label>
      {children}
      {helper && <p className="mt-1 text-xs leading-relaxed text-neutral-mid">{helper}</p>}
    </div>
  );
}
