'use client';

import { useState } from 'react';
import { useInitialization } from '../state/InitializationContext';
import { SECTION_TITLES } from '../reports/sectionTitles';
import { PaperSectionFields } from './PaperSectionFields';
import { ReportAmountInput } from './ReportAmountInput';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import type { ReportKey, SettlementReportId } from '../state/initializationReducer';
import type { ReportFieldDef, ReportSectionDef } from '../reports/types';

/** 區塊欄位超過此數量，且已有辨識帶入的值時，沒有值的金額欄位預設收合 */
const COLLAPSE_THRESHOLD = 12;

/** 帳載／調整後成對欄位的後綴（損益表 INC_nn_BOOK／INC_nn_ADJ） */
const BOOK_SUFFIX = '_BOOK';
const ADJ_SUFFIX = '_ADJ';
/** 成對欄位的名稱後綴（如「營業收入總額－帳載結算金額」），成對列由欄標題表示，標籤去掉它 */
const PAIR_LABEL_SUFFIX = /[－-](帳載結算金額|自行依法調整後金額)$/;

interface PaperFormViewProps {
  reportId: ReportKey;
  formCode: SettlementReportId;
  sections: ReportSectionDef[];
}

/**
 * 紙本對照版型（營所稅各表共用）：每個區塊一張卡片，金額欄位為「運算符號｜代號 chip｜標籤｜金額」逐列呈現，
 * 小計列淡藍底粗體、扣除項前加「−」，與紙本逐欄比對。版面完全依 metadata 欄位屬性（isSubtotal、isDeduction）。
 * 小計與合計由辨識帶入或使用者輸入，前端不自行加總。
 */
export function PaperFormView({ reportId, formCode, sections }: PaperFormViewProps) {
  const { state, dispatch } = useInitialization();
  const data = state.reports[reportId]?.fields ?? {};
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const setField = (key: string, value: string | number) => dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId, key, value } });
  const fieldData = (key: string) => data[key] ?? { value: '', aiFilled: false };
  const hasValue = (key: string) => Number(data[key]?.value) !== 0 && data[key]?.value !== undefined && data[key]?.value !== '';

  const renderMoneyInput = (field: ReportFieldDef) => <ReportAmountInput field={field} data={fieldData(field.key)} onChange={value => setField(field.key, value)} />;

  const renderSection = (section: ReportSectionDef) => {
    const title = SECTION_TITLES[formCode]?.[section.key];
    // 金額與小數（稅率、毛利率等）欄位都以逐列呈現；文字、日期、勾選另外排
    const isRowField = (f: ReportFieldDef) => f.type === 'money' || f.type === 'integer' || f.type === 'decimal';
    const moneyFields = section.fields.filter(isRowField);

    // 帳載／調整後成對：用 _BOOK 欄位的基底代號找對應 _ADJ，兩者合併成一列
    const adjMap = new Map(moneyFields.filter(f => f.key.endsWith(ADJ_SUFFIX)).map(f => [f.key.slice(0, -ADJ_SUFFIX.length), f]));
    const pairedAdjKeys = new Set<string>();
    const rows = moneyFields
      .filter(f => !f.key.endsWith(ADJ_SUFFIX) || !moneyFields.some(m => m.key === f.key.slice(0, -ADJ_SUFFIX.length) + BOOK_SUFFIX))
      .map(f => {
        const adj = f.key.endsWith(BOOK_SUFFIX) ? adjMap.get(f.key.slice(0, -BOOK_SUFFIX.length)) : undefined;
        if (adj) pairedAdjKeys.add(adj.key);
        return { main: f, adj };
      });
    const hasPairs = rows.some(r => r.adj);

    // 辨識帶入後欄位很多的區塊，沒有值的金額欄位預設收合，只留有值與小計
    const hasAiValue = moneyFields.some(f => fieldData(f.key).aiFilled);
    const canCollapse = rows.length > COLLAPSE_THRESHOLD && hasAiValue;
    const isOpen = expanded[section.key] ?? false;
    const isHidden = (row: (typeof rows)[number]) =>
      canCollapse && !isOpen && !row.main.isSubtotal && !hasValue(row.main.key) && !(row.adj && hasValue(row.adj.key));
    const hiddenCount = rows.filter(isHidden).length;

    return (
      <div key={section.key} className='flex flex-col gap-4 p-5 md:px-6'>
        {title && (
          <h2 className='border-b-2 border-neutral-dark pb-2 text-[17px] font-bold text-neutral-dark'>{title}</h2>
        )}

        <PaperSectionFields reportId={reportId} section={section} isRowField={isRowField}>
        {rows.length > 0 && (
          <div className='flex flex-col'>
            {hasPairs && (
              <div className='hidden grid-cols-[24px_minmax(0,1fr)_170px_170px] gap-x-3 px-3 pb-1.5 text-xs font-bold text-neutral-mid md:grid'>
                <span />
                <span>項目</span>
                <span className='text-right'>帳載結算金額</span>
                <span className='text-right'>自行依法調整後金額</span>
              </div>
            )}
            {rows.map(row => {
              if (isHidden(row)) return null;
              const { main, adj } = row;
              const operator = main.isSubtotal ? '＝' : main.isDeduction ? '−' : '';
              return (
                <div
                  key={main.key}
                  className={cn(
                    'grid grid-cols-[20px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 rounded-md px-3 py-1.5',
                    adj ? 'md:grid-cols-[24px_minmax(0,1fr)_170px_170px]' : 'md:grid-cols-[24px_minmax(0,1fr)_240px]',
                    main.isSubtotal && 'mt-1 bg-brand-blue/5'
                  )}
                >
                  <span className='text-center text-lg text-neutral-mid'>{operator}</span>
                  <span className={cn('min-w-0 break-words text-sm leading-snug text-neutral-dark', main.isSubtotal ? 'font-bold' : 'font-medium')}>
                    {hasPairs ? main.label.replace(PAIR_LABEL_SUFFIX, '') : main.label}
                  </span>
                  {/* 成對區塊裡沒有另一半的欄位，輸入框放在「帳載」那一欄對齊 */}
                  <div className={cn('col-start-2 md:col-end-auto', adj ? 'grid grid-cols-2 gap-2 md:contents md:col-start-auto' : hasPairs ? 'md:col-start-3' : 'md:col-start-auto')}>
                    {renderMoneyInput(main)}
                    {adj && renderMoneyInput(adj)}
                  </div>
                </div>
              );
            })}
            {canCollapse && hiddenCount + (isOpen ? 1 : 0) > 0 && (
              <button
                type='button'
                onClick={() => setExpanded(prev => ({ ...prev, [section.key]: !isOpen }))}
                className='mt-2 flex items-center gap-1 self-start px-3 py-1 text-[13px] font-medium text-brand-blue hover:underline'
              >
                <ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
                {isOpen ? '收合沒有金額的項目' : `顯示其餘 ${hiddenCount} 個沒有金額的項目`}
              </button>
            )}
          </div>
        )}

        </PaperSectionFields>
      </div>
    );
  };

  const visible = sections.filter(s => s.fields.length > 0 || (s.choices?.length ?? 0) > 0);
  if (visible.length === 0) return null;

  return (
    <>
      <div className='flex flex-col divide-y divide-neutral-blue-gray/30 rounded-lg border border-neutral-blue-gray/30 bg-white'>{visible.map(renderSection)}</div>
    </>
  );
}
