import type { StepperItem } from '@/components/ui/Stepper';

/** 開帳精靈 Stepper 分組：內部有 1/2/3A/3B/4/5 共 6 個畫面，對外壓縮成 4 組顯示 */
export const INITIALIZATION_STEPPER_ITEMS: StepperItem[] = [
  { label: '合約' },
  { label: '公司資料' },
  { label: '開帳資料' },
  { label: '完成' },
];

/** 目前所在畫面 step（1-5）→ Stepper 分組 index（0-based） */
export function getStepperIndex(step: number): number {
  if (step <= 1) return 0;
  if (step === 2) return 1;
  if (step === 3 || step === 4) return 2;
  return 3;
}
