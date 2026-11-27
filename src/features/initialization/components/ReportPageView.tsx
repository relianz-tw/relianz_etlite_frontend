'use client';

import { useInitialization } from '../state/InitializationContext';
import { useFormMetadata } from '../hooks/useFormMetadata';
import { getFormItem, omitFields, type VatFormCode, isPageFilled, lockedCoverValues, resolveReportPage, type ReportPageSpec } from '../reports';
import { BALANCE_SHEET_DATE_FIELD_KEY, getBalanceSheetDateLabel, getBalanceSheetDateValue, getBalanceSheetDateYear } from '../reports/balanceSheetLayout';
import { FormPaperPreview } from './FormPaperPreview';
import { ReferenceLayout } from './ReferencePanel';
import { useReference } from '../reference/ReferenceContext';
import { formatPageRange } from '../reference/pageRange';
import { PAPER_PREVIEWS } from '../reports/paperPreviews';
import { SourceUploadSection } from './SourceUploadSection';
import { BalanceSheetView } from './BalanceSheetView';
import { PaperForm } from './paper/PaperForm';
import { PaperStoreProvider } from './paper/PaperStore';
import { useInitPaperStore } from './paper/useInitPaperStore';
import { VatResultCard } from './VatResultCard';
import { VatPeriodPicker } from './VatPeriodPicker';
import { Info, TriangleAlert } from 'lucide-react';
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

/** 統一編號欄位：對不上的提醒要把它和其他欄位分開處理（它可能同時和登記事項表、開帳公司都不同） */
const VAT_NO_FIELD_KEY = 'HDR_VAT_NO';

/** 公司基本資料欄位鎖定與更正入口的說明（提醒框有／沒有對不上的事項時都要講） */
const LOCKED_FIELDS_NOTE = '公司基本資料帶自登記事項表，這幾格不開放修改。要更正請回到「登記資料」重新上傳登記事項表。';

/** 封面「股票發行狀況」勾選群組：只有股份有限公司才有股票發行，其他組織型態整組不顯示 */
const STOCK_GROUP_CODE = 'STOCK';

/** 損益及稅額計算表的「組織種類」不提供這四個選項（無限、兩合、合作社、有限合夥）：畫面不顯示，欄位值不受影響 */
const INCOME_TAX_HIDDEN_ORG_KEYS = ['ORG_3_UNLIMITED', 'ORG_4_JOINT', 'ORG_L_COOP', 'ORG_M_LP'];

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
/** 「下一頁」被擋住的原因：營業稅期別頁要分清楚缺的是申報書檔案、金額，還是兩個都缺 */
function blockedHint(isVatPeriod: boolean, needsFile: boolean, needsData: boolean): string {
  if (!isVatPeriod) return '此期別為必填，請上傳文件或手動輸入資料後再前往下一頁';
  if (needsFile && needsData) return '此期別為必填，請上傳申報書檔案後再前往下一頁';
  if (needsFile) return '金額已填好，還差這一期的申報書檔案，上傳後即可前往下一頁';
  return '申報書檔案已上傳，請確認本期金額已填寫後再前往下一頁';
}

