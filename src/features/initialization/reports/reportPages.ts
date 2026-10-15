import { CIT_PAGE_ORDER, getDefaultFormYear } from './formList';
import type { ReportData, SettlementReportId } from '../state/initializationReducer';

/** 西元年換算民國年的差值 */
const ROC_YEAR_OFFSET = 1911;

/** 營業稅雙月期別的起始月（1-2、3-4、5-6、7-8、9-10、11-12 月） */
const PHASES = [1, 3, 5, 7, 9, 11];

export type VatFormCode = 'VAT_401' | 'VAT_403';

/**
 * 步驟 4 的一個頁面。營所稅各表的 key 即 formCode；營業稅依期別一期一頁，key 為 `VAT:115-3`（民國年-期別起始月），
 * 每一期使用者擇一填 401 或 403（見 state.vatChoices），兩種申報書的資料各自存在 `VAT_401:115-3`／`VAT_403:115-3`。
 */
export interface ReportPageSpec {
  key: string;
  /** 營所稅為該表 formCode；營業稅期別頁僅為占位的 VAT_401，實際用哪一種看 state.vatChoices（使用者擇一，預設 401） */
  formCode: SettlementReportId;
  /** 該頁 metadata 年度：營業稅為期別所屬民國年，營所稅為預設年度（辨識後以 state.reportYears 為準） */
  taxYear: number;
  /** 僅營業稅期別頁有 */
  period?: { rocYear: number; phase: number };
  required: boolean;
}

export interface VatPeriod {
  rocYear: number;
  phase: number;
  required: boolean;
}

/** 營業稅期別頁的 key */
export function getVatPageKey(rocYear: number, phase: number): string {
  return `VAT:${rocYear}-${phase}`;
}

/** 某一期選定的申報書（401 或 403）實際存放資料的 state.reports key */
export function getVatReportKey(formCode: VatFormCode, period: { rocYear: number; phase: number }): string {
  return `${formCode}:${period.rocYear}-${period.phase}`;
}

/** 解析一頁實際使用的申報書與資料 key：營業稅期別頁依使用者選擇的 401／403（預設 401）；其餘頁固定 */
export function resolveReportPage(spec: ReportPageSpec, vatChoices: Record<string, VatFormCode>): { formCode: SettlementReportId; reportKey: string } {
  if (!spec.period) return { formCode: spec.formCode, reportKey: spec.key };
  const formCode = vatChoices[spec.key] ?? 'VAT_401';
  return { formCode, reportKey: getVatReportKey(formCode, spec.period) };
}

/** 「民國 115 年 03–04 月」 */
export function formatPeriodLabel(rocYear: number, phase: number): string {
  return `民國 ${rocYear} 年 ${String(phase).padStart(2, '0')}–${String(phase + 1).padStart(2, '0')} 月`;
}

/**
 * 依開帳年度與進入日，算出要逐期上傳的 401 期別：
 * - 從開帳年度起到進入日所在年度，每期依進入日判斷：尚未開始的不出現；
 * - 開帳年度內「已結束」的期別必填，「進行中」的選填；
 * - 開帳年度之後年度的期別（已結束或進行中）一律選填。
 */
export function buildVatPeriods(openYear: number, today: Date): VatPeriod[] {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const periods: VatPeriod[] = [];
  for (let rocYear = openYear; rocYear <= t.getFullYear() - ROC_YEAR_OFFSET; rocYear++) {
    const gregorianYear = rocYear + ROC_YEAR_OFFSET;
    for (const phase of PHASES) {
      const start = new Date(gregorianYear, phase - 1, 1);
      // new Date(y, m, 0) 是「第 m 個月（1-based）的最後一天」，期別第二個月為 phase + 1，故這裡取到該期結束日
      const end = new Date(gregorianYear, phase + 1, 0);
      if (t < start) continue;
      periods.push({ rocYear, phase, required: rocYear === openYear && t > end });
    }
  }
  return periods;
}

/**
 * 步驟 4 要逐頁核對的所有頁面，順序：營所稅各表 → 營業稅各期（由舊到新，每期擇一填 401 或 403）。
 */
export function buildReportPages({ openYear, today }: { openYear: number; today: Date }): ReportPageSpec[] {
  const cit: ReportPageSpec[] = CIT_PAGE_ORDER.map(formCode => ({
    key: formCode,
    formCode,
    taxYear: getDefaultFormYear(formCode, openYear),
    required: false,
  }));

  const vat: ReportPageSpec[] = buildVatPeriods(openYear, today).map(p => ({
    key: getVatPageKey(p.rocYear, p.phase),
    formCode: 'VAT_401',
    taxYear: p.rocYear,
    period: { rocYear: p.rocYear, phase: p.phase },
    required: p.required,
  }));

  return [...cit, ...vat];
}

/** 依年度分組描述期別，如「民國 114 年 1–2、3–4 月；民國 115 年 1–2 月」 */
export function describePeriods(specs: ReportPageSpec[]): string {
  const byYear = new Map<number, string[]>();
  for (const spec of specs) {
    if (!spec.period) continue;
    const list = byYear.get(spec.period.rocYear) ?? [];
    list.push(`${spec.period.phase}–${spec.period.phase + 1}`);
    byYear.set(spec.period.rocYear, list);
  }
  return Array.from(byYear, ([year, list]) => `民國 ${year} 年 ${list.join('、')} 月`).join('；');
}

/**
 * 某份資料是否「有資料」：除了自動帶入或跨文件同步的 HDR_ 識別欄位外，有任何非空且非 0 的欄位值，或有明細列。
 * 必填頁用它判斷能不能前進（上傳辨識成功或手填皆算）；reportKey 為實際存放資料的 key（見 resolveReportPage）。
 */
export function isPageFilled(reports: Record<string, ReportData>, reportKey: string): boolean {
  const report = reports[reportKey];
  if (!report) return false;
  if (report.rows.length > 0) return true;
  return Object.entries(report.fields).some(([key, field]) => !key.startsWith('HDR_') && field.value !== '' && field.value !== 0);
}
