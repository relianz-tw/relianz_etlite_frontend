import { cn } from '@/lib/utils';

interface CodeChipProps {
  /** 紙本編號 */
  official?: string;
  /** 紙本圈號 */
  refNo?: string;
  /** 沒有編號時留白佔位，讓同欄金額框對齊 */
  placeholder?: boolean;
  className?: string;
}

/** 代號：紙本官方欄位代號，有圈號時接在後面（如 21 ①）；無底色，只用藍色粗體字 */
export function CodeChip({ official, refNo, placeholder, className }: CodeChipProps) {
  const text = [official, refNo].filter(Boolean).join(' ');
  if (!text && !placeholder) return null;
  return (
    <span className={cn('inline-flex h-6 min-w-9 shrink-0 items-center justify-center whitespace-nowrap text-sm font-bold text-brand-blue', !text && 'invisible', className)}>
      {text || '0'}
    </span>
  );
}
