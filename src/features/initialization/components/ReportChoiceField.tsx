'use client';

import { useInitialization } from '../state/InitializationContext';
import type { ReportKey } from '../state/initializationReducer';
import type { ReportFieldDef } from '../reports/types';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import { FIELD_LABEL_BASE, fieldLabelClass } from './fieldLabel';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

/** 選項超過此數量改用下拉選單，否則用 tab 式切換 */
const MAX_TAB_OPTIONS = 3;

interface ReportChoiceFieldProps {
  reportId: ReportKey;
  /** 區塊標題，作為這一組單選的 label */
  title: string;
  /** 同一組的布林欄位，視為多選一 */
  fields: ReportFieldDef[];
}

/**
 * 同一區塊內的布林欄位合併成「多選一」：選項 ≤3 用 tab、>3 用下拉。
 * 資料仍以各欄位 1／0 存放（與辨識結果、下游送出格式一致），選取某項時同組其他項自動歸 0。
 * 與一般欄位同為「標籤與控制項同一行」的欄位格，由 ReportSections 的兩欄 grid 排列。
 */
export function ReportChoiceField({ reportId, title, fields }: ReportChoiceFieldProps) {
  const { state, dispatch } = useInitialization();
  const data = state.reports[reportId]?.fields ?? {};

  const selected = fields.find(f => Number(data[f.key]?.value) === 1);
  const aiFilled = selected ? data[selected.key]?.aiFilled : false;

  const handleSelect = (key: string) => {
    // 再點一次已選項＝清除選擇，讓手動輸入的使用者可以撤回
    const next = key === selected?.key ? '' : key;
    for (const f of fields) {
      const shouldBeOn = f.key === next;
      const isOn = Number(data[f.key]?.value) === 1;
      if (shouldBeOn !== isOn) dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId, key: f.key, value: shouldBeOn ? 1 : 0 } });
    }
  };

  const options = fields.map(f => ({ value: f.key, label: f.label }));

  // 選項文字較長時，tab 內文字縮小並可換行
  const hasLongOption = options.some(o => o.label.length > 10);

  // tab 的選項文字很長時（如簽證別），改佔滿整列，標籤縮窄讓 tab 有足夠寬度
  const isWide = fields.length <= MAX_TAB_OPTIONS && options.reduce((sum, o) => sum + o.label.length, 0) > 14;

  return (
    <div className={cn('flex min-w-0 items-center gap-3', isWide && 'md:col-span-2')}>
      <span className={cn(FIELD_LABEL_BASE, fieldLabelClass(title), isWide && 'md:w-[19%]')}>{title}</span>
      <div className='min-w-0 flex-1'>
      {fields.length > MAX_TAB_OPTIONS ? (
        <Select widthClassName='w-full' value={selected?.key ?? ''} aiFilled={aiFilled} onValueChange={v => (v ? v !== selected?.key && handleSelect(v) : selected && handleSelect(selected.key))}>
          {/* 選定後「請選擇」改為「（無）」，選它即清除選擇 */}
          <option value=''>{selected ? '（無）' : '請選擇'}</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ) : (
        // SegmentedControl 本身不支援 aiFilled，比照 ReportFieldRow boolean 在外層加綠框＋閃電
        <div
          className={cn(
            'flex w-full items-center gap-1.5 rounded-lg border-[1.5px]',
            aiFilled ? 'border-semantic-success bg-semantic-success/5 pl-2' : 'border-transparent'
          )}
        >
          {aiFilled && <Zap aria-hidden='true' size={14} className='shrink-0 fill-semantic-success text-semantic-success' />}
          <SegmentedControl className='flex-1' fontWeightClassName='font-medium' wrapOptions={hasLongOption} options={options} value={selected?.key ?? ''} onChange={handleSelect} />
        </div>
      )}
      </div>
    </div>
  );
}
