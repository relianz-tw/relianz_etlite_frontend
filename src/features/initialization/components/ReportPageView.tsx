'use client';

import { useInitialization } from '../state/InitializationContext';
import { useFormMetadata } from '../hooks/useFormMetadata';
import { getFormItem, omitFields, type VatFormCode, isPageFilled, resolveReportPage, type ReportPageSpec } from '../reports';
import { BALANCE_SHEET_DATE_FIELD_KEY, getBalanceSheetDateLabel, getBalanceSheetDateValue } from '../reports/balanceSheetLayout';
import { FormIdentifyPanel } from './FormIdentifyPanel';
import { FormPaperPreview } from './FormPaperPreview';
import { PAPER_PREVIEWS } from '../reports/paperPreviews';
import { UploadedFilePreview } from './UploadedFilePreview';
import { BalanceSheetView } from './BalanceSheetView';
import { PaperForm } from './paper/PaperForm';
import { PaperStoreProvider } from './paper/PaperStore';
import { useInitPaperStore } from './paper/useInitPaperStore';
import { VatResultCard } from './VatResultCard';
import { VatPeriodPicker } from './VatPeriodPicker';
import { TriangleAlert } from 'lucide-react';
import { ReportTable } from './ReportTable';
import { StepPageHeader } from '@/components/initialization/StepPageHeader';
import type { StepProgressValue } from '@/components/initialization/StepProgress';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import SectionCard from '@/components/ui/SectionCard';
import { useEffect, useMemo } from 'react';
import type { SettlementReportId } from '../state/initializationReducer';

/** 所屬年度欄位：值固定等於該頁標題的民國年，自動填入、不給使用者輸入 */
const TAX_YEAR_FIELD_KEY = 'HDR_TAX_YEAR';
/** 401／403 的所屬期別起訖月：由頁面的期別自動填入、不給使用者輸入 */
const PERIOD_START_FIELD_KEY = 'HDR_PERIOD_START_MONTH';
const PERIOD_END_FIELD_KEY = 'HDR_PERIOD_END_MONTH';

/** 封面「股票發行狀況」勾選群組：只有股份有限公司才有股票發行，其他組織型態整組不顯示 */
const STOCK_GROUP_CODE = 'STOCK';

/** 資產負債表用 T 字帳版面（BalanceSheetView），其餘文件頁用一般欄位卡片 */
const BALANCE_SHEET_CODE: SettlementReportId = 'CIT_BALANCE_SHEET';

interface ReportPageViewProps {
  /** 這一頁（營所稅各表、封面或某一期別的 401／403） */
  spec: ReportPageSpec;
  /** 該表要撈 metadata 的民國年 */
  taxYear: number;
  /** 標題上方的小字（如「第 1 / 11 份」） */
  kicker: string;
  progress?: StepProgressValue;
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
  const { state, dispatch, vatUploads } = useInitialization();
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
      const exists = !!rawPage.fieldMap[fieldKey];
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
  const hideStock = formCode === 'CIT_COVER' && state.orgType !== 'share';
  const sections = useMemo(() => {
    if (!rawPage) return [];
    const stockKeys = hideStock ? (rawPage.groupMap[STOCK_GROUP_CODE]?.fields ?? []).map(f => f.key) : [];
    return omitFields(rawPage.sections, [...autoKeyList.split(','), ...stockKeys]);
  }, [rawPage, autoKeyList, hideStock]);
  const store = useInitPaperStore(reportKey, rawPage, autoKeys);

  // 資產負債表是某一天的狀態，標籤顯示基準日（損益表所得期間迄，沒填視為 12 月 31 日）；
  // 401／403 不顯示標籤（期別已在副標與期別卡片、必填／選填在卡片徽章）；其餘文件顯示年度
  // 未分配盈餘申報書是前一年度的盈餘（紙本標題「113 年度未分配盈餘申報書」），標籤顯示前一年
  const paperPage = PAPER_PREVIEWS[formCode]?.paperPage;
  const badges = spec.period
    ? undefined
    : [formCode === BALANCE_SHEET_CODE ? getBalanceSheetDateLabel(taxYear, incomePeriodEnd) : formCode === 'CIT_UE' ? `民國 ${taxYear - 1} 年度` : `民國 ${taxYear} 年度`, ...(paperPage ? [`紙本${paperPage}`] : [])];

