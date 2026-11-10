'use client';

import Checkbox from '@/components/ui/Checkbox';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import TextInput from '@/components/ui/TextInput';
import { cn, formatLocalDate } from '@/lib/utils';
import type { ReportField } from '../../state/initializationReducer';
import type { ReportFieldDef } from '../../reports/types';
import { usePaperStore, type PaperStore } from './PaperStore';

interface FieldInputProps {
  field: ReportFieldDef;
  data: ReportField;
  onChange: (value: string | number) => void;
  /** 強制唯讀（預設：帶 formula 的算式欄位唯讀，由後端計算） */
  readOnly?: boolean;
}

/** 百分比輸入：只留數字、小數點與開頭的負號 */
function sanitizePercent(raw: string): string {
  const negative = raw.trim().startsWith('-');
  const body = raw.replace(/[^\d.]/g, '');
  return negative ? `-${body}` : body;
}

/** 單一欄位的輸入元件（依 type 選元件），標籤由呼叫端負責 */
export function FieldInput({ field, data, onChange, readOnly }: FieldInputProps) {
  // 帶 formula 的欄位由後端算出，前端唯讀；還沒有值（辨識沒帶、尚未送出）顯示「—」而不是 0，避免誤以為算出來是 0
  if (readOnly ?? !!field.formulaText) {
    const empty = data.value === '' || data.value === undefined;
    const text = empty ? '—' : field.type === 'money' ? Number(data.value).toLocaleString('en-US') : String(data.value);
    return (
      <div
        className={cn(
          'flex h-10 w-full items-center rounded-lg border-[1.5px] border-neutral-blue-gray/30 bg-surface-cream px-3 text-sm tabular-nums text-neutral-dark nav:text-sm',
          field.type === 'text' ? 'justify-start' : 'justify-end'
        )}
      >
        {text}
      </div>
    );
  }

  switch (field.type) {
    case 'money':
      return <MoneyInput widthClassName='w-full' value={typeof data.value === 'number' ? data.value : Number(data.value) || 0} allowSign={field.allowSign} aiFilled={data.aiFilled} onChange={onChange} />;
    case 'integer':
      return (
        <TextInput
          widthClassName='w-full'
          inputMode='numeric'
          value={data.value === '' ? '' : String(data.value)}
          aiFilled={data.aiFilled}
          onChange={e => {
            const digits = e.target.value.replace(/\D/g, '');
            onChange(digits === '' ? '' : Number(digits));
          }}
        />
      );
    case 'decimal':
      return (
        <TextInput widthClassName='w-full' inputMode='decimal' value={String(data.value)} aiFilled={data.aiFilled} onChange={e => onChange(e.target.value.replace(/[^\d.]/g, ''))} />
      );
    case 'percent':
      return (
        <div className='relative w-full'>
          <TextInput widthClassName='w-full' className='pr-8 text-right' inputMode='decimal' value={String(data.value)} aiFilled={data.aiFilled} onChange={e => onChange(sanitizePercent(e.target.value))} />
          <span aria-hidden='true' className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-mid'>
            %
          </span>
        </div>
      );
    case 'date':
      return <DatePicker value={data.value ? new Date(data.value) : undefined} aiFilled={data.aiFilled} keepInputFocus onChange={date => onChange(date ? formatLocalDate(date) : '')} />;
    case 'boolean':
      return <Checkbox checked={Number(data.value) === 1} onChange={() => onChange(Number(data.value) === 1 ? 0 : 1)} aria-label={field.label} />;
    default:
      return <TextInput widthClassName='w-full' value={typeof data.value === 'string' ? data.value : String(data.value)} aiFilled={data.aiFilled} onChange={e => onChange(e.target.value)} />;
  }
}

/** 綁定 store 的欄位輸入：對帳模式改畫 renderValue 的結果 */
export function StoreFieldInput({ field }: { field: ReportFieldDef }) {
  const store = usePaperStore();
  return <StoreFieldInputWith field={field} store={store} />;
}

function StoreFieldInputWith({ field, store }: { field: ReportFieldDef; store: PaperStore }) {
  if (store.renderValue) return <>{store.renderValue(field)}</>;
  return <FieldInput field={field} data={store.get(field.key)} onChange={value => store.set(field.key, value)} />;
}
