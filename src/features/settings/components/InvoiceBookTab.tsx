'use client';

import { listInvoiceBookPeriods, listInvoiceBooks, saveInvoiceBook } from '@/api/invoiceBook';
import type { InvoiceBookDto } from '@/api/types';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { parseInvoicePeriodValue, toInvoicePeriodOption } from '@/lib/invoicePeriod';
import type { InvoicePeriodOption } from '@/lib/invoicePeriod';
import { CirclePlus, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import InvoiceBookDialog from './InvoiceBookDialog';
import PrintFormatDialog from './PrintFormatDialog';
import type { PrintFormatSettings } from './PrintFormatDialog';

const DEFAULT_PRINT_FORMAT: PrintFormatSettings = { invoiceFormat: 'triple', printerType: 'laser' };

export default function InvoiceBookTab() {
  const [periods, setPeriods] = useState<InvoicePeriodOption[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [periodsError, setPeriodsError] = useState('');
  const [period, setPeriod] = useState('');

  const [books, setBooks] = useState<InvoiceBookDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [bookDialogOpen, setBookDialogOpen] = useState(false);

  const [printFormat, setPrintFormat] = useState<PrintFormatSettings>(DEFAULT_PRINT_FORMAT);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  // 「發票期間」下拉選項改由後端動態取得；載入完成後預設選第一個期別，觸發下方發票本清單載入
  useEffect(() => {
    setPeriodsLoading(true);
    setPeriodsError('');
    listInvoiceBookPeriods()
      .then(list => {
        const options = list.map(toInvoicePeriodOption);
        setPeriods(options);
        setPeriod(prev => prev || options[0]?.value || '');
      })
      .catch(err => setPeriodsError(getFriendlyErrorMessage(err)))
      .finally(() => setPeriodsLoading(false));
  }, []);

  const loadBooks = () => {
    const parsed = parseInvoicePeriodValue(period);
    if (!parsed) return;
    setLoading(true);
    setLoadError('');
    listInvoiceBooks({ year: parsed.rocYear, phase: parsed.phase })
      .then(result => setBooks(result.invoiceBook))
      .catch(err => setLoadError(getFriendlyErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (period) loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const handleBookSubmit = async (form: { name: string; period: string; aphabeticLetter: string; startNum: string }) => {
    const parsed = parseInvoicePeriodValue(form.period);
    if (!parsed) return;
    await saveInvoiceBook({
      name: form.name,
      year: parsed.rocYear,
      phase: parsed.phase,
      aphabeticLetter: form.aphabeticLetter,
      startNum: form.startNum,
    });
    loadBooks();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white px-4 py-3">
        <Select widthClassName="max-w-[240px]" value={period} disabled={periodsLoading} onValueChange={setPeriod}>
          {periods.length === 0 && (
            <option value="" disabled>
              {periodsLoading ? '載入中…' : '尚無可用期間'}
            </option>
          )}
          {periods.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        {periodsError && <p className="mt-2 text-xs text-semantic-error">{periodsError}</p>}
      </div>

      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-dark">手開發票簿</h2>
          <Button size="sm" icon={CirclePlus} onClick={() => setBookDialogOpen(true)} disabled={!period}>
            新增本期發票本
          </Button>
        </div>
        {loading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : loadError ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{loadError}</div>
        ) : books.length === 0 ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">此期間目前沒有發票本</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {books.map(book => (
              <div
                key={book.invoiceBookId}
                className="w-full rounded-md border border-neutral-blue-gray/30 bg-white p-4 nav:w-[calc(50%-0.375rem)]"
              >
                <div className="mb-2 font-semibold text-neutral-dark">{book.name}</div>
                <div className="flex flex-col gap-1 text-xs text-neutral-mid">
                  <div>字軌　{book.aphabeticLetter}</div>
                  <div>起號　{book.startNum}</div>
                  <div>目前號碼　{book.currentNum}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-dark">電子發票</h2>
          <Button size="sm" variant="outline" icon={Printer} onClick={() => setPrintDialogOpen(true)}>
            列印格式設定
          </Button>
        </div>
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">目前沒有發票本</div>
      </div>

      <InvoiceBookDialog
        open={bookDialogOpen}
        onClose={() => setBookDialogOpen(false)}
        onSubmit={handleBookSubmit}
        periods={periods}
        defaultPeriod={period}
      />
      <PrintFormatDialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)} value={printFormat} onSubmit={setPrintFormat} />
    </div>
  );
}
