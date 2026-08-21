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
}

/** 期別（1/3/5/7/9/11）雙月起訖 → 顯示字串，如「115 年 07 月 - 08 月」 */
export function formatInvoicePeriodLabel(rocYear: number, phase: number): string {
  const start = String(phase).padStart(2, '0');
  const end = String(phase + 1).padStart(2, '0');
  return `${rocYear} 年 ${start} 月 - ${end} 月`;
}

/** GET /ael/invoiceBook/getDate/forSetting 回應項目 → 下拉選單選項 */
export function toInvoicePeriodOption(period: { year: number; phase: number }): InvoicePeriodOption {
  return {
    value: `${period.year}-${period.phase}`,
    label: formatInvoicePeriodLabel(period.year, period.phase),
    rocYear: period.year,
    phase: period.phase,
  };
}

/** 下拉選單 value（`${民國年}-${期別}`）→ 查詢用的 rocYear／phase；格式不符時回傳 null */
export function parseInvoicePeriodValue(value: string): { rocYear: number; phase: number } | null {
  const match = /^(\d+)-(\d+)$/.exec(value);
  if (!match) return null;
  return { rocYear: Number(match[1]), phase: Number(match[2]) };
}
