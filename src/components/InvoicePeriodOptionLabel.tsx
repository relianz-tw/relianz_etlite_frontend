import Badge from '@/components/ui/Badge';
import type { InvoicePeriodOption } from '@/lib/invoicePeriod';

/** 發票期間下拉選項內容：期間文字 + 「本期」「N 本」各自一顆 Badge（見 DESIGN.md Status Badge） */
export default function InvoicePeriodOptionLabel({ option }: { option: InvoicePeriodOption }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{option.label}</span>
      {option.isCurrent && (
        <Badge tone="info" variant="solid" className="shrink-0">
          本期
        </Badge>
      )}
      {option.count !== undefined && (
        <Badge tone="neutral" className="shrink-0">
          {option.count} 本
        </Badge>
      )}
    </span>
  );
}
