import type { CategoryCode, EarnerType, NhiDeclareStatus } from './types';

/** 各類扣繳類別完整清單，供篩選下拉與表格顯示標籤使用 */
export const CATEGORY_OPTIONS: { code: CategoryCode; label: string }[] = [
  { code: '51', label: '租金' },
  { code: '9A', label: '執行業務' },
  { code: '9B', label: '稿費' },
  { code: '53', label: '權利金' },
  { code: '5B', label: '其他利息' },
  { code: '91', label: '中獎' },
  { code: '93', label: '退職' },
  { code: '97', label: '受贈' },
  { code: '92', label: '其他所得' },
];

/** 「新增扣繳資料」彈窗選項：執行業務／稿費合併為一顆按鈕，進表單後由「所得類別」欄位切換（比照原專案行為） */
export const ADD_CATEGORY_OPTIONS: { code: CategoryCode; label: string }[] = [
  { code: '51', label: '租金 (51)' },
  { code: '9A', label: '執行業務 / 稿費 (9A / 9B)' },
  { code: '53', label: '權利金 (53)' },
  { code: '5B', label: '其他利息 (5B)' },
  { code: '91', label: '中獎 (91)' },
  { code: '93', label: '退職 (93)' },
  { code: '97', label: '受贈 (97)' },
  { code: '92', label: '其他所得 (92)' },
];

export function categoryLabel(code: CategoryCode): string {
  return CATEGORY_OPTIONS.find(o => o.code === code)?.label ?? code;
}

/**
 * 業別代號選單，無後端「執行業務/稿費業別代號」查詢 API 時，
 * 各挑選幾個常見業別作為示範選項，待後端就緒後改為串接真實清單。
 */
export const PRACTICE_TYPE_OPTIONS: Record<'9A' | '9B', { code: string; name: string }[]> = {
  '9A': [
    { code: '9A01', name: '律師' },
    { code: '9A02', name: '會計師' },
    { code: '9A03', name: '建築師' },
    { code: '9A04', name: '醫師' },
    { code: '9A99', name: '其他自由職業' },
  ],
  '9B': [
    { code: '9B01', name: '版稅' },
    { code: '9B02', name: '稿費' },
    { code: '9B03', name: '樂譜' },
    { code: '9B04', name: '演講鐘點費' },
  ],
};

/**
 * 扣繳稅額／二代健保費簡化試算公式（無後端試算 API，比照原專案 form.config.ts 的費率常數）：
 * - 扣繳率 10%（其他所得 92 免扣繳），給付金額 ≤ 20,000 免扣繳
 * - 二代健保 2.11%，受贈(97)與其他所得(92)不計二代健保；執行業務/稿費所得人為事務所時亦不計
 */
const WITHHOLDING_RATE = 0.1;
const NHI_RATE = 0.0211;
const WITHHOLDING_THRESHOLD = 20000;
const NO_WITHHOLDING_CATEGORIES = new Set<CategoryCode>(['92']);
const NO_NHI_CATEGORIES = new Set<CategoryCode>(['97', '92']);

/** 是否顯示/計算二代健保欄位；執行業務／稿費所得人為事務所時不計二代健保 */
export function showsNhi(categoryCode: CategoryCode, earnerType: EarnerType): boolean {
  if (NO_NHI_CATEGORIES.has(categoryCode)) return false;
  if ((categoryCode === '9A' || categoryCode === '9B') && earnerType === 'firm') return false;
  return true;
}

export function calculateWithholdingAmount(categoryCode: CategoryCode, grossIncome: number): number {
  if (NO_WITHHOLDING_CATEGORIES.has(categoryCode)) return 0;
  if (grossIncome <= WITHHOLDING_THRESHOLD) return 0;
  return Math.floor(grossIncome * WITHHOLDING_RATE);
}

export function calculateNhiAmount(categoryCode: CategoryCode, grossIncome: number, earnerType: EarnerType): number {
  if (!showsNhi(categoryCode, earnerType)) return 0;
  if (grossIncome <= WITHHOLDING_THRESHOLD) return 0;
  return Math.round(grossIncome * NHI_RATE);
}

export function calculateNetPayment(grossIncome: number, withholdingAmount: number, nhiAmount: number): number {
  return grossIncome - withholdingAmount - nhiAmount;
}

/**
 * 租金反推計算：房東負擔（含稅費）以申報金額為主要輸入正向算出實付金額；
 * 承租人負擔（不含稅費）以實際支付金額為主要輸入反推申報金額，
 * 二代健保欄位吸收無條件捨去造成的尾差，確保「申報金額－扣繳－二代健保＝實際支付金額」恆成立。
 */
export function calculateRentalFromDeclared(declaredAmount: number): { withholdingAmount: number; nhiAmount: number; actualPayment: number } {
  const withholdingAmount = Math.floor(declaredAmount * WITHHOLDING_RATE);
  const nhiAmount = Math.round(declaredAmount * NHI_RATE);
  return { withholdingAmount, nhiAmount, actualPayment: declaredAmount - withholdingAmount - nhiAmount };
}

export function calculateRentalFromActual(actualPayment: number): { declaredAmount: number; withholdingAmount: number; nhiAmount: number } {
  const declaredAmount = Math.round(actualPayment / (1 - WITHHOLDING_RATE - NHI_RATE));
  const withholdingAmount = Math.floor(declaredAmount * WITHHOLDING_RATE);
  return { declaredAmount, withholdingAmount, nhiAmount: declaredAmount - withholdingAmount - actualPayment };
}

/** 有資料的可選年度（西元年），無後端時固定近三年（與 salary/labor 的 data.ts 各自獨立，避免子模組互相依賴） */
export function availableYears(): number[] {
  const currentYear = 2026; // 對齊專案假資料基準年（見 CLAUDE.md currentDate）
  return [currentYear, currentYear - 1, currentYear - 2];
}

const NHI_DECLARE_STATUS_TEXT: Record<NhiDeclareStatus, string> = {
  0: '取消申報',
  1: '已受理',
  2: '系統入檔中',
  3: '入檔成功',
  4: '入檔失敗',
};

export function nhiDeclareStatusText(status: NhiDeclareStatus): string {
  return NHI_DECLARE_STATUS_TEXT[status];
}

export function cycleNhiDeclareStatus(current: NhiDeclareStatus): NhiDeclareStatus {
  const order: NhiDeclareStatus[] = [1, 2, 3, 4];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}
