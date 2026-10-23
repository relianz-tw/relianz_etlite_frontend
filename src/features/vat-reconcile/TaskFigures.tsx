import { formatTWD } from '@/lib/utils';

interface TaskFiguresProps {
  amount?: number;
  tax?: number;
  /** md：任務中心待完成項目；sm：帳簿頁精簡列表 */
  size?: 'md' | 'sm';
}

/**
 * 待完成項目的「剩餘金額」與「稅金」。兩者都是對帳目標，標籤與數字用同樣的字級與字重並排，
 * 不分主次；稅額欄沒有差額時（tax 為 undefined）只顯示剩餘金額。
 */
export default function TaskFigures({ amount, tax, size = 'md' }: TaskFiguresProps) {
  const figures = [
    { label: '剩餘金額', value: amount },
    { label: '稅金', value: tax },
  ].filter((f): f is { label: string; value: number } => f.value !== undefined);

  if (figures.length === 0) return null;

  const valueClass = size === 'md' ? 'text-lg' : 'text-sm';
  return (
    <div className="flex gap-6">
      {figures.map(({ label, value }) => (
        <div key={label} className="flex min-w-[96px] flex-col nav:items-end">
          <span className="text-xs text-neutral-mid">{label}</span>
          <span className={`${valueClass} font-semibold tabular-nums text-neutral-dark`}>NT${formatTWD(value)}</span>
        </div>
      ))}
    </div>
  );
}
