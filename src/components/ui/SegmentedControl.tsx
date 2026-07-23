'use client';

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md' | 'lg';
  /** true 時每個選項依文字內容自適應寬度並保留間距，不強制等寬（適合選項多或長度不一時使用） */
  fit?: boolean;
  className?: string;
}

const SIZE_CLASS = {
  sm: 'py-1.5 text-[13px]',
  md: 'py-2 text-sm',
  lg: 'py-2.5 text-base',
};

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fit = false,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`${fit ? 'inline-flex flex-wrap gap-1' : 'grid gap-1'} rounded-md border border-surface-cream bg-surface-off-white p-1 ${className}`}
      style={fit ? undefined : { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(option => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`whitespace-nowrap rounded-[4px] font-semibold transition-colors ${SIZE_CLASS[size]} ${fit ? 'px-4' : ''} ${
              active ? 'bg-brand-blue text-white' : 'text-neutral-mid hover:text-neutral-dark'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
