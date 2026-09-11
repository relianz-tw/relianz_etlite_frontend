import Label from '@/components/ui/Label';
import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  required?: boolean;
  /** 顯示在 label 右側的標記（如尚未串接真實資料的 Badge） */
  badge?: ReactNode;
  helper?: string;
  className?: string;
  children: ReactNode;
}

/** 表單欄位的共用 label + helper 直式包裝（label 在上、輸入框在下），供各類扣繳中心表單共用 */
export default function Field({ label, required, badge, helper, className = '', children }: FieldProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1.5">
        <Label required={required}>{label}</Label>
        {badge}
      </div>
      {children}
      {helper && <p className="mt-1 text-xs leading-relaxed text-neutral-mid">{helper}</p>}
    </div>
  );
}
