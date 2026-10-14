'use client';

import { useInitialization } from '../state/InitializationContext';
import { useFormMetadata } from '../hooks/useFormMetadata';
import { getFormItem } from '../reports';
import { FormIdentifyPanel } from './FormIdentifyPanel';
import { ReportBalanceBar } from './ReportBalanceBar';
import { ReportSections } from './ReportSections';
import { ReportTable } from './ReportTable';
import { StepNavButtons, StepPageHeader } from '@/components/initialization/StepPageHeader';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import SectionCard from '@/components/ui/SectionCard';
import { useEffect, useMemo } from 'react';
import type { ReportPageDef, ReportSectionDef } from '../reports/types';
import type { SettlementReportId } from '../state/initializationReducer';

/** 所屬年度欄位：值固定等於該頁標題的民國年，自動填入、不給使用者輸入 */
const TAX_YEAR_FIELD_KEY = 'HDR_TAX_YEAR';

interface ReportPageViewProps {
  formCode: SettlementReportId;
  /** 該表要撈 metadata 的民國年 */
  taxYear: number;
  /** 標題上方的小字（如「第 1 / 11 份」） */
  kicker: string;
  progress?: { value: number; max: number };
  /** 是否顯示上傳辨識區 */
  showIdentify: boolean;
  /** 載入後對區塊做整理（如封面把組織型態／申報種類／其他勾選合併成一張卡） */
  transformSections?: (sections: ReportSectionDef[]) => ReportSectionDef[];
  nextLabel: string;
  /** 按下一步時呼叫，帶入已載入的頁面定義（尚未載入為 null） */
  onNext: (page: ReportPageDef | null) => void;
}

/**
 * 結算申報書單頁版面（步驟 3 封面、步驟 4 逐頁核對共用）：
 * 頁首卡片（標題、上一頁／下一頁、進度、上傳辨識）＋依 metadata API 動態產生的欄位卡片＋列明細表格＋頁底導覽。
 */
export function ReportPageView({ formCode, taxYear, kicker, progress, showIdentify, transformSections, nextLabel, onNext }: ReportPageViewProps) {
  const { state, dispatch } = useInitialization();
  const { formNo, title } = getFormItem(formCode);
  const { page: rawPage, loading, error, retry } = useFormMetadata(formNo, taxYear);

  // 這份文件有所屬年度欄位時，自動填入標題的民國年（辨識帶入的值也以標題年度為準）
  const hasTaxYearField = !!rawPage?.sections.some(s => s.fields.some(f => f.key === TAX_YEAR_FIELD_KEY));
  const currentTaxYear = state.reports[formCode].fields[TAX_YEAR_FIELD_KEY]?.value;
  useEffect(() => {
    if (hasTaxYearField && Number(currentTaxYear) !== taxYear) {
      dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId: formCode, key: TAX_YEAR_FIELD_KEY, value: taxYear } });
    }
  }, [hasTaxYearField, currentTaxYear, taxYear, formCode, dispatch]);

  const sections = useMemo(() => {
    if (!rawPage) return [];
    // 所屬年度欄位不顯示給使用者
    const visible = rawPage.sections.map(s => ({ ...s, fields: s.fields.filter(f => f.key !== TAX_YEAR_FIELD_KEY) }));
    return transformSections ? transformSections(visible) : visible;
    // transformSections 為呼叫端的模組層函式，不納入依賴
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPage]);

  const nav = {
    onPrev: () => dispatch({ type: 'PREV_STEP' }),
    onNext: () => onNext(rawPage),
    nextLabel,
  };

  return (
    <>
      <StepPageHeader kicker={kicker} title={title} badges={[`民國 ${taxYear} 年度`]} nav={nav}>
        {progress && (
          <div className='flex flex-col gap-1.5'>
            <ProgressBar value={progress.value} max={progress.max} label='文件進度' />
            <span className='text-xs text-neutral-mid'>
              {progress.value === 0 ? `封面填完後，接下來逐頁核對 ${progress.max} 份文件` : `共 ${progress.max} 份文件逐頁核對，已走到第 ${progress.value} 份`}
            </span>
          </div>
        )}
        {showIdentify && <FormIdentifyPanel formTitle={title} />}
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
          <ReportSections reportId={rawPage.id} sections={sections} />
          {rawPage.table && (
            <SectionCard title='明細'>
              <ReportTable reportId={rawPage.id} table={rawPage.table} />
            </SectionCard>
          )}
          {rawPage.balanceCheck && <ReportBalanceBar reportId={rawPage.id} page={rawPage} />}

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
