/** metadata 的區塊代碼（sectionCode）→ 中文區塊標題，供畫面分組標題用；查無對照時退回顯示代碼 */
const SECTION_TITLE_MAP: Record<string, string> = {
  HEADER: '基本資料',
  ORG: '組織型態',
  FILING: '申報種類',
  FLAGS: '其他勾選',
  OUTPUT_TAXABLE: '銷項－應稅',
  OUTPUT_ZERO: '銷項－零稅率',
  OUTPUT_TOTAL: '銷售額總計',
  INPUT_DEDUCTIBLE: '進項－得扣抵',
  INPUT_OTHER: '進項－其他',
  TAX_COMPUTE: '稅額計算',
  RECEIPT: '收件資訊',
  DECLARANT: '申報人資訊',
  OPERATING: '營業損益',
  OPEX: '營業費用',
  NONOP: '營業外損益',
  TAXABLE: '課稅所得計算',
  TAX: '稅額計算',
  RECON: '營業收入調節',
  RATES: '稅率',
  BASE: '基本所得額計算',
  EXEMPT: '免稅所得',
  ASSET_CA: '流動資產',
  ASSET_NCA: '非流動資產',
  LIAB_CL: '流動負債',
  LIAB_NCL: '非流動負債',
  EQUITY: '權益',
  TOTAL: '合計',
  SUMMARY: '彙總資訊',
  EARNINGS: '盈餘計算',
  PAY: '給付項目',
  PAY_NOTE: '給付備註',
  INCOME: '收入項目',
  FOREIGN_TOTAL: '外籍優惠合計',
  RELATED: '關係人揭露',
};

/** 沒有 sectionCode 的欄位歸入的預設區塊 */
export const DEFAULT_SECTION_CODE = 'OTHER';

export function getSectionTitle(sectionCode: string): string {
  if (sectionCode === DEFAULT_SECTION_CODE) return '其他欄位';
  return SECTION_TITLE_MAP[sectionCode] ?? sectionCode;
}
