import type { ReportField } from '../state/initializationReducer';
import type { ReportFieldDef } from '../reports/types';
import Checkbox from '@/components/ui/Checkbox';
import { FieldInput } from './paper/FieldInput';
import { FIELD_LABEL_BASE, fieldLabelClass } from './fieldLabel';
import { cn } from '@/lib/utils';

interface ReportFieldRowProps {
  field: ReportFieldDef;
  data: ReportField;
  onChange: (value: string | number) => void;
  /** 畫成唯讀（如自動填入、或以登記事項表為準而鎖住的公司識別欄位） */
  readOnly?: boolean;
}

/**
 * 單一報表欄位格：標籤與輸入同一行，由兩欄 grid 排列。
 * 布林（勾選）欄位改為勾選框在前、文字在後（比照「目前已開業」）；value 以 1／0 存放。
 */
export function ReportFieldRow({ field, data, onChange, readOnly }: ReportFieldRowProps) {
  if (field.type === 'boolean') {
    return (
      <label className='flex min-h-10 w-fit cursor-pointer items-center gap-2'>
        <Checkbox checked={Number(data.value) === 1} onChange={() => !readOnly && onChange(Number(data.value) === 1 ? 0 : 1)} aria-label={field.label} />
        <span className='text-sm text-neutral-dark'>{field.label}</span>
      </label>
    );
  }

  return (
    // 桌機標籤與輸入框同一行、手機標籤在上輸入框在下；名稱太長時字級縮小一級
    <div className='flex min-w-0 flex-col gap-1.5 nav:flex-row nav:items-center nav:gap-3'>
      <span className={cn(FIELD_LABEL_BASE, fieldLabelClass(field.label))}>{field.label}</span>
      <div className='min-w-0 flex-1'>
        <FieldInput field={field} data={data} onChange={onChange} readOnly={readOnly} />
      </div>
    </div>
  );
}
