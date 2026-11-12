'use client';

import { useInitialization } from '../state/InitializationContext';
import { isPageFilled, resolveReportPage } from '../reports';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

/**
 * 營業稅各期別選擇格（版型對齊任務中心期別格）：一次列出所有 401／403 期別，
 * 點選直接跳到該期的頁面，不必一份一份按「下一份」才看得到有哪些期別。
 */
export function VatPeriodPicker() {
  const { state, dispatch } = useInitialization();
  const periods = state.reportPages.map((spec, index) => ({ spec, index })).filter(p => p.spec.period);
  if (periods.length === 0) return null;

  return (
    <section aria-label='各期別' className='grid grid-cols-3 gap-2 nav:grid-cols-6 nav:gap-3'>
      {periods.map(({ spec, index }) => {
        const { period } = spec;
        if (!period) return null;
        const active = index === state.currentReportIndex;
        const filled = isPageFilled(state.reports, resolveReportPage(spec, state.vatChoices).reportKey);
        return (
          <button
            key={spec.key}
            type='button'
            aria-pressed={active}
            onClick={() => dispatch({ type: 'GO_TO_STEP', payload: { step: 4, reportIndex: index } })}
            className={cn(
              'flex min-h-[72px] flex-col items-start gap-1 rounded-lg border-2 bg-white px-3 py-2 text-left nav:min-h-[88px] nav:gap-1.5 nav:py-3 transition-colors nav:px-4',
              active ? 'border-brand-primary' : 'border-neutral-blue-gray/30 hover:border-neutral-blue-gray'
            )}
          >
            <span className='text-xs text-neutral-mid'>民國 {period.rocYear} 年</span>
            <span className='font-display-zh text-base font-semibold leading-tight text-neutral-dark'>
              {String(period.phase).padStart(2, '0')}–{String(period.phase + 1).padStart(2, '0')} 月
            </span>
            {filled ? (
              <Badge tone='success'>已填寫</Badge>
            ) : (
              <Badge tone={spec.required ? 'info' : 'neutral'}>{spec.required ? '必填' : '選填'}</Badge>
            )}
          </button>
        );
      })}
    </section>
  );
}
