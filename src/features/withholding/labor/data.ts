import type { LaborServiceType, NhiDeclareStatus } from './types';

export const SERVICE_TYPE_OPTIONS: { value: LaborServiceType; label: string; hint: string }[] = [
  { value: '50', label: '兼職 / 臨時人員 (50)', hint: '例：一般約聘員工或臨時人員，固定薪資員工無需填寫勞報單' },
  { value: '9A', label: '專業服務 (9A)', hint: '例：建築師、律師、代書、專利代理人、會計師、土木技師、工匠等專業人士服務' },
  { value: '9B', label: '稿費 (9B)', hint: '例：演講講師稿費、版稅、樂譜、作曲、編劇、漫畫' },
];

export const NATIONALITY_OPTIONS = ['本國籍', '外國籍 (在台滿 183 天)', '外國籍 (在台未滿 183 天)'];

/**
 * 扣繳稅額／二代健保費簡化試算公式（無後端試算 API，比照原專案 withholdingCalculations.ts 的
 * 費率常數，並與勞務報酬單列印頁面印出的費率文字一致）：
 * - 兼職/臨時人員 (50)：5% 扣稅，金額 ≤ 20,000 免扣繳
 * - 專業服務/稿費 (9A/9B)：10% 扣稅，金額 ≤ 20,000 免扣繳
 * - 二代健保：2.11%
 */
const WITHHOLDING_THRESHOLD = 20000;
const NHI_RATE = 0.0211;

export function calculateWithholdingTax(serviceType: LaborServiceType, amount: number): number {
  if (amount <= WITHHOLDING_THRESHOLD) return 0;
  const rate = serviceType === '50' ? 0.05 : 0.1;
  return Math.floor(amount * rate);
}

export function calculateSecondHealthInsuranceFee(amount: number): number {
  return Math.round(amount * NHI_RATE);
}

export function calculateActualPayment(amount: number, withholdingTax: number, secondHealthInsuranceFee: number): number {
  return amount - withholdingTax - secondHealthInsuranceFee;
}

/** 依 serviceType 取得下拉選單顯示用完整標籤，供列表/詳情頁還原顯示 */
export function serviceTypeLabel(serviceType: LaborServiceType): string {
  return SERVICE_TYPE_OPTIONS.find(o => o.value === serviceType)?.label ?? serviceType;
}

/** 有資料的可選年度（西元年），無後端時固定近三年（與 salary/data.ts 的同名函式各自獨立，避免子模組互相依賴） */
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

/** 對外免登入簽署頁連結；basePath '/etlite' 對齊 next.config.js 設定 */
export function signLinkFor(uuid: string): string {
  return `${window.location.origin}/etlite/withholding/labor/sign/${uuid}`;
}
