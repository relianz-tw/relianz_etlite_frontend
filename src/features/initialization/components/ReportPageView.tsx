'use client';

import { useInitialization } from '../state/InitializationContext';
import { useFormMetadata } from '../hooks/useFormMetadata';
import { formatPeriodLabel, getFormItem, isPageFilled, resolveReportPage, type ReportPageSpec } from '../reports';
import { BALANCE_SHEET_DATE_FIELD_KEY, getBalanceSheetDateLabel, getBalanceSheetDateValue } from '../reports/balanceSheetLayout';
import { FormIdentifyPanel } from './FormIdentifyPanel';
import { FormPaperPreview } from './FormPaperPreview';
import { BalanceSheetView } from './BalanceSheetView';
import { PaperFormView } from './PaperFormView';
import { ReportSections } from './ReportSections';
import { VatFormView } from './VatFormView';
import { ReportTable } from './ReportTable';
import { StepNavButtons, StepPageHeader } from '@/components/initialization/StepPageHeader';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { ChevronRight, Info } from 'lucide-react';
import SectionCard from '@/components/ui/SectionCard';
import { useEffect, useMemo } from 'react';
import type { SettlementReportId } from '../state/initializationReducer';

/** 所屬年度欄位：值固定等於該頁標題的民國年，自動填入、不給使用者輸入 */
const TAX_YEAR_FIELD_KEY = 'HDR_TAX_YEAR';
/** 401／403 的所屬期別起訖月：由頁面的期別自動填入、不給使用者輸入 */
const PERIOD_START_FIELD_KEY = 'HDR_PERIOD_START_MONTH';
const PERIOD_END_FIELD_KEY = 'HDR_PERIOD_END_MONTH';

/** 資產負債表用 T 字帳版面（BalanceSheetView），其餘文件頁用一般欄位卡片 */
const BALANCE_SHEET_CODE: SettlementReportId = 'CIT_BALANCE_SHEET';

/** 套用「紙本對照」逐列版型（代號 chip、小計、扣除項）的營所稅文件 */
const PAPER_FORM_CODES: SettlementReportId[] = ['CIT_INCOME_TAX', 'CIT_AMT', 'CIT_INVESTORS', 'CIT_UE', 'CIT_WH_RECON'];

interface ReportPageViewProps {
  /** 這一頁（營所稅各表、封面或某一期別的 401／403） */
  spec: ReportPageSpec;
  /** 該表要撈 metadata 的民國年 */
  taxYear: number;
  /** 標題上方的小字（如「第 1 / 11 份」） */
  kicker: string;
  progress?: { value: number; max: number };
  /** 是否顯示上傳辨識區 */
  showIdentify: boolean;
  nextLabel: string;
  onNext: () => void;
}

/**
 * 結算申報書單頁版面（步驟 3 封面、步驟 4 逐頁核對共用）：
 * 頁首卡片（標題、上一頁／下一頁、進度、上傳辨識）＋依 metadata API 動態產生的欄位卡片＋列明細表格＋頁底導覽。
 */
