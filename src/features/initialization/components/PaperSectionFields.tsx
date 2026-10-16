'use client';

import type { ReactNode } from 'react';
import { useInitialization } from '../state/InitializationContext';
import { ReportChoiceField } from './ReportChoiceField';
import { ReportFieldRow } from './ReportFieldRow';
import type { ReportKey } from '../state/initializationReducer';
import type { ReportFieldDef, ReportSectionDef } from '../reports/types';

interface PaperSectionFieldsProps {
  reportId: ReportKey;
  section: ReportSectionDef;
  /** 哪些欄位由呼叫端逐列呈現（金額、小數），其餘（文字、日期、勾選、多選一）在這裡排版 */
  isRowField: (field: ReportFieldDef) => boolean;
  /** 逐列區，夾在輸入欄位格與底部勾選之間 */
  children?: ReactNode;
}

/**
 * 紙本對照版型區塊裡「不是逐列金額」的欄位：多選一與文字／日期排兩欄格線，單獨勾選排在最下方一列。
 * 逐列金額由呼叫端以 children 傳入（損益表 PaperFormView、營業稅 VatFormView 共用）。
 */
export function PaperSectionFields({ reportId, section, isRowField, children }: PaperSectionFieldsProps) {
  const { state, dispatch } = useInitialization();
  const data = state.reports[reportId]?.fields ?? {};
  const fieldData = (key: string) => data[key] ?? { value: '', aiFilled: false };
  const setField = (key: string, value: string | number) => dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId, key, value } });

  const others = section.fields.filter(f => !isRowField(f));
  const inputFields = others.filter(f => f.type !== 'boolean');
  const checkFields = others.filter(f => f.type === 'boolean');
  const hasGrid = (section.choices?.length ?? 0) > 0 || inputFields.length > 0;

  return (
    <>
      {hasGrid && (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6'>
          {section.choices?.map(choice => (
            <ReportChoiceField key={choice.groupCode} reportId={reportId} title={choice.title} fields={choice.fields} />
          ))}
          {inputFields.map(field => (
            <ReportFieldRow key={field.key} field={field} data={fieldData(field.key)} onChange={value => setField(field.key, value)} />
          ))}
        </div>
      )}
      {children}
      {checkFields.length > 0 && (
        <div className='flex flex-wrap gap-x-8 gap-y-2'>
          {checkFields.map(field => (
            <ReportFieldRow key={field.key} field={field} data={fieldData(field.key)} onChange={value => setField(field.key, value)} />
          ))}
        </div>
      )}
    </>
  );
}
