'use client';

import type { ReportFieldDef, ReportTableDef } from '../reports/types';
import Label from '@/components/ui/Label';
import { FIELD_LABEL_BASE, fieldLabelClass } from './fieldLabel';
import { FieldInput } from './paper/FieldInput';
import { usePaperStore } from './paper/PaperStore';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface RowCardsProps {
  columns: ReportFieldDef[];
  addLabel: string;
}

/** 可重複列的卡片式明細：每列一張卡片，可新增／刪除，沒有資料留空即可（metadata 沒有表格定義、或列欄位對不上表頭時使用） */
export function RowCards({ columns, addLabel }: RowCardsProps) {
  const store = usePaperStore();
  const rows = store.rows;

  return (
    <div className='flex flex-col gap-4'>
      {rows.length === 0 && <p className='text-sm text-neutral-mid'>尚無資料，如有請點擊下方「{addLabel}」新增一列。</p>}

      {rows.map((row, index) => (
        <div key={index} className='relative rounded-lg border border-neutral-blue-gray/30 bg-white p-4'>
          <button
            type='button'
            onClick={() => store.removeRow(index)}
            aria-label='刪除此列'
            className='absolute right-3 top-3 rounded-full p-1 text-neutral-mid hover:bg-surface-cream hover:text-neutral-dark'
          >
            <X size={16} />
          </button>
          <div className='grid grid-cols-1 gap-4 pr-8 sm:grid-cols-2'>
            {columns.map(col => (
              <div key={col.key} className='flex min-w-0 flex-col gap-1.5 nav:flex-row nav:items-center nav:gap-3'>
                <Label className={cn(FIELD_LABEL_BASE, fieldLabelClass(col.label), '!mb-0 !font-medium')}>{col.label}</Label>
                <div className='min-w-0 flex-1'>
                  <FieldInput field={col} data={row[col.key] ?? { value: '', aiFilled: false }} onChange={value => store.setRowField(index, col.key, value)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type='button'
        onClick={() => store.addRow(columns)}
        className='flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-blue-gray/50 py-3 text-sm font-medium text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5'
      >
        <Plus size={16} />
        {addLabel}
      </button>
    </div>
  );
}

/** metadata 沒有 tables[] 對應的列欄位（舊格式）：沿用卡片式明細 */
export function ReportTable({ table }: { table: ReportTableDef }) {
  return <RowCards columns={table.columns} addLabel={table.addRowLabel} />;
}