export function ReportPageView({ spec, taxYear, kicker, progress, showIdentify, nextLabel, onNext }: ReportPageViewProps) {
  const { state, dispatch } = useInitialization();
  // 營業稅期別頁依使用者選的 401 或 403（預設 401）決定表單與資料 key，營所稅頁固定
  const { formCode, reportKey } = resolveReportPage(spec, state.vatChoices);
  const { formNo, title: fallbackTitle } = getFormItem(formCode);
  const { page: rawPage, loading, error, retry } = useFormMetadata(formNo, taxYear);
  // 標題以 metadata 的文件名稱為準，載入前先用內建名稱
  const title = rawPage?.title ?? fallbackTitle;

  // 這份文件有所屬年度（401／403 另有期別起訖月）欄位時，自動填入頁面標示的值（辨識帶入的值也以頁面為準）
  // 資產負債表日取損益表的「所得期間迄」（沒填視為該年度 12 月 31 日）
  const incomePeriodEnd = state.reports.CIT_INCOME_TAX?.fields.HDR_PERIOD_END?.value;
  const autoValues: Record<string, string | number> = { [TAX_YEAR_FIELD_KEY]: taxYear };
  if (spec.period) {
    autoValues[PERIOD_START_FIELD_KEY] = spec.period.phase;
    autoValues[PERIOD_END_FIELD_KEY] = spec.period.phase + 1;
  }
  if (formCode === BALANCE_SHEET_CODE) autoValues[BALANCE_SHEET_DATE_FIELD_KEY] = getBalanceSheetDateValue(taxYear, incomePeriodEnd);
  const autoKeys = Object.keys(autoValues);
  const reportFields = state.reports[reportKey]?.fields;
  useEffect(() => {
    if (!rawPage) return;
    for (const [fieldKey, value] of Object.entries(autoValues)) {
      const exists = rawPage.sections.some(s => s.fields.some(f => f.key === fieldKey));
      if (exists && String(reportFields?.[fieldKey]?.value ?? '') !== String(value)) {
        dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId: reportKey, key: fieldKey, value } });
      }
    }
    // autoValues 由 taxYear、期別推得，依賴列出來源即可
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPage, reportFields, taxYear, spec.period?.phase, incomePeriodEnd, reportKey, dispatch]);

  // 這一頁的欄位載入後，把其他文件已填的公司識別欄位（統編、公司名稱等）帶進來
  useEffect(() => {
    if (rawPage) dispatch({ type: 'PULL_SHARED_FIELDS', payload: { reportId: reportKey } });
  }, [rawPage, reportKey, dispatch]);

  // 區塊、欄位、分組完全依 metadata，只把自動填入的欄位拿掉（不給使用者輸入）
  const autoKeyList = autoKeys.join(',');
  const sections = useMemo(() => {
    if (!rawPage) return [];
    const hidden = autoKeyList.split(',');
    return rawPage.sections.map(s => ({ ...s, fields: s.fields.filter(f => !hidden.includes(f.key)) }));
  }, [rawPage, autoKeyList]);

  // 資產負債表是某一天的狀態，標籤顯示基準日（損益表所得期間迄，沒填視為 12 月 31 日）；
  // 401／403 顯示期別與必填／選填；其餘文件顯示年度
  const badges = spec.period
    ? ['一般稅額計算', formatPeriodLabel(spec.period.rocYear, spec.period.phase), spec.required ? '必填' : '選填']
    : [formCode === BALANCE_SHEET_CODE ? getBalanceSheetDateLabel(taxYear, incomePeriodEnd) : `民國 ${taxYear} 年度`];

  // 必填的期別需要有資料（上傳辨識成功或手填皆可）才能前進；
  // 欄位載入失敗（如該年度尚未支援）時沒有欄位可填，放行以免使用者卡死
  const blocked = spec.required && !error && !isPageFilled(state.reports, reportKey);

  const nav = {
    onPrev: () => dispatch({ type: 'PREV_STEP' }),
    onNext,
    nextLabel,
    nextDisabled: blocked,
  };

  return (
    <>
      <StepPageHeader kicker={kicker} title={title} badges={badges} nav={nav}>
        <FormPaperPreview formCode={formCode} />
        {progress && (
          <div className='flex flex-col gap-1.5'>
            <ProgressBar value={progress.value} max={progress.max} label='文件進度' />
            <span className='text-xs text-neutral-mid'>
              {progress.value === 0 ? `封面填完後，接下來逐頁核對 ${progress.max} 份文件` : `共 ${progress.max} 份文件逐頁核對，已走到第 ${progress.value} 份`}
            </span>
          </div>
        )}
        {spec.period && (
          // 申報書種類提示條：預設 401，使用者可在這一期改用 403（上傳辨識到另一種也會自動切換）
          <div className='flex flex-col gap-3 rounded-lg bg-brand-blue/10 px-4 py-3 md:flex-row md:items-center md:justify-between'>
            <div className='flex min-w-0 items-start gap-2.5'>
              <Info size={18} className='mt-0.5 shrink-0 text-brand-blue' />
              <div className='flex min-w-0 flex-col'>
                <span className='text-sm font-bold text-neutral-dark'>
                  {formCode === 'VAT_403' ? '本期使用 403（有免稅或特種稅額計算的銷售）' : '本期使用 401（只有應稅及零稅率銷售）'}
                </span>
                <span className='text-[13px] text-neutral-mid'>
                  {formCode === 'VAT_403' ? '本期若只有應稅及零稅率銷售，可改用 401。' : '本期若有免稅或特種稅額計算的銷售額，需改用 403。'}
                </span>
              </div>
            </div>
            <Button
              variant='outline'
              size='sm'
              iconPosition='right'
              icon={ChevronRight}
              className='shrink-0 self-start md:self-auto'
              onClick={() => dispatch({ type: 'SET_VAT_CHOICE', payload: { pageKey: spec.key, formCode: formCode === 'VAT_403' ? 'VAT_401' : 'VAT_403' } })}
            >
              {formCode === 'VAT_403' ? '改用 401' : '改用 403'}
            </Button>
          </div>
        )}
        {blocked && <p className='text-xs text-semantic-error'>此期別為必填，請上傳文件或手動輸入資料後再前往下一份。</p>}
        {showIdentify && <FormIdentifyPanel formTitle={title} required={spec.required} />}
      </StepPageHeader>

      {loading && <p className='text-sm text-neutral-mid'>表單欄位載入中…</p>}
      {error && (
        <SectionCard>
          <p className='text-sm text-semantic-error'>{error}</p>
          <Button variant='ghost' onClick={retry} className='self-start'>
            重新載入
          </Button>
        </SectionCard>
      )}

      {rawPage && (
        <>
          {formCode === BALANCE_SHEET_CODE ? (
            <BalanceSheetView sections={sections} />
          ) : spec.period ? (
            <VatFormView reportId={reportKey} sections={sections} />
          ) : (
            <>
              {PAPER_FORM_CODES.includes(formCode) ? (
                <PaperFormView reportId={reportKey} formCode={formCode} sections={sections} />
              ) : (
                <ReportSections reportId={reportKey} sections={sections} />
              )}
              {rawPage.table && (
                <SectionCard title='明細'>
                  <ReportTable reportId={reportKey} table={rawPage.table} />
                </SectionCard>
              )}
            </>
          )}

          {/* 長表單捲到底不用回頂端：桌機頁底再放一組上一頁／下一頁（手機已固定於畫面底部） */}
          <div className='hidden items-center justify-between md:flex'>
            <span className='text-[13px] text-neutral-mid'>{kicker}　{title}</span>
            <StepNavButtons nav={nav} />
          </div>
        </>
      )}
    </>
  );
}
