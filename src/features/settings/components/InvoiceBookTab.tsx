import Button from '@/components/ui/Button';
import { CirclePlus, Pencil, Printer, Trash2 } from 'lucide-react';
import { HAND_INVOICE_BOOKS, INVOICE_PERIOD_LABEL } from '../data';

export default function InvoiceBookTab() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white px-4 py-3 text-sm text-neutral-dark">
        {INVOICE_PERIOD_LABEL}
      </div>

      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-dark">手開發票簿</h2>
          <Button size="sm" icon={CirclePlus}>
            新增本期發票本
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {HAND_INVOICE_BOOKS.map(book => (
            <div
              key={book.id}
              className="w-full rounded-md border border-neutral-blue-gray/30 bg-white p-4 nav:w-[calc(50%-0.375rem)]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-semibold text-neutral-dark">{book.name}</span>
                <div className="flex items-center gap-3 text-neutral-mid">
                  <Pencil size={14} />
                  <Trash2 size={14} className="text-semantic-error" />
                </div>
              </div>
              <div className="flex flex-col gap-1 text-xs text-neutral-mid">
                <div>字軌　{book.trackCode}</div>
                <div>起號　{book.startNumber}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-dark">電子發票</h2>
          <Button size="sm" variant="outline" icon={Printer}>
            列印格式設定
          </Button>
        </div>
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">目前沒有發票本</div>
      </div>
    </div>
  );
}
