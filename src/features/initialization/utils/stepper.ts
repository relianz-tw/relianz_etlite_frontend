import type { StepperItem } from '@/components/ui/Stepper';
import { STEP, stepRank, type InitializationState } from '../state/initializationReducer';

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

/**
 * Stepper 分組 index → 要跳去的畫面（該組的第一頁）。
 *
 * **只能跳到走到過的位置**（`canGoToStepGroup`）。步驟 2（付款資料）、4（營運狀況）、6（封面）
 * 按「下一頁」時還會做資料交接（填入封面與 state.company、凍結 reportPages、
 * 把封面欄位整理進 state.company），跳過沒走過的頁會略過這些交接，產生對不起來的資料；
 * 走到過的位置交接早就跑完了，往回或跳回去都不受影響。
 */
export function getStepEntry(
  groupIndex: number,
  reportPages: InitializationState['reportPages'],
): { step: number; reportIndex: number } {
  switch (groupIndex) {
    case 0:
      return { step: STEP.TERMS, reportIndex: 0 };
    case 1:
      return { step: STEP.PAYMENT, reportIndex: 0 };
    case 2:
      return { step: STEP.REGISTRATION_DOCS, reportIndex: 0 };
    case 3:
      return { step: STEP.OPERATING, reportIndex: 0 };
    case 4:
      // 營所稅那一組從封面開始（封面是步驟 6，其餘各表在步驟 7）
      return { step: STEP.COMPANY, reportIndex: 0 };
    case 5:
      return { step: STEP.REPORTS, reportIndex: Math.max(0, reportPages.findIndex(p => p.period)) };
    case 6:
      return { step: STEP.CONFIRM, reportIndex: 0 };
    default:
      return { step: STEP.DONE, reportIndex: 0 };
  }
}

/**
 * 這一組能不能點。條件是該組的進入點不晚於走到過的最遠位置（maxVisited）：
 * 往回一定可以，往前只能回到自己走過的地方。完成頁之後整個流程結束，一律不給跳。
 */
export function canGoToStepGroup(
  groupIndex: number,
  state: Pick<InitializationState, 'currentStep' | 'currentReportIndex' | 'reportPages' | 'maxVisited'>,
): boolean {
  if (state.currentStep === STEP.DONE) return false;
  // 未滿一年沒有營業稅頁，那一格的進入點會落在營所稅的第一份報表，點了等於跳錯地方
  if (groupIndex === 5 && !state.reportPages.some(page => page.period)) return false;
  const entry = getStepEntry(groupIndex, state.reportPages);
  if (stepRank(entry) > stepRank(state.maxVisited)) return false;
  // 同一組內跳沒有意義（營業稅組內換期別走期別卡片，不走步驟列）
  return groupIndex !== getStepperIndex(state);
}
