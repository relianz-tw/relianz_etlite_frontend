import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface StepperItem {
  /** 顯示於圓點下方（桌機）與行動版單行文字中的步驟名稱 */
  label: string;
}

interface StepperProps {
  steps: StepperItem[];
  /** 目前所在步驟（0-based index） */
  currentIndex: number;
  className?: string;
}

/**
 * 跨頁面精靈流程的整體進度指示器（見 DESIGN.md「Flow Stepper」）。
 * 與 StepNumber（同頁內操作順序徽章）用途不同，不可互相取代。
 */
export default function Stepper({ steps, currentIndex, className }: StepperProps) {
  return (
    <div className={className}>
      {/* 桌機：橫向圓點 + 連接線 */}
      <div className="hidden items-center md:flex">
        {steps.map((step, index) => {
          const status = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';
          return (
            <div key={step.label} className={cn('flex items-center', index < steps.length - 1 && 'flex-1')}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors',
                    status === 'done' && 'bg-brand-blue text-white',
                    status === 'current' && 'border-2 border-brand-blue bg-white font-semibold text-brand-blue',
                    status === 'upcoming' && 'border border-neutral-blue-gray/50 bg-white text-neutral-blue-gray',
                  )}
                >
                  {status === 'done' ? <Check aria-hidden="true" size={16} /> : index + 1}
                </div>
                <span
                  className={cn(
                    'text-[13px]',
                    status === 'upcoming' ? 'text-neutral-blue-gray' : 'text-neutral-dark',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn('mx-2 h-px flex-1 self-start mt-4', index < currentIndex ? 'bg-brand-blue' : 'bg-neutral-blue-gray/40')}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 行動版：單行文字提示 */}
      <p className="text-[13px] text-neutral-mid md:hidden">
        第 {currentIndex + 1} / {steps.length} 步．{steps[currentIndex]?.label}
      </p>
    </div>
  );
}
