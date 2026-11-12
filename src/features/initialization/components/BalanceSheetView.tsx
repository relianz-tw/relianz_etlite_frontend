'use client';

import { useInitialization } from '../state/InitializationContext';
import {
  ASSET_TOTAL_KEY,
  BALANCE_BLOCKS,
  LIABILITY_EQUITY_TOTAL_KEY,
  LIABILITY_TOTAL_KEY,
  type BalanceBlockConfig,
} from '../reports/balanceSheetLayout';
import { ChoiceGroup } from './paper/ChoiceGroup';
import { PaperForm } from './paper/PaperForm';
import { PaperStoreProvider } from './paper/PaperStore';
import { CodeChip } from './paper/CodeChip';
import { TemplateText } from './paper/TemplateText';
import { useInitPaperStore } from './paper/useInitPaperStore';
import { ReportFieldRow } from './ReportFieldRow';
import MoneyInput from '@/components/ui/MoneyInput';
import { cn, fmtCurrency } from '@/lib/utils';
import { CircleCheck, Clock, TriangleAlert } from 'lucide-react';
import type { ReportFieldDef, ReportPageDef, ReportSectionDef } from '../reports/types';
import type { SettlementReportId } from '../state/initializationReducer';

const REPORT_ID: SettlementReportId = 'CIT_BALANCE_SHEET';

/** T 字帳版面已處理的區塊：HEADER、TOTAL 與五個科目區塊 */
const KNOWN_SECTION_KEYS: string[] = ['HEADER', 'TOTAL', ...Object.values(BALANCE_BLOCKS).map(b => b.sectionKey)];

/** 欄位列：標籤在左、輸入在右同一行（輸入欄桌機固定 210px，左右兩側金額欄切齊） */
const ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_150px] items-center gap-3 nav:grid-cols-[minmax(0,1fr)_210px]';

interface BalanceSheetViewProps {
  page: ReportPageDef;
  sections: ReportSectionDef[];
}

/**
 * 資產負債表 T 字帳：左資產、右負債及權益。
 * 流動資產｜流動負債同列、小計落在同一水平線；非流動資產在左，右側垂直堆疊
 * 非流動負債、負債總額、權益與比對勾稽（欄位數差異大，不強迫列對列）。
 * 小計與總額取 metadata 的合計欄位（辨識帶入或使用者輸入），前端不自行加總。
 */
