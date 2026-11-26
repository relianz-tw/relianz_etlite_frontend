import type { StepperItem } from '@/components/ui/Stepper';
import type { InitializationState } from '../state/initializationReducer';

/** 開帳精靈 Stepper 分組：內部有 1~9 共 9 個畫面（步驟 7 是逐頁報表），對外壓縮成 8 組顯示 */
export const INITIALIZATION_STEPPER_ITEMS: StepperItem[] = [
  { label: '合約' },
  { label: '付款資料' },
  { label: '登記資料' },
  { label: '營運狀況' },
  { label: '營所稅' },
  { label: '營業稅' },
  { label: '確認' },
  { label: '完成' },
];

/**
 * 目前所在畫面 → Stepper 分組 index（0-based）。
 * 負責人頁（步驟 5）歸在營運狀況，封面／公司資料（步驟 6）歸在營所稅；
 * 步驟 7 要看目前這一頁：401／403 期別頁算營業稅，其餘算營所稅。
 * 未滿一年沒有營業稅頁，會從營所稅直接跳到確認，營業稅那格自然顯示為已完成。
 */
export function getStepperIndex(state: Pick<InitializationState, 'currentStep' | 'currentReportIndex' | 'reportPages'>): number {
  const { currentStep, currentReportIndex, reportPages } = state;
  if (currentStep <= 1) return 0;
  if (currentStep === 2) return 1;
  if (currentStep === 3) return 2;
  if (currentStep <= 5) return 3;
  if (currentStep === 6) return 4;
  if (currentStep === 7) return reportPages[currentReportIndex]?.period ? 5 : 4;
  if (currentStep === 8) return 6;
  return 7;
}
