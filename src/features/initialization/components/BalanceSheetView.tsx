'use client';

import { useInitialization } from '../state/InitializationContext';
import {
  ASSET_TOTAL_KEY,
  BALANCE_BLOCKS,
  LIABILITY_EQUITY_TOTAL_KEY,
  LIABILITY_TOTAL_KEY,
  getOfficialCode,
  type BalanceBlockConfig,
} from '../reports/balanceSheetLayout';
import { ReportChoiceField } from './ReportChoiceField';
import { ReportFieldRow } from './ReportFieldRow';
import { ReportSections } from './ReportSections';
import MoneyInput from '@/components/ui/MoneyInput';
import { cn, fmtCurrency } from '@/lib/utils';
import { CircleCheck, Clock, Info, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReportFieldDef, ReportSectionDef } from '../reports/types';
import type { SettlementReportId } from '../state/initializationReducer';

const REPORT_ID: SettlementReportId = 'CIT_BALANCE_SHEET';

/** T 字帳版面已處理的區塊：HEADER、TOTAL 與五個科目區塊 */
const KNOWN_SECTION_KEYS: string[] = ['HEADER', 'TOTAL', ...Object.values(BALANCE_BLOCKS).map(b => b.sectionKey)];

/** 欄位列：標籤在左、輸入在右同一行（輸入欄桌機固定 210px，左右兩側金額欄切齊） */
const ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_150px] items-center gap-3 md:grid-cols-[minmax(0,1fr)_210px]';

interface BalanceSheetViewProps {
  sections: ReportSectionDef[];
}

/**
 * 資產負債表 T 字帳：左資產、右負債及權益。
 * 流動資產｜流動負債同列、小計落在同一水平線；非流動資產在左，右側垂直堆疊
 * 非流動負債、負債總額、權益與比對勾稽（欄位數差異大，不強迫列對列）。
 * 小計與總額取 metadata 的合計欄位（辨識帶入或使用者輸入），前端不自行加總。
 */
