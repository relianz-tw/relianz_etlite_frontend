import type { StepperItem } from '@/components/ui/Stepper';
import type { InitializationState } from '../state/initializationReducer';

/** 開帳精靈 Stepper 分組：內部有 1/2/3/4(x5)/5/6 共 9 個畫面，對外壓縮成 6 組顯示 */
export const INITIALIZATION_STEPPER_ITEMS: StepperItem[] = [
  { label: '合約' },
  { label: '營運狀況' },
  { label: '營所稅' },
  { label: '營業稅' },
  { label: '確認' },
  { label: '完成' },
];

/**
 * 目前所在畫面 → Stepper 分組 index（0-based）。
 * 步驟 4 要看目前這一頁：401／403 期別頁算營業稅，登記資料與負責人頁歸在確認，其餘（封面、營所稅各表）算營所稅。
 * 未滿一年沒有營業稅頁，會從營所稅直接跳到確認，營業稅那格自然顯示為已完成。
 */
export function getStepperIndex(state: Pick<InitializationState, 'currentStep' | 'currentReportIndex' | 'reportPages'>): number {
  const { currentStep, currentReportIndex, reportPages } = state;
  if (currentStep <= 1) return 0;
  if (currentStep === 2) return 1;
  if (currentStep === 3) return 2;
  if (currentStep === 4) {
    const page = reportPages[currentReportIndex];
    if (page?.period) return 3;
    if (page?.kind) return 4;
    return 2;
  }
  if (currentStep === 5) return 4;
  return 5;
}
