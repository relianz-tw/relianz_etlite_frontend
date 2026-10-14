import { ReportChoiceField } from './ReportChoiceField';
import { ReportFieldRow } from './ReportFieldRow';
import { useInitialization } from '../state/InitializationContext';
import SectionCard from '@/components/ui/SectionCard';
import type { SettlementReportId } from '../state/initializationReducer';
import type { ReportFieldDef, ReportSectionDef } from '../reports/types';

interface ReportSectionsProps {
  reportId: SettlementReportId;
  sections: ReportSectionDef[];
}

/**
 * 報表固定欄位：每個區塊一張卡片，區塊內為兩欄（手機單欄）的「標籤在上、輸入在下」欄位格，
 * 多選一的選擇欄位排在一般欄位之前（步驟 3 封面頁、步驟 4 報表頁共用）。
 */
export function ReportSections({ reportId, sections }: ReportSectionsProps) {
  const { state, dispatch } = useInitialization();
  const fields = state.reports[reportId].fields;

  const isInputField = (field: ReportFieldDef) => field.type !== 'boolean';
  const renderField = (field: ReportFieldDef) => (
    <ReportFieldRow
      key={field.key}
      field={field}
      data={fields[field.key] ?? { value: '', aiFilled: false }}
      onChange={value => dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId, key: field.key, value } })}
    />
  );

  return (
    <>
      {sections
        .filter(section => section.fields.length > 0 || (section.choices?.length ?? 0) > 0)
        .map(section => (
          <SectionCard key={section.key ?? section.title} title={section.title || undefined}>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6'>
              {section.choices?.map(choice => (
                <ReportChoiceField key={choice.groupCode} reportId={reportId} title={choice.title} fields={choice.fields} />
              ))}
              {section.fields.filter(isInputField).map(renderField)}
            </div>
            {/* 單獨勾選的欄位統一排在區塊最下方一列，不佔用兩欄格線 */}
            {section.fields.some(f => !isInputField(f)) && (
              <div className='flex flex-wrap gap-x-8 gap-y-2'>{section.fields.filter(f => !isInputField(f)).map(renderField)}</div>
            )}
          </SectionCard>
        ))}
    </>
  );
}
