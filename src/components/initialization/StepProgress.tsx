import { cn } from '@/lib/utils';

export interface StepProgressValue {
  value: number;
  max: number;
  /** 接在「第 N / M 份」後面的文件標題（如損益及稅額計算表），讓使用者知道現在是哪一份 */
  title?: string;
  /** 進度文字同一列右側的補充小字（如這一頁表單的來源檔名與頁碼），太長會截斷 */
  note?: string;
}

/**
 * 逐頁核對的分段進度條（見 DESIGN.md「Segmented Progress」）：每份文件一段，走到的段填城信藍。
 * 由 StepPageHeader 放在固定底部操作列、上一頁／下一頁按鈕上方，長表單捲到哪都看得到走到哪。
 */
export function StepProgress({ value, max, title, note }: StepProgressValue) {
  return (
    <div className='flex flex-col gap-1'>
      <div
        role='progressbar'
        aria-label='資料進度'
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className='flex gap-0.5'
      >
        {Array.from({ length: max }, (_, index) => (
          <div key={index} className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', index < value ? 'bg-brand-blue' : 'bg-neutral-blue-gray/30')} />
        ))}
      </div>
      <div className='flex items-center justify-between gap-3 text-xs text-neutral-mid'>
        <span title={title} className='min-w-0 truncate'>
          第 {value} / {max} 份{title && `・${title}`}
        </span>
        {note && (
          <span title={note} className='min-w-0 shrink-[2] truncate text-right'>
            {note}
          </span>
        )}
      </div>
    </div>
  );
}