  // 收件編號：同一年度的申報書每一頁都一樣。這一頁和多數頁不同時提醒使用者確認是不是這個年度的申報書
  // （各頁以出現次數最多的值為準，次數相同以最早填的頁為準）
  const receiptNo = String(reportFields?.HDR_RECEIPT_NO?.value ?? '').trim();
  const receiptCounts = new Map<string, number>();
  for (const report of Object.values(state.reports)) {
    const value = String(report?.fields?.HDR_RECEIPT_NO?.value ?? '').trim();
    if (value) receiptCounts.set(value, (receiptCounts.get(value) ?? 0) + 1);
  }
  const mainReceiptNo = [...receiptCounts.entries()].reduce<[string, number] | null>((best, entry) => (best === null || entry[1] > best[1] ? entry : best), null)?.[0];
  const receiptMismatch = receiptNo !== '' && mainReceiptNo !== undefined && receiptNo !== mainReceiptNo;

  // 必填的期別需要有資料（上傳辨識成功或手填皆可）才能前進；
  // 欄位載入失敗（如該年度尚未支援）時沒有欄位可填，放行以免使用者卡死
  const blocked = spec.required && !error && !isPageFilled(state.reports, reportKey);

  const nav = {
    onPrev: () => dispatch({ type: 'PREV_STEP' }),
    onNext,
    nextLabel,
    nextDisabled: blocked,
    // 必填期別尚無資料時，提示放在底部上一頁／下一頁旁，按鈕反灰的原因就在手邊
    hint: blocked ? (spec.period ? '此期別為必填，請上傳申報書檔案後再前往下一頁' : '此期別為必填，請上傳文件或手動輸入資料後再前往下一頁') : undefined,
  };

  return (
    <>
      <StepPageHeader
        kicker={kicker}
        title={title}
        badges={badges}
        nav={nav}
        progress={progress}
        titleAction={<FormPaperPreview formCode={formCode} />}
        aside={showIdentify && <FormIdentifyPanel required={spec.required} vatPeriod={!!spec.period} pageKey={spec.key} />}
      >
        {spec.period && (
          // 申報書種類二選一：預設 401，該期有免稅銷售額改用 403（上傳辨識到另一種也會自動切換）
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <span className='text-sm font-medium text-neutral-dark'>申報書種類</span>
            <SegmentedControl<VatFormCode>
              fit
              size='sm'
              options={[
                { value: 'VAT_401', label: '401' },
                { value: 'VAT_403', label: '403' },
              ]}
              value={formCode === 'VAT_403' ? 'VAT_403' : 'VAT_401'}
              onChange={value => dispatch({ type: 'SET_VAT_CHOICE', payload: { pageKey: spec.key, formCode: value } })}
            />
            <span className='text-[13px] text-neutral-mid'>該期有免稅銷售額，則使用 403 申報書</span>
          </div>
        )}
        {spec.period && <VatPeriodPicker />}
        {spec.period && vatUploads[spec.key] && <UploadedFilePreview file={vatUploads[spec.key]} />}
        {/* 封面頁不是可略過的文件，只在步驟 4 的選填頁提示 */}
        {!spec.required && spec.key !== 'CIT_COVER' && (
          <p className='text-[13px] text-neutral-mid'>此份為選填，沒有這份文件可直接按「{nextLabel}」略過，確認頁會列出未填項目，可再回來補。</p>
        )}
      </StepPageHeader>

      {receiptMismatch && (
        <div role='alert' className='flex items-start gap-2.5 rounded-lg border border-semantic-error/40 bg-semantic-error/5 px-4 py-3'>
          <TriangleAlert size={18} className='mt-0.5 shrink-0 text-semantic-error' />
          <p className='text-sm text-neutral-dark'>
            這一頁的收件編號（{receiptNo}）和其他頁（{mainReceiptNo}）不同。同一年度的申報書收件編號應該一致，請確認這一頁是不是民國 {taxYear} 年度的申報書。
          </p>
        </div>
      )}

      {loading && <p className='text-sm text-neutral-mid'>表單欄位載入中…</p>}
      {error && (
        <SectionCard>
          <p className='text-sm text-semantic-error'>{error}</p>
          <Button variant='ghost' onClick={retry} className='self-start'>
            重新載入
          </Button>
        </SectionCard>
      )}

      {rawPage && store && (
        <>
          {formCode === BALANCE_SHEET_CODE ? (
            <BalanceSheetView page={rawPage} sections={sections} />
          ) : (
            <>
              <PaperForm sections={sections} store={store} />
              {spec.period && !!rawPage.fieldMap.TAX_PAYABLE && <VatResultCard reportId={reportKey} />}
              {rawPage.table && (
                <PaperStoreProvider value={store}>
                  <SectionCard title='明細'>
                    <ReportTable table={rawPage.table} />
                  </SectionCard>
                </PaperStoreProvider>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
