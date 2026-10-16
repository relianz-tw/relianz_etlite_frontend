/**
 * 資產負債表（CIT_BALANCE_SHEET）T 字帳版面配置：區塊（sectionCode）與其小計欄位的對照。
 * 欄位清單仍由 metadata 動態取得（formNo 4 為標準），這裡只指出哪個欄位是區塊小計／總額。
 */
export interface BalanceBlockConfig {
  /** metadata 的 sectionCode */
  sectionKey: string;
  /** 區塊標題（metadata 只有 sectionCode，沒有中文標題） */
  title: string;
  /** 該區塊的小計欄位（顯示於區塊底部） */
  subtotalKey: string;
}

export const BALANCE_BLOCKS = {
  currentAssets: { sectionKey: 'ASSET_CA', title: '流動資產', subtotalKey: 'BS_1100' },
  nonCurrentAssets: { sectionKey: 'ASSET_NCA', title: '非流動資產', subtotalKey: 'BS_1200' },
  currentLiabilities: { sectionKey: 'LIAB_CL', title: '流動負債', subtotalKey: 'BS_2100' },
  nonCurrentLiabilities: { sectionKey: 'LIAB_NCL', title: '非流動負債', subtotalKey: 'BS_2200' },
  equity: { sectionKey: 'EQUITY', title: '權益', subtotalKey: 'BS_3000' },
} satisfies Record<string, BalanceBlockConfig>;

export const ASSET_TOTAL_KEY = 'BS_1000';
/** 負債總額（注意 BS_2900 是「其他非流動負債」明細，不是合計） */
export const LIABILITY_TOTAL_KEY = 'BS_2000';
export const LIABILITY_EQUITY_TOTAL_KEY = 'BS_9000';

/** 資產負債表日欄位：由頁面依封面會計年度結束月自動填入、不給使用者輸入 */
export const BALANCE_SHEET_DATE_FIELD_KEY = 'HDR_BS_DATE';

/**
 * 解析日期字串為西元年月日。接受 YYYY-MM-DD，以及辨識結果可能保留的民國年寫法（114-12-31、114/12/31、114年12月31日）；
 * 小於 1911 的年份視為民國年。無法解析回傳 null。
 */
function parseDate(value: string | number | undefined): { gregorianYear: number; month: number; day: number } | null {
  const match = /^\s*(\d{2,4})\s*[-/年.]\s*(\d{1,2})\s*[-/月.]\s*(\d{1,2})/.exec(String(value ?? ''));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { gregorianYear: year < 1911 ? year + 1911 : year, month, day };
}

/**
 * 資產負債表基準日：取損益表的「所得期間迄」（CIT_INCOME_TAX.HDR_PERIOD_END）；尚未填或無法解析時，
 * 預設該年度的 12 月 31 日。
 */
function getBalanceSheetEndDate(taxYear: number, incomePeriodEnd: string | number | undefined): { gregorianYear: number; month: number; day: number } {
  return parseDate(incomePeriodEnd) ?? { gregorianYear: taxYear + 1911, month: 12, day: 31 };
}

/** 標籤文字，如「民國 114 年 12 月 31 日」 */
export function getBalanceSheetDateLabel(taxYear: number, incomePeriodEnd: string | number | undefined): string {
  const { gregorianYear, month, day } = getBalanceSheetEndDate(taxYear, incomePeriodEnd);
  return `民國 ${gregorianYear - 1911} 年 ${month} 月 ${day} 日`;
}

/** 寫入 HDR_BS_DATE 的值（YYYY-MM-DD，與其他日期欄位格式一致） */
export function getBalanceSheetDateValue(taxYear: number, incomePeriodEnd: string | number | undefined): string {
  const { gregorianYear, month, day } = getBalanceSheetEndDate(taxYear, incomePeriodEnd);
  return `${gregorianYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
