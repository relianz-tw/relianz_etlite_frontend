import Badge from '@/components/ui/Badge';
import { BILLING_RECORDS, BILLING_YEAR } from '../data';

export default function BillingTab() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-neutral-dark">{BILLING_YEAR}</h2>
      <div className="flex flex-wrap gap-4">
        {BILLING_RECORDS.map(record => (
          <div
            key={record.id}
            className="w-full rounded-md border border-neutral-blue-gray/30 bg-white p-4 nav:w-[calc(33.333%-0.667rem)]"
          >
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-neutral-blue-gray/20 pb-3">
              <h3 className="text-sm font-semibold text-neutral-dark">{record.month}</h3>
              <Badge tone="success" variant="solid">
                {record.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-mid">交易內容</span>
              <span className="font-semibold text-neutral-dark">${record.amount.toLocaleString('en-US')}</span>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-md bg-surface-off-white px-3 py-2 text-xs text-neutral-mid">
              <span>{record.itemLabel}</span>
              <span>${record.amount.toLocaleString('en-US')}</span>
            </div>

            <div className="mt-3 border-t border-neutral-blue-gray/20 pt-3 text-xs text-neutral-mid">
              {record.invoiceNumber} · {record.paidDate}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
