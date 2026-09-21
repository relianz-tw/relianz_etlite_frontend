import { ReportFieldRow } from './ReportFieldRow';
import { useInitialization } from '../state/InitializationContext';
import type { SettlementReportId } from '../state/initializationReducer';
import type { ReportColumnDef } from '../reports/types';
import { Fragment } from 'react';

interface ReportColumnProps {
  reportId: SettlementReportId;
  column: ReportColumnDef;
  /** 'right' 時讀寫 state.reports[reportId].fieldsRight（見 mirrorRight 報表，如資產負債表右欄） */
  side?: 'left' | 'right';
}

/**
 * 報表雙欄版面單一欄的內容，依 sections 分組渲染欄位列（步驟 3 封面頁、步驟 4 報表頁共用）。
 * 整欄用同一個 grid-cols-[auto,1fr] 容器（label 欄寬度取全欄最長標籤），
 * 讓每一列輸入框左側對齊，不因標籤長短不一而參差；section 標題橫跨兩欄。
 */
export function ReportColumn({ reportId, column, side = 'left' }: ReportColumnProps) {
  const { state, dispatch } = useInitialization();
  const fields = side === 'right' ? state.reports[reportId].fieldsRight : state.reports[reportId].fields;

  return (
    <div className='grid grid-cols-[auto,1fr] items-center gap-x-4 gap-y-3'>
      {column.sections.map((section, index) => (
        <Fragment key={section.title}>
          <h3 className={`col-span-2 text-sm font-semibold text-neutral-dark ${index > 0 ? 'mt-3' : ''}`}>{section.title}</h3>
          {section.fields.map(field => (
            <ReportFieldRow
              key={field.key}
              field={field}
              data={fields[field.key] ?? { value: '', aiFilled: false }}
              onChange={value => dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId, key: field.key, value, side } })}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
}
