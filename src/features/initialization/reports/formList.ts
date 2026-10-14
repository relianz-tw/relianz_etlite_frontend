import type { SettlementReportId } from '../state/initializationReducer';

/** 西元年換算民國年的差值 */
const ROC_YEAR_OFFSET = 1911;

export interface FormListItem {
  /** metadata API 的文件編號（1–12） */
  formNo: number;
  formCode: SettlementReportId;
  title: string;
  /** 營業稅（401／403）以開帳年為 metadata 年度，營所稅則為開帳年 -1 */
  taxType: 'cit' | 'vat';
  /** 沒有該項目時可略過，供「請先備齊文件」清單標註「（如有）」 */
  optional?: boolean;
}

/** 12 份開帳文件，順序即 formNo；封面（formNo 1）併入步驟 3，其餘 11 份為步驟 4 逐頁核對 */
export const FORM_LIST: FormListItem[] = [
  { formNo: 1, formCode: 'CIT_COVER', title: '營利事業所得稅結算申報書封面', taxType: 'cit' },
  { formNo: 2, formCode: 'CIT_INCOME_TAX', title: '損益及稅額計算表', taxType: 'cit' },
  { formNo: 3, formCode: 'CIT_AMT', title: '營利事業所得基本稅額申報表', taxType: 'cit' },
  { formNo: 4, formCode: 'CIT_BALANCE_SHEET', title: '資產負債表', taxType: 'cit' },
  { formNo: 5, formCode: 'CIT_INVESTORS', title: '營利事業投資人明細及分配盈餘表', taxType: 'cit' },
  { formNo: 6, formCode: 'CIT_UE', title: '未分配盈餘申報書', taxType: 'cit' },
  { formNo: 7, formCode: 'CIT_WH_RECON', title: '各類給付扣繳、股利憑單金額與申報金額調節表', taxType: 'cit' },
  { formNo: 8, formCode: 'CIT_PROPERTY', title: '財產目錄', taxType: 'cit', optional: true },
  { formNo: 9, formCode: 'CIT_SHAREHOLDERS', title: '股東名簿', taxType: 'cit' },
  { formNo: 10, formCode: 'CIT_UNAMORTIZED', title: '未攤銷費用明細表', taxType: 'cit', optional: true },
  { formNo: 11, formCode: 'VAT_401', title: '營業人銷售額與稅額申報書(401)', taxType: 'vat' },
  { formNo: 12, formCode: 'VAT_403', title: '營業人銷售額與稅額申報書(403)', taxType: 'vat' },
];

export function getFormItem(formCode: SettlementReportId): FormListItem {
  const item = FORM_LIST.find(f => f.formCode === formCode);
  if (!item) throw new Error(`FORM_LIST 找不到 formCode：${formCode}`);
  return item;
}

/**
 * 目前可開帳的年度（民國年）。5/31 前仍算去年、6/1 起算今年
 * （例：2026-10-13 → 2026，即民國 115 年；2026-03-01 → 2025，即民國 114 年）
 */
export function getCurrentOpenYear(now: Date = new Date()): number {
  const isAfterJune = now.getMonth() >= 5; // getMonth() 5 = 6 月
  return (isAfterJune ? now.getFullYear() : now.getFullYear() - 1) - ROC_YEAR_OFFSET;
}

/** 開帳年度可選項目：當期與下一年，皆為民國年 */
export function getOpenYearOptions(now: Date = new Date()): number[] {
  const current = getCurrentOpenYear(now);
  return [current, current + 1];
}

/** 民國年轉西元年，供畫面顯示「2026 年（民國 115）」 */
export function toGregorianYear(rocYear: number): number {
  return rocYear + ROC_YEAR_OFFSET;
}

/** 尚未辨識時某表預設撈的 metadata 年度：營所稅為開帳年 -1（前一年度結算），營業稅 401／403 為開帳年 */
export function getDefaultFormYear(formCode: SettlementReportId, openYear: number): number {
  return getFormItem(formCode).taxType === 'vat' ? openYear : openYear - 1;
}

/** 步驟 4 逐頁核對順序（封面已併入步驟 3，故排除），對應 state.currentReportIndex */
export const REPORT_PAGE_ORDER: SettlementReportId[] = FORM_LIST.filter(f => f.formCode !== 'CIT_COVER').map(f => f.formCode);
