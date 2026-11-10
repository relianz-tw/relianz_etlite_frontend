import type { ReportField } from '../state/initializationReducer';
import type { ReportFieldDef } from '../reports/types';
import Checkbox from '@/components/ui/Checkbox';
import { FieldInput } from './paper/FieldInput';
import { FIELD_LABEL_BASE, fieldLabelClass } from './fieldLabel';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface ReportFieldRowProps {
  field: ReportFieldDef;
  data: ReportField;
  onChange: (value: string | number) => void;
}

/**
 * 單一報表欄位格：標籤與輸入同一行，由兩欄 grid 排列。
 * 布林（勾選）欄位改為勾選框在前、文字在後（比照「目前已開業」）；value 以 1／0 存放。
 */
export function ReportFieldRow({ field, data, onChange }: ReportFieldRowProps) {
  // Checkbox 元件本身不支援 aiFilled，AI 填入時比照 DESIGN.md「AI 填入欄位提示」在外層加綠框＋閃電
  if (field.type === 'boolean') {
    return (
      <label
        className={cn(
          'flex min-h-10 w-fit cursor-pointer items-center gap-2',
          data.aiFilled && 'rounded-lg border-[1.5px] border-semantic-success bg-semantic-success/5 px-2 py-1'
        )}
      >
        <span className='flex items-center gap-1.5'>
          {data.aiFilled && <Zap aria-hidden='true' size={14} className='shrink-0 fill-semantic-success text-semantic-success' />}
          <Checkbox checked={Number(data.value) === 1} onChange={() => onChange(Number(data.value) === 1 ? 0 : 1)} aria-label={field.label} />
        </span>
        <span className='text-sm text-neutral-dark'>{field.label}</span>
      </label>
    );
  }

  return (
    // 標籤與輸入框同一行；名稱太長時標籤換行、字級縮小一級
    <div className='flex min-w-0 items-center gap-3'>
      <span className={cn(FIELD_LABEL_BASE, fieldLabelClass(field.label))}>{field.label}</span>
      <div className='min-w-0 flex-1'>
        <FieldInput field={field} data={data} onChange={onChange} />
      </div>
    </div>
  );
}
