interface ProgressBarProps {
  value: number;
  max: number;
  /** 無障礙說明，如「文件進度」 */
  label: string;
  className?: string;
}

/** 扁平進度條：灰底軌道＋城信藍填色，依 value/max 顯示百分比 */
export default function ProgressBar({ value, max, label, className = '' }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role='progressbar'
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-neutral-blue-gray/30 ${className}`}
    >
      <div className='h-full rounded-full bg-brand-blue transition-[width] duration-300' style={{ width: `${percent}%` }} />
    </div>
  );
}