export function BalanceSheetView({ page, sections }: BalanceSheetViewProps) {
  const { state, dispatch } = useInitialization();
  const store = useInitPaperStore(REPORT_ID, page);
  const data = state.reports[REPORT_ID].fields;

  const fieldMap = new Map<string, ReportFieldDef>();
  const sectionMap = new Map<string, ReportSectionDef>();
  for (const section of sections) {
    if (section.key) sectionMap.set(section.key, section);
    for (const field of section.fields) fieldMap.set(field.key, field);
  }

  const amount = (key: string) => Number(data[key]?.value) || 0;

  // 被列標題模板（labelTemplate）用 {{field:}} 嵌進別列標題的欄位（如 1510 無形資產「包括商譽金額 ＿ 元」），不再單獨畫成一列
  const embeddedKeys = new Set<string>();
  for (const f of fieldMap.values()) {
    if (f.labelTemplate) for (const m of f.labelTemplate.matchAll(/\{\{field:([^}]+)\}\}/g)) embeddedKeys.add(m[1]);
  }

  // 依父科目（parentFieldCode）算縮排層級：區塊小計（BS_1100 等）以外，每往下一層縮 16px，最多三層
  const depthOf = (field: ReportFieldDef): number => {
    let depth = 0;
    let parent = field.parentKey ? fieldMap.get(field.parentKey) : undefined;
    while (parent && depth < 3) {
      depth++;
      parent = parent.parentKey ? fieldMap.get(parent.parentKey) : undefined;
    }
    return Math.max(0, depth - 1);
  };

  // 紙本填在「合計」欄的科目（後端 isTotalColumn：小計、資本公積、減：庫藏股票等）標題粗體
  const renderRow = (field: ReportFieldDef, emphasized = false) => (
    // 標籤內嵌輸入框（如「包括商譽金額 ＿ 元」）的列，手機標籤整列、金額欄在下，內嵌輸入框才放得下、不蓋到金額欄
    <div key={field.key} className={cn(ROW_GRID, field.labelTemplate && '!grid-cols-1 nav:!grid-cols-[minmax(0,1fr)_210px]', emphasized && 'font-bold')}>
      <span style={{ paddingLeft: depthOf(field) * 16 }} className='flex min-w-0 items-center gap-2'>
        {/* 紙本科目編號（如 1111）；沒有編號的科目留空不佔位 */}
        <CodeChip official={field.officialCode} refNo={field.refNo} />
        <span className={cn('min-w-0 break-words leading-snug text-neutral-dark', field.label.length > 16 ? 'text-xs' : 'text-sm', emphasized || field.isSubtotal || field.isTotalColumn ? 'font-bold' : 'font-normal')}>
          {field.labelTemplate && store ? (
            <PaperStoreProvider value={store}>
              <TemplateText template={field.labelTemplate} />
            </PaperStoreProvider>
          ) : (
            field.label
          )}
        </span>
      </span>
      {field.isDeduction ? (
        // 減項：紙本以（）表示負值。括號在輸入框內（$ ( 金額 )），輸入正數，存進狀態時一律轉成負值
        <MoneyInput
          widthClassName='w-full'
          parentheses
          value={Math.abs(amount(field.key))}
          aiFilled={data[field.key]?.aiFilled}
          onChange={value => dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId: REPORT_ID, key: field.key, value: value === 0 ? 0 : -Math.abs(value) } })}
        />
      ) : (
        <MoneyInput
          widthClassName='w-full'
          value={amount(field.key)}
          allowSign
          typedSign
          aiFilled={data[field.key]?.aiFilled}
          onChange={value => dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId: REPORT_ID, key: field.key, value } })}
        />
      )}
    </div>
  );

  const renderBlock = (config: BalanceBlockConfig) => {
    const section = sectionMap.get(config.sectionKey);
    const subtotal = fieldMap.get(config.subtotalKey);
    if (!section) return null;
    const rows = section.fields.filter(f => f.key !== config.subtotalKey && !embeddedKeys.has(f.key));
    return (
      <div className='flex h-full flex-col gap-2'>
        <div className='flex items-baseline gap-2'>
          <h3 className='text-[15px] font-bold text-neutral-dark'>{config.title}</h3>
        </div>
        {rows.map(f => renderRow(f))}
        {/* 小計貼區塊底部，用虛線與明細區隔；同列兩側的小計因此落在同一水平線 */}
        {subtotal && <div className='mt-auto border-t border-dashed border-neutral-blue-gray pt-2'>{renderRow(subtotal, true)}</div>}
      </div>
    );
  };

  const assetTotal = amount(ASSET_TOTAL_KEY);
  const liabilityEquityTotal = amount(LIABILITY_EQUITY_TOTAL_KEY);
  const difference = assetTotal - liabilityEquityTotal;
  const hasTotals = assetTotal !== 0 || liabilityEquityTotal !== 0;
  const isBalanced = hasTotals && difference === 0;

  const liabilityTotalField = fieldMap.get(LIABILITY_TOTAL_KEY);
  const assetTotalField = fieldMap.get(ASSET_TOTAL_KEY);
  const liabilityEquityTotalField = fieldMap.get(LIABILITY_EQUITY_TOTAL_KEY);

  const cell = 'border-t border-neutral-blue-gray/30 p-5 nav:px-6';

  // 表頭：metadata 的 HEADER 區塊完整呈現（財產目錄填報方式、公司名稱、統編、收件編號；自動填入的資產負債表日已由上層排除）
  const headerSection = sectionMap.get('HEADER');
  const headerChoices = headerSection?.choices ?? [];
  // 勾選群組的成員已由 ChoiceGroup 畫過，不再當一般欄位重複畫
  const choiceKeys = new Set(headerChoices.flatMap(c => c.fields.map(f => f.key)));
  const headerFields = (headerSection?.fields ?? []).filter(f => !choiceKeys.has(f.key));

  // 不在 T 字帳配置內的區塊（metadata 日後新增時）以一般欄位卡片補在下方，確保 metadata 的欄位都有呈現
  const extraSections = sections.filter(s => !s.key || !KNOWN_SECTION_KEYS.includes(s.key));

  return (
    <>
      {(headerChoices.length > 0 || headerFields.length > 0) && (
        <div className='grid grid-cols-1 gap-4 rounded-lg border border-neutral-blue-gray/30 bg-white p-5 nav:grid-cols-2 nav:gap-x-6 nav:px-6'>
          {store && (
            <PaperStoreProvider value={store}>
              {headerChoices.map(choice => (
                <div key={choice.groupCode} className='nav:col-span-2'>
                  <ChoiceGroup choice={choice} />
                </div>
              ))}
            </PaperStoreProvider>
          )}
          {headerFields.map(field => (
            <ReportFieldRow
              key={field.key}
              field={field}
              data={data[field.key] ?? { value: '', aiFilled: false }}
              onChange={value => dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId: REPORT_ID, key: field.key, value } })}
            />
          ))}
        </div>
      )}

      <div className='overflow-hidden rounded-lg border border-neutral-blue-gray/30 bg-white'>
        <div className='hidden grid-cols-2 border-b border-neutral-blue-gray/30 bg-surface-off-white nav:grid'>
          <div className='border-r border-neutral-blue-gray/30 px-6 py-3.5'>
            <h2 className='text-[17px] font-bold text-neutral-dark'>資產</h2>
          </div>
          <div className='px-6 py-3.5'>
            <h2 className='text-[17px] font-bold text-neutral-dark'>負債及權益</h2>
          </div>
        </div>

        {/* DOM 順序即手機堆疊順序（資產 → 負債 → 權益 → 勾稽）；桌機用明確格位排成 T 字帳 */}
        <div className='grid grid-cols-1 nav:grid-cols-2'>
          <div className={cn(cell, 'border-t-0 nav:col-start-1 nav:row-start-1 nav:border-r')}>{renderBlock(BALANCE_BLOCKS.currentAssets)}</div>
          <div className={cn(cell, 'nav:col-start-1 nav:row-start-2 nav:border-r')}>{renderBlock(BALANCE_BLOCKS.nonCurrentAssets)}</div>
          <div className={cn(cell, 'nav:col-start-2 nav:row-start-1 nav:border-t-0')}>{renderBlock(BALANCE_BLOCKS.currentLiabilities)}</div>
          <div className='border-t border-neutral-blue-gray/30 nav:col-start-2 nav:row-start-2'>
            <div className='p-5 nav:px-6'>{renderBlock(BALANCE_BLOCKS.nonCurrentLiabilities)}</div>
            {liabilityTotalField && <div className='border-t border-neutral-blue-gray/30 bg-surface-off-white p-5 nav:px-6'>{renderRow(liabilityTotalField, true)}</div>}
            <div className='border-t border-neutral-blue-gray/30 p-5 nav:px-6'>{renderBlock(BALANCE_BLOCKS.equity)}</div>
          </div>
        </div>

        {/* 總額列：左右各一個合計欄位，中間以等號圓章表示是否相等 */}
        {/* 底色放在整列（含中間的等號欄），平衡為綠色、不平衡為紅色、尚未填寫為灰色 */}
        <div
          className={cn(
            'grid grid-cols-1 border-t-2 border-neutral-dark nav:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] nav:items-center',
            isBalanced ? 'bg-semantic-success/5' : hasTotals ? 'bg-semantic-error/5' : 'bg-surface-off-white'
          )}
        >
          <div className='p-5 nav:px-6'>
            {assetTotalField && (
              <div className='flex flex-col gap-1.5'>
                {renderRow(assetTotalField, true)}
              </div>
            )}
          </div>
          <span
            role='img'
            aria-label={isBalanced ? '左右相等' : hasTotals ? '左右不相等' : '尚未填寫'}
            className={cn(
              'mx-auto my-2 hidden h-9 w-9 items-center justify-center rounded-full text-xl font-bold text-white nav:flex',
              isBalanced ? 'bg-semantic-success' : hasTotals ? 'bg-semantic-error' : 'bg-neutral-blue-gray'
            )}
          >
            {hasTotals && !isBalanced ? '≠' : '='}
          </span>
          <div className='border-t border-neutral-blue-gray/30 p-5 nav:border-t-0 nav:px-6'>
            {liabilityEquityTotalField && (
              <div className='flex flex-col gap-1.5'>
                {renderRow(liabilityEquityTotalField, true)}
              </div>
            )}
          </div>
        </div>
      </div>

      {store && <PaperForm sections={extraSections} store={store} />}

      {/* 底部固定平衡列：捲到哪都看得到差額（依固定操作列的實際高度 --init-action-bar-h 往上讓開） */}
      <section
        aria-live='polite'
        className={cn(
          'sticky bottom-[calc(var(--init-action-bar-h,0px)+0.75rem)] z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white px-4 py-2.5 shadow-level1 nav:px-5 nav:py-3.5',
          isBalanced ? 'border-semantic-success/45' : hasTotals ? 'border-semantic-error/45' : 'border-neutral-blue-gray/30'
        )}
      >
        <div className='flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[13px] tabular-nums nav:gap-x-7 nav:text-sm'>
          <span>
            資產 <strong className='font-bold'>{fmtCurrency(assetTotal)}</strong>
          </span>
          <span>
            負債＋權益 <strong className='font-bold'>{fmtCurrency(liabilityEquityTotal)}</strong>
          </span>
          <span>
            差額 <strong className={cn('font-bold', hasTotals && (isBalanced ? 'text-semantic-success' : 'text-semantic-error'))}>{fmtCurrency(difference)}</strong>
          </span>
        </div>
        <span
          className={cn(
            'flex items-center gap-1.5 text-[13px] font-bold nav:text-sm',
            isBalanced ? 'text-semantic-success' : hasTotals ? 'text-semantic-error' : 'text-neutral-mid'
          )}
        >
          {isBalanced ? <CircleCheck size={18} /> : hasTotals ? <TriangleAlert size={18} /> : <Clock size={18} />}
          {isBalanced ? '借貸平衡' : hasTotals ? '借貸尚未平衡' : '待填寫'}
        </span>
      </section>
    </>
  );
}
