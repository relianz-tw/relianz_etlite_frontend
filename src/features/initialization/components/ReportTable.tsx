import { useInitialization } from '../state/InitializationContext';
import type { SettlementReportId } from '../state/initializationReducer';
import type { ReportTableDef } from '../reports/types';
import DatePicker from '@/components/ui/DatePicker';
import Label from '@/components/ui/Label';
import MoneyInput from '@/components/ui/MoneyInput';
import TextInput from '@/components/ui/TextInput';
import { formatLocalDate } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface ReportTableProps {
  reportId: SettlementReportId;
  table: ReportTableDef;
}

/** 表格型報表（投資人明細、財產目錄）：逐列卡片呈現，可新增／刪除列，沒有資料留空即可 */
export function ReportTable({ reportId, table }: ReportTableProps) {
  const { state, dispatch } = useInitialization();
  const rows = state.reports[reportId].rows;

  return (
    <div className='flex flex-col gap-4'>
      {rows.length === 0 && <p className='text-sm text-neutral-mid'>尚無資料，如有請點擊下方「{table.addRowLabel}」新增一列。</p>}

      {rows.map((row, index) => (
        <div key={index} className='relative rounded-lg border border-neutral-blue-gray/30 bg-white p-4'>
          <button
            type='button'
            onClick={() => dispatch({ type: 'REMOVE_REPORT_ROW', payload: { reportId, index } })}
            aria-label='刪除此列'
            className='absolute right-3 top-3 rounded-full p-1 text-neutral-mid hover:bg-surface-cream hover:text-neutral-dark'
          >
            <X size={16} />
          </button>
          <div className='grid grid-cols-1 gap-4 pr-8 sm:grid-cols-2'>
            {table.columns.map(col => {
              const data = row[col.key] ?? { value: '', aiFilled: false };
              return (
                <div key={col.key} className='flex flex-col'>
                  <Label className='mb-1.5'>{col.label}</Label>
                  {col.type === 'money' && (
                    <MoneyInput
                      value={typeof data.value === 'number' ? data.value : Number(data.value) || 0}
                      allowSign={col.allowSign}
                      aiFilled={data.aiFilled}
                      onChange={value => dispatch({ type: 'SET_REPORT_ROW_FIELD', payload: { reportId, index, key: col.key, value } })}
                    />
                  )}
                  {col.type === 'text' && (
                    <TextInput
                      value={typeof data.value === 'string' ? data.value : String(data.value)}
                      aiFilled={data.aiFilled}
                      onChange={e => dispatch({ type: 'SET_REPORT_ROW_FIELD', payload: { reportId, index, key: col.key, value: e.target.value } })}
                    />
                  )}
                  {col.type === 'date' && (
                    <DatePicker
                      value={data.value ? new Date(data.value) : undefined}
                      aiFilled={data.aiFilled}
                      onChange={date =>
                        dispatch({ type: 'SET_REPORT_ROW_FIELD', payload: { reportId, index, key: col.key, value: date ? formatLocalDate(date) : '' } })
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button
        type='button'
        onClick={() => dispatch({ type: 'ADD_REPORT_ROW', payload: { reportId, columns: table.columns } })}
        className='flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-blue-gray/50 py-3 text-sm font-medium text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5'
      >
        <Plus size={16} />
        {table.addRowLabel}
      </button>
    </div>
  );
}
