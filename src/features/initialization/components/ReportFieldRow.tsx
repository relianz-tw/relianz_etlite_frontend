import type { ReportField } from '../state/initializationReducer';
import type { ReportFieldDef } from '../reports/types';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import TextInput from '@/components/ui/TextInput';
import { cn, formatLocalDate } from '@/lib/utils';

const INDENT_CLASS: Record<0 | 1 | 2, string> = {
  0: '',
  1: 'pl-4',
  2: 'pl-8',
};

interface ReportFieldRowProps {
  field: ReportFieldDef;
  data: ReportField;
  onChange: (value: string | number) => void;
}

/**
 * 單一報表欄位列，回傳 Fragment（label、input 兩個 grid item），
 * 供 ReportColumn 的 grid-cols-[auto,1fr] 容器排列，讓同欄所有列的輸入框左側對齊。
 */
export function ReportFieldRow({ field, data, onChange }: ReportFieldRowProps) {
  return (
    <>
      <span className={cn('whitespace-nowrap text-sm text-neutral-dark', INDENT_CLASS[field.indent ?? 0], field.emphasize ? 'font-bold' : 'font-medium')}>
        {field.label}
      </span>
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
      {field.type === 'date' && (
        <DatePicker
          value={data.value ? new Date(data.value) : undefined}
          aiFilled={data.aiFilled}
          onChange={date => onChange(date ? formatLocalDate(date) : '')}
        />
      )}
    </>
  );
}
