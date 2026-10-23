/**
 * 發票期間（民國年 + 雙月期別）顯示與編碼共用工具，供「設定 / 發票簿」與「新增銷項交易」共用，
 * 確保兩處呈現格式一致。可選期別清單改由 GET /ael/invoiceBook/getDate/forSetting 動態取得
 * （見 src/api/invoiceBook.ts listInvoiceBookPeriods），此檔僅負責格式轉換，不再寫死選項。
 */
export interface InvoicePeriodOption {
  /** 下拉選單的 value，格式為 `${民國年}-${期別}`，僅前端內部使用 */
  value: string;
  /** 顯示文字，如「115 年 07 月 - 08 月」 */
  label: string;
  /** 民國年，對應 GET/POST /ael/invoiceBook 的 year */
  rocYear: number;
  /** 雙月期別代碼（1/3/5/7/9/11），對應 GET/POST /ael/invoiceBook 的 phase */
  phase: number;
  /** 是否為當前期（僅來自 forSetting 清單），預設選取與「本期」標示用 */
  isCurrent?: boolean;
}

/** 期別（1/3/5/7/9/11）雙月起訖 → 顯示字串，如「115 年 07 月 - 08 月」 */
export function formatInvoicePeriodLabel(rocYear: number, phase: number): string {
  const start = String(phase).padStart(2, '0');
  const end = String(phase + 1).padStart(2, '0');
  return `${rocYear} 年 ${start} 月 - ${end} 月`;
}

/** GET /ael/invoiceBook/getDate/forSetting 回應項目 → 下拉選單選項 */
export function toInvoicePeriodOption(period: { year: number; phase: number; count?: number; isCurrent?: boolean }): InvoicePeriodOption {
  // 後綴：當前期標「本期」，有紙本發票本數時標「N 本」，如「115 年 07 月 - 08 月（本期、2 本）」
  const notes = [period.isCurrent ? '本期' : '', period.count !== undefined ? `${period.count} 本` : ''].filter(Boolean);
  const label = formatInvoicePeriodLabel(period.year, period.phase);
  return {
    value: `${period.year}-${period.phase}`,
    label: notes.length > 0 ? `${label}（${notes.join('、')}）` : label,
    rocYear: period.year,
    phase: period.phase,
    isCurrent: period.isCurrent,
  };
}

/** 下拉預設選項：優先當前期，沒有（或未提供 isCurrent）才取排序後的第一個 */
export function pickDefaultInvoicePeriod(options: InvoicePeriodOption[]): InvoicePeriodOption | undefined {
  return options.find(option => option.isCurrent) ?? options[0];
}

/** 期別選項依 rocYear、phase 由新到舊排序，供下拉選單「最新在最上方」使用 */
export function sortInvoicePeriodOptions(options: InvoicePeriodOption[]): InvoicePeriodOption[] {
  return [...options].sort((a, b) => b.rocYear - a.rocYear || b.phase - a.phase);
}

/** 期別 → 該期起訖日（含頭尾）：phase 為單數月，迄日取下一個月的最後一天 */
export function phaseToDateRange(rocYear: number, phase: number): [Date, Date] {
  const year = rocYear + 1911;
  return [new Date(year, phase - 1, 1), new Date(year, phase + 1, 0)];
}

/** 起訖日剛好對應某一個雙月期別才回傳 rocYear／phase，其餘（自訂區間、跨期、單月）一律 null */
export function dateRangeToPhase(from: Date, to: Date): { rocYear: number; phase: number } | null {
  const phase = from.getMonth() + 1;
  if (phase % 2 === 0) return null;
  const [start, end] = phaseToDateRange(from.getFullYear() - 1911, phase);
  const same = (a: Date, b: Date) => a.getTime() === b.getTime();
  return same(from, start) && same(to, end) ? { rocYear: from.getFullYear() - 1911, phase } : null;
}

/** 下拉選單 value（`${民國年}-${期別}`）→ 查詢用的 rocYear／phase；格式不符時回傳 null */
export function parseInvoicePeriodValue(value: string): { rocYear: number; phase: number } | null {
  const match = /^(\d+)-(\d+)$/.exec(value);
  if (!match) return null;
  return { rocYear: Number(match[1]), phase: Number(match[2]) };
}
