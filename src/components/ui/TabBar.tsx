'use client';

interface TabBarOption<T extends string> {
  value: T;
  label: string;
}

interface TabBarProps<T extends string> {
  options: TabBarOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** 底線分頁：用於附著在表格頂部的檢視切換，與主層級的 SegmentedControl（藍底白字）視覺區隔（見 DESIGN.md「Tab Bar (Underline)」） */
export default function TabBar<T extends string>({ options, value, onChange, className = '' }: TabBarProps<T>) {
  return (
    <div className={`flex items-stretch gap-1 ${className}`}>
      {options.map(option => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
              active ? 'border-brand-blue text-brand-blue' : 'border-transparent text-neutral-mid hover:text-neutral-dark'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
