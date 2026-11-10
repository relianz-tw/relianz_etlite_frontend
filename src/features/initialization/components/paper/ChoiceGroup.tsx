'use client';

import Checkbox from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import type { ReportChoiceDef } from '../../reports/types';
import { CodeChip } from './CodeChip';
import { usePaperStore } from './PaperStore';

interface ChoiceGroupProps {
  choice: ReportChoiceDef;
  /** 嵌在模板文字裡：不畫題目，只畫並排勾選框 */
  inline?: boolean;
}

/**
 * 勾選框群組（metadata choiceGroups）：成員並排畫成勾選框，maxSelect=1 時互斥、再點已選項視為清除。
 * 資料仍以各欄位 1／0 存放（與辨識結果、送出格式一致）。
 */
export function ChoiceGroup({ choice, inline }: ChoiceGroupProps) {
  const store = usePaperStore();
  const isOn = (key: string) => Number(store.get(key).value) === 1;

  const toggle = (key: string) => {
    const next = !isOn(key);
    if (next && choice.maxSelect === 1) {
      for (const f of choice.fields) if (f.key !== key && isOn(f.key)) store.set(f.key, 0);
    }
    store.set(key, next ? 1 : 0);
  };

  const options = (
    <div
      className={cn(!choice.columns && 'flex flex-wrap gap-x-8 gap-y-2', inline && 'inline-flex align-middle')}
      style={choice.columns ? { display: 'grid', gridTemplateColumns: `repeat(${choice.columns}, minmax(0, 1fr))`, columnGap: 32, rowGap: 8 } : undefined}
    >
      {choice.fields.map(f => {
        const data = store.get(f.key);
        return (
          <label
            key={f.key}
            className={cn('flex min-h-8 w-fit cursor-pointer items-center gap-2', data.aiFilled && 'rounded-lg border-[1.5px] border-semantic-success bg-semantic-success/5 px-2')}
          >
            {data.aiFilled && <Zap aria-hidden='true' size={14} className='shrink-0 fill-semantic-success text-semantic-success' />}
            <Checkbox checked={isOn(f.key)} onChange={() => toggle(f.key)} aria-label={f.label} />
            <span className='text-sm text-neutral-dark'>{f.label}</span>
          </label>
        );
      })}
    </div>
  );

  if (inline) return options;

  return (
    <div className='flex min-w-0 flex-col gap-2'>
      <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
        {choice.officialCode && <CodeChip official={choice.officialCode} />}
        <span className='text-sm font-medium text-neutral-dark'>{choice.title}</span>
        {choice.note && <span className='text-[13px] text-neutral-mid'>{choice.note}</span>}
      </div>
      {options}
    </div>
  );
}