export function BalanceSheetView({ sections }: BalanceSheetViewProps) {
  const { state, dispatch } = useInitialization();
  const data = state.reports[REPORT_ID].fields;

  const fieldMap = new Map<string, ReportFieldDef>();
  const sectionMap = new Map<string, ReportSectionDef>();
  for (const section of sections) {
    if (section.key) sectionMap.set(section.key, section);
    for (const field of section.fields) fieldMap.set(field.key, field);
  }

  const amount = (key: string) => Number(data[key]?.value) || 0;

  const renderRow = (field: ReportFieldDef, emphasized = false) => (
    <label key={field.key} className={cn(ROW_GRID, emphasized && 'font-bold')}>
      <span className={cn('break-words leading-snug text-neutral-dark', field.label.length > 16 ? 'text-xs' : 'text-sm', emphasized ? 'font-bold' : 'font-normal')}>{field.label}</span>
      <MoneyInput
        widthClassName='w-full'
        value={amount(field.key)}
        aiFilled={data[field.key]?.aiFilled}
        onChange={value => dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId: REPORT_ID, key: field.key, value } })}
      />
    </label>
  );

  const renderBlock = (config: BalanceBlockConfig) => {
    const section = sectionMap.get(config.sectionKey);
    const subtotal = fieldMap.get(config.subtotalKey);
    if (!section) return null;
    const rows = section.fields.filter(f => f.key !== config.subtotalKey);
    return (
      <div className='flex h-full flex-col gap-2'>
        <div className='flex items-baseline gap-2'>
          {subtotal && <span className='text-xs tabular-nums text-neutral-mid'>{getOfficialCode(subtotal.key)}</span>}
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

  const cell = 'border-t border-neutral-blue-gray/30 p-5 md:px-6';

  // 表頭：metadata 的 HEADER 區塊完整呈現（財產目錄填報方式、公司名稱、統編、收件編號；自動填入的資產負債表日已由上層排除）
  const headerSection = sectionMap.get('HEADER');
  const headerChoices = headerSection?.choices ?? [];
  const headerFields = headerSection?.fields ?? [];

  // 不在 T 字帳配置內的區塊（metadata 日後新增時）以一般欄位卡片補在下方，確保 metadata 的欄位都有呈現
  const extraSections = sections.filter(s => !s.key || !KNOWN_SECTION_KEYS.includes(s.key));

  return (
    <>
      {(headerChoices.length > 0 || headerFields.length > 0) && (
        <div className='grid grid-cols-1 gap-4 rounded-lg border border-neutral-blue-gray/30 bg-white p-5 md:grid-cols-2 md:gap-x-6 md:px-6'>
          {headerChoices.map(choice => (
            <ReportChoiceField key={choice.groupCode} reportId={REPORT_ID} title={choice.title} fields={choice.fields} />
          ))}
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
        <div className='hidden grid-cols-2 border-b border-neutral-blue-gray/30 bg-surface-off-white md:grid'>
          <div className='border-r border-neutral-blue-gray/30 px-6 py-3.5'>
            <h2 className='text-[17px] font-bold text-neutral-dark'>資產</h2>
          </div>
          <div className='px-6 py-3.5'>
            <h2 className='text-[17px] font-bold text-neutral-dark'>負債及權益</h2>
          </div>
        </div>

        {/* DOM 順序即手機堆疊順序（資產 → 負債 → 權益 → 勾稽）；桌機用明確格位排成 T 字帳 */}
        <div className='grid grid-cols-1 md:grid-cols-2'>
          <div className={cn(cell, 'border-t-0 md:col-start-1 md:row-start-1 md:border-r')}>{renderBlock(BALANCE_BLOCKS.currentAssets)}</div>
          <div className={cn(cell, 'md:col-start-1 md:row-start-2 md:border-r')}>{renderBlock(BALANCE_BLOCKS.nonCurrentAssets)}</div>
          <div className={cn(cell, 'md:col-start-2 md:row-start-1 md:border-t-0')}>{renderBlock(BALANCE_BLOCKS.currentLiabilities)}</div>
          <div className='border-t border-neutral-blue-gray/30 md:col-start-2 md:row-start-2'>
            <div className='p-5 md:px-6'>{renderBlock(BALANCE_BLOCKS.nonCurrentLiabilities)}</div>
            {liabilityTotalField && <div className='border-t border-neutral-blue-gray/30 bg-surface-off-white p-5 md:px-6'>{renderRow(liabilityTotalField, true)}</div>}
            <div className='border-t border-neutral-blue-gray/30 p-5 md:px-6'>{renderBlock(BALANCE_BLOCKS.equity)}</div>
            <div className='border-t border-neutral-blue-gray/30 p-5 md:px-6'>
              <BalanceChecks amount={amount} />
            </div>
          </div>
        </div>

        {/* 總額列：左右各一個合計欄位，中間以等號圓章表示是否相等 */}
        <div className='grid grid-cols-1 border-t-2 border-neutral-dark md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center'>
          <div className='bg-semantic-success/5 p-5 md:px-6'>
            {assetTotalField && (
              <div className='flex flex-col gap-1.5'>
                <span className='text-xs tabular-nums text-neutral-mid'>{getOfficialCode(ASSET_TOTAL_KEY)}</span>
                {renderRow(assetTotalField, true)}
              </div>
            )}
          </div>
          <span
            role='img'
            aria-label={isBalanced ? '左右相等' : hasTotals ? '左右不相等' : '尚未填寫'}
            className={cn(
              'mx-auto my-2 hidden h-9 w-9 items-center justify-center rounded-full text-xl font-bold text-white md:flex',
              isBalanced ? 'bg-semantic-success' : hasTotals ? 'bg-semantic-error' : 'bg-neutral-blue-gray'
            )}
          >
            {hasTotals && !isBalanced ? '≠' : '='}
          </span>
          <div className='border-t border-neutral-blue-gray/30 bg-semantic-success/5 p-5 md:border-t-0 md:px-6'>
            {liabilityEquityTotalField && (
              <div className='flex flex-col gap-1.5'>
                <span className='text-xs tabular-nums text-neutral-mid'>{getOfficialCode(LIABILITY_EQUITY_TOTAL_KEY)}</span>
                {renderRow(liabilityEquityTotalField, true)}
              </div>
            )}
          </div>
        </div>
      </div>

      <ReportSections reportId={REPORT_ID} sections={extraSections} />

      {/* 底部固定平衡列：捲到哪都看得到差額（手機需避開固定的上一頁／下一頁操作列） */}
      <section
        aria-live='polite'
        className={cn(
          'sticky bottom-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white px-5 py-3.5 shadow-level1 md:bottom-4',
          isBalanced ? 'border-semantic-success/45' : hasTotals ? 'border-semantic-error/45' : 'border-neutral-blue-gray/30'
        )}
      >
        <div className='flex flex-wrap items-center gap-x-7 gap-y-1 text-sm tabular-nums'>
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
            'flex items-center gap-1.5 text-sm font-bold',
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

type CheckTone = 'ok' | 'error' | 'info' | 'pending';

const TONE_STYLE: Record<CheckTone, { icon: LucideIcon; iconClass: string; pillClass: string }> = {
  ok: { icon: CircleCheck, iconClass: 'text-semantic-success', pillClass: 'bg-semantic-success/10 text-semantic-success' },
  error: { icon: TriangleAlert, iconClass: 'text-semantic-error', pillClass: 'bg-semantic-error/10 text-semantic-error' },
  info: { icon: Info, iconClass: 'text-brand-blue', pillClass: 'bg-brand-blue/10 text-brand-blue' },
  pending: { icon: Clock, iconClass: 'text-neutral-mid', pillClass: 'border border-neutral-blue-gray/50 bg-white text-neutral-mid' },
};

/** 比對與勾稽：只比對本頁已填的合計欄位，皆為唯讀即時計算 */
function BalanceChecks({ amount }: { amount: (key: string) => number }) {
  const assets = amount(ASSET_TOTAL_KEY);
  const liabilities = amount(LIABILITY_TOTAL_KEY);
  const equity = amount(BALANCE_BLOCKS.equity.subtotalKey);
  const currentAssets = amount(BALANCE_BLOCKS.currentAssets.subtotalKey);
  const currentLiabilities = amount(BALANCE_BLOCKS.currentLiabilities.subtotalKey);

  const equationPending = assets === 0 && liabilities === 0 && equity === 0;
  const equationDiff = assets - liabilities - equity;
  const workingPending = currentAssets === 0 && currentLiabilities === 0;

  const checks: { label: string; detail: string; status: string; tone: CheckTone }[] = [
    {
      label: '資產 − 負債 = 權益',
      detail: equationPending
        ? '資產總計、負債合計、權益總計填完後比對'
        : equationDiff === 0
          ? `${fmtCurrency(assets)} − ${fmtCurrency(liabilities)} = ${fmtCurrency(equity)}，與權益總計一致`
          : `${fmtCurrency(assets)} − ${fmtCurrency(liabilities)} = ${fmtCurrency(assets - liabilities)}，與權益總計相差 ${fmtCurrency(equationDiff)}`,
      status: equationPending ? '待填' : equationDiff === 0 ? '一致' : '不一致',
      tone: equationPending ? 'pending' : equationDiff === 0 ? 'ok' : 'error',
    },
    {
      label: '營運資金（流動資產 − 流動負債）',
      detail: workingPending ? '流動資產合計、流動負債合計填完後顯示' : `${fmtCurrency(currentAssets)} − ${fmtCurrency(currentLiabilities)} = ${fmtCurrency(currentAssets - currentLiabilities)}`,
      status: workingPending ? '待填' : '參考',
      tone: workingPending ? 'pending' : 'info',
    },
  ];

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-0.5'>
        <h3 className='text-[15px] font-bold text-neutral-dark'>比對與勾稽</h3>
        <span className='text-xs text-neutral-mid'>跟著上方填寫的數字即時計算</span>
      </div>
      {checks.map(check => {
        const tone = TONE_STYLE[check.tone];
        const Icon = tone.icon;
        return (
          <div key={check.label} className='flex items-start gap-2.5 rounded-lg bg-surface-off-white px-3.5 py-3'>
            <Icon size={16} className={cn('mt-1 shrink-0', tone.iconClass)} />
            <div className='flex min-w-0 flex-1 flex-col'>
              <span className='text-sm font-medium text-neutral-dark'>{check.label}</span>
              <span className='text-xs tabular-nums text-neutral-mid'>{check.detail}</span>
            </div>
            <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold', tone.pillClass)}>{check.status}</span>
          </div>
        );
      })}
    </div>
  );
}
