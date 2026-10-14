import type { ReportField } from '../state/initializationReducer';
import type { ReportFieldDef } from '../reports/types';
import Checkbox from '@/components/ui/Checkbox';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import TextInput from '@/components/ui/TextInput';
import { cn, formatLocalDate } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface ReportFieldRowProps {
  field: ReportFieldDef;
  data: ReportField;
  onChange: (value: string | number) => void;
}

/**
 * 單一報表欄位格：標籤在上、輸入在下，由 ReportSections 的兩欄 grid 排列。
 * 布林（勾選）欄位改為勾選框在前、文字在後（比照「目前已開業」）；value 以 1／0 存放。
 */
export function ReportFieldRow({ field, data, onChange }: ReportFieldRowProps) {
  // Checkbox 元件本身不支援 aiFilled，AI 填入時比照 DESIGN.md「AI 填入欄位提示」在外層加綠框＋閃電
  if (field.type === 'boolean') {
    // AI 填入時綠框把勾選框與文字一起框起來
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
    <div className='flex min-w-0 flex-col gap-1.5'>
      <span className='text-[13px] font-medium text-neutral-dark'>{field.label}</span>
      {field.type === 'money' && (
        <MoneyInput
          widthClassName='w-full'
          value={typeof data.value === 'number' ? data.value : Number(data.value) || 0}
          allowSign={field.allowSign}
          aiFilled={data.aiFilled}
          onChange={onChange}
        />
      )}
      {field.type === 'text' && (
        <TextInput
          widthClassName='w-full'
          value={typeof data.value === 'string' ? data.value : String(data.value)}
          aiFilled={data.aiFilled}
          onChange={e => onChange(e.target.value)}
        />
      )}
      {/* 小數欄位（如稅率、持股比例），MoneyInput 僅支援整數，故沿用 TextInput 並限制輸入格式 */}
      {field.type === 'decimal' && (
        <TextInput
          widthClassName='w-full'
          inputMode='decimal'
          value={typeof data.value === 'string' ? data.value : String(data.value)}
          aiFilled={data.aiFilled}
          onChange={e => onChange(e.target.value.replace(/[^\d.]/g, ''))}
        />
      )}
      {field.type === 'date' && (
        <DatePicker value={data.value ? new Date(data.value) : undefined} aiFilled={data.aiFilled} onChange={date => onChange(date ? formatLocalDate(date) : '')} />
      )}
    </div>
  );
}
