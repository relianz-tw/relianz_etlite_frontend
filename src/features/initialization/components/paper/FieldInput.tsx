'use client';

import Checkbox from '@/components/ui/Checkbox';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import TextInput from '@/components/ui/TextInput';
import { cn, formatLocalDate } from '@/lib/utils';
import type { ReportField } from '../../state/initializationReducer';
import type { ReportFieldDef } from '../../reports/types';
import { computeFieldValue } from '../../reports/formula';
import { getFieldWarning } from '../../reports/fieldValidators';
import { FieldWarning } from './FieldWarning';
import { useState } from 'react';
import { usePaperStore, type PaperStore } from './PaperStore';

interface FieldInputProps {
  field: ReportFieldDef;
  data: ReportField;
  onChange: (value: string | number) => void;
  /** 強制唯讀 */
  readOnly?: boolean;
  /** 算式欄位的前端試算值：欄位沒有值時顯示它（不存進欄位），有值以欄位值為主 */
  autoValue?: number | null;
  /** 文字欄位的提示字（沒有標籤可看時用，如分組標題列裡的類別編號、類別名稱） */
  placeholder?: string;
}

/** 百分比輸入：只留數字、小數點與開頭的負號 */
function sanitizePercent(raw: string): string {
  const negative = raw.trim().startsWith('-');
  const body = raw.replace(/[^\d.]/g, '');
  return negative ? `-${body}` : body;
}

/** 單一欄位的輸入元件（依 type 選元件），標籤由呼叫端負責 */
export function FieldInput({ field, data: stored, onChange, readOnly, autoValue, placeholder }: FieldInputProps) {
  // 算式欄位可編輯：有值（辨識帶入或使用者輸入）以該值為主，沒有值才顯示試算結果
  const data = stored.value === '' && autoValue != null ? { ...stored, value: autoValue } : stored;
  if (readOnly) {
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
      return <MoneyInput widthClassName='w-full' value={typeof data.value === 'number' ? data.value : Number(data.value) || 0} allowSign={field.allowSign} typedSign aiFilled={data.aiFilled} onChange={onChange} />;
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
      return <TextFieldWithWarning field={field} data={data} placeholder={placeholder} onChange={onChange} />;
  }
}

/**
 * 文字欄位：統編、身分證等有格式規則的欄位，離開欄位後（或辨識帶入時）在下方顯示提醒，不擋下一頁。
 * 獨立成元件是因為需要 useState，而 FieldInput 在 readOnly 時會提早 return，不能在它裡面放 hook。
 */
function TextFieldWithWarning({ field, data, placeholder, onChange }: { field: ReportFieldDef; data: ReportField; placeholder?: string; onChange: (value: string | number) => void }) {
  const [touched, setTouched] = useState(false);
  const warning = touched || data.aiFilled ? getFieldWarning(field.key, data.value) : null;
  return (
    <div className='flex w-full min-w-0 flex-col gap-1'>
      <TextInput
        widthClassName='w-full'
        placeholder={placeholder}
        value={typeof data.value === 'string' ? data.value : String(data.value)}
        aiFilled={data.aiFilled}
        aria-invalid={warning ? true : undefined}
        onBlur={() => setTouched(true)}
        onChange={e => onChange(e.target.value)}
      />
      {warning && <FieldWarning message={warning} />}
    </div>
  );
}

/** 綁定 store 的欄位輸入：對帳模式改畫 renderValue 的結果 */
export function StoreFieldInput({ field }: { field: ReportFieldDef }) {
  const store = usePaperStore();
  return <StoreFieldInputWith field={field} store={store} />;
}

function StoreFieldInputWith({ field, store }: { field: ReportFieldDef; store: PaperStore }) {
  if (store.renderValue) return <>{store.renderValue(field)}</>;
  const autoValue = field.formulaExpr ? computeFieldValue(field, Object.values(store.page.fieldMap), key => store.get(key).value, store.rows) : null;
  return <FieldInput field={field} data={store.get(field.key)} autoValue={autoValue} readOnly={store.readOnlyKeys?.includes(field.key)} onChange={value => store.set(field.key, value)} />;
}