export function ReportPageView({ spec, taxYear, kicker, progress, showIdentify, nextLabel, onNext }: ReportPageViewProps) {
  const { state, dispatch, vatUploads, isVatFileRequired } = useInitialization();
  const { sourceFiles } = useReference();
  // 營業稅期別頁依使用者選的 401 或 403（預設 401）決定表單與資料 key，營所稅頁固定
  const { formCode, reportKey } = resolveReportPage(spec, state.vatChoices);
  const { formNo, title: fallbackTitle } = getFormItem(formCode);
  const { page: rawPage, loading, error, retry } = useFormMetadata(formNo, taxYear);
  // 標題以 metadata 的文件名稱為準，載入前先用內建名稱（年度在下面併進去）
  const baseTitle = rawPage?.title ?? fallbackTitle;

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

  // 登記事項表辨識過之後，公司識別欄位以它為準：這一頁上的那些欄位畫成唯讀（欄位還是要看得到，所以不從 sections 拿掉）
  // 只鎖「登記事項表自己有值」的欄位，不然會把一個空白或錯值鎖住讓人改不掉
  const lockedValues = lockedCoverValues(state.reports);
  const lockedKeys = useMemo(
    () => (lockedValues && rawPage ? Object.keys(rawPage.fieldMap).filter(key => key in lockedValues) : []),
    // lockedValues 每次 render 都是新物件，用內容當依賴
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(lockedValues), rawPage],
  );
  // 這一頁上「申報書辨識值與登記事項表對不上」的欄位（值已保留登記事項表的，這裡只提醒）
  const pageConflicts = lockedKeys.flatMap(key => {
    const conflict = state.registrationConflicts[key];
    return conflict ? [{ key, label: rawPage?.fieldMap[key]?.label ?? key, ...conflict }] : [];
  });

  // 區塊、欄位、分組完全依 metadata，只把自動填入的欄位拿掉（不給使用者輸入）
  const autoKeyList = autoKeys.join(',');
  const hideStock = formCode === 'CIT_COVER' && state.orgType !== 'share';
  const sections = useMemo(() => {
    if (!rawPage) return [];
    const stockKeys = hideStock ? (rawPage.groupMap[STOCK_GROUP_CODE]?.fields ?? []).map(f => f.key) : [];
    const orgKeys = formCode === 'CIT_INCOME_TAX' ? INCOME_TAX_HIDDEN_ORG_KEYS : [];
    return omitFields(rawPage.sections, [...autoKeyList.split(','), ...stockKeys, ...orgKeys]);
  }, [rawPage, autoKeyList, hideStock, formCode]);
  const lockedKeyList = lockedKeys.join(',');
  const readOnlyKeys = useMemo(() => [...autoKeyList.split(','), ...lockedKeyList.split(',')].filter(Boolean), [autoKeyList, lockedKeyList]);
  const store = useInitPaperStore(reportKey, rawPage, readOnlyKeys);

  // 年度直接寫進標題（「民國 114 年度營利事業所得稅結算申報書封面」），不另外掛年度徽章：
  // 未分配盈餘申報書是前一年度的盈餘（紙本標題「113 年度未分配盈餘申報書」）；
  // 資產負債表是某一天的狀態，年度取基準日（損益表所得期間迄，沒填視為 12 月 31 日）那一年；
  // 401／403 的期別已在副標與期別卡片上，標題不重複標年度
  const titleYear = formCode === BALANCE_SHEET_CODE ? getBalanceSheetDateYear(taxYear, incomePeriodEnd) : formCode === 'CIT_UE' ? taxYear - 1 : taxYear;
  const title = spec.period ? baseTitle : `民國 ${titleYear} 年度${baseTitle}`;

  // 資產負債表的徽章留著基準日（那是某一天，不是年度，標題看不出來）；其餘只剩紙本頁碼
  const paperPage = PAPER_PREVIEWS[formCode]?.paperPage;
  const badges = spec.period
    ? undefined
    : [
        ...(formCode === BALANCE_SHEET_CODE ? [getBalanceSheetDateLabel(taxYear, incomePeriodEnd)] : []),
        ...(paperPage ? [`紙本${paperPage}`] : []),
      ];

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

  // 統一編號：以付款資料帶進來的系統登記資料為定本（見 reducer 的 payment 註解），
  // 這一頁的申報書統編和它不同就提醒——辨識來的申報書有可能根本是別間公司的
  const pageVatNo = String(reportFields?.HDR_VAT_NO?.value ?? '').trim();
  const registeredTaxId = state.payment.taxId.trim();
  const vatNoMismatch = pageVatNo !== '' && registeredTaxId !== '' && pageVatNo !== registeredTaxId;

  // 這一頁所有「對不上」的事項併成一塊提醒，一個欄位只講一次：
  // 統一編號可能同時在「申報書辨識值 vs 登記事項表」與「登記事項表 vs 開帳公司」兩邊不符，
  // 分開講會變成兩個紅框各報一次統編，使用者只看到一片紅卻看不懂到底哪個才是對的
  const vatConflict = pageConflicts.find(conflict => conflict.key === VAT_NO_FIELD_KEY);
  const mismatchRows: string[] = [];
  if (vatConflict || vatNoMismatch) {
    const pageValueLabel = lockedKeys.includes(VAT_NO_FIELD_KEY) ? '登記事項表' : '這一頁';
    const sources = [
      ...(vatConflict ? [`這份文件「${vatConflict.identified}」`, `登記事項表「${vatConflict.registered}」`] : [`${pageValueLabel}「${pageVatNo}」`]),
      ...(vatNoMismatch ? [`這次開帳的公司「${registeredTaxId}」`] : []),
    ];
    mismatchRows.push(`統一編號：${sources.join('／')}`);
  }
  for (const conflict of pageConflicts) {
    if (conflict.key === VAT_NO_FIELD_KEY) continue;
    mismatchRows.push(`${conflict.label}：這份文件「${conflict.identified}」／登記事項表「${conflict.registered}」`);
  }
  if (receiptMismatch) {
    mismatchRows.push(`收件編號：這一頁「${receiptNo}」／其他頁「${mainReceiptNo}」，同一年度的申報書收件編號應該一致`);
  }

  // 必填的期別：營業稅申報書檔案與金額資料兩個都要有才能前進（金額可辨識帶入或手填）。
  // 欄位載入失敗（如該年度尚未支援）時沒有欄位可填，放行以免使用者卡死
  const needsData = !isPageFilled(state.reports, reportKey);
  // 原件還沒從後端撈回來、或撈失敗時不以「沒有原件」擋人（見 isVatFileRequired）
  const needsVatFile = !!spec.period && isVatFileRequired(spec.key) && !vatUploads[spec.key];
  const blocked = spec.required && !error && (needsData || needsVatFile);

  // 底部進度列右側的小字：這一頁表單辨識自哪個檔案、在原件的第幾頁（還沒辨識過的頁面不顯示）
  const formSource = state.formSources[reportKey];
  const sourceFile = spec.period ? vatUploads[spec.key] : sourceFiles.find(s => s.id === formSource?.sourceId)?.file;
  const sourceNote = formSource && sourceFile ? `${sourceFile.name}・原件${formatPageRange(formSource.pages)}` : undefined;
  // 這一頁有沒有辨識過的原件可以對照：營業稅看該期上傳的檔案，營所稅看辨識後記下的來源
  const hasReference = spec.period ? !!vatUploads[spec.key] : !!formSource;

  const nav = {
    onPrev: () => dispatch({ type: 'PREV_STEP' }),
    onNext,
    nextLabel,
    nextDisabled: blocked,
    // 按鈕反灰的原因就在手邊：提示放在底部上一頁／下一頁旁，並說清楚缺的是檔案還是金額
    hint: blocked ? blockedHint(!!spec.period, needsVatFile, needsData) : undefined,
  };

  return (
    <>
      <StepPageHeader
        kicker={kicker}
        title={title}
        badges={badges}
        nav={nav}
        progress={progress && { ...progress, title, note: sourceNote }}
        titleAction={
          <>
            <FormPaperPreview formCode={formCode} />
          </>
        }
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
        {/* 上傳區與已上傳檔案是同一塊：沒檔案畫虛線上傳框，有檔案改以檔案列為主、旁邊留「新增檔案」，底下接文件備齊清單 */}
        {showIdentify && <SourceUploadSection pageKey={spec.key} required={spec.required} vatPeriod={!!spec.period} />}
        {/* 封面頁不是可略過的文件，只在步驟 4 的選填頁提示 */}
        {!spec.required && spec.key !== 'CIT_COVER' && (
          <p className='text-[13px] text-neutral-mid'>此份為選填，沒有這份文件可直接按「{nextLabel}」略過，確認頁會列出未填項目，可再回來補。</p>
        )}
      </StepPageHeader>

      {mismatchRows.length > 0 ? (
        <div role='alert' className='flex items-start gap-2.5 rounded-lg border border-semantic-error/40 bg-semantic-error/5 px-4 py-3'>
          <TriangleAlert size={18} className='mt-0.5 shrink-0 text-semantic-error' />
          <div className='flex min-w-0 flex-col gap-1 text-sm text-neutral-dark'>
            <p>這一頁有{mismatchRows.length > 1 ? '幾個' : '一個'}地方對不上，請確認是不是傳錯文件：</p>
            <ul className='flex flex-col gap-0.5'>
              {mismatchRows.map(row => (
                <li key={row} className='break-words'>
                  {row}
                </li>
              ))}
            </ul>
            {lockedKeys.length > 0 && <p className='text-[13px] text-neutral-mid'>畫面上保留的是登記事項表的內容。{LOCKED_FIELDS_NOTE}</p>}
          </div>
        </div>
      ) : (
        lockedKeys.length > 0 && (
          <div className='flex items-start gap-2.5 rounded-lg border border-brand-blue/30 bg-brand-blue/5 px-4 py-3'>
            <Info size={18} className='mt-0.5 shrink-0 text-brand-blue' />
            <p className='text-sm text-neutral-dark'>{LOCKED_FIELDS_NOTE}</p>
          </div>
        )
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
        // 401／403 的對照原件是該期自己上傳的檔案；營所稅頁用上傳列表（依欄位位置選檔）
        <ReferenceLayout reportKey={reportKey} hasReference={hasReference} file={spec.period ? vatUploads[spec.key] : undefined}>
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
        </ReferenceLayout>
      )}
    </>
  );
}
