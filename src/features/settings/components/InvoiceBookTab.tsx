'use client';

import Button from '@/components/ui/Button';
import { CirclePlus, Pencil, Printer, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { HAND_INVOICE_BOOKS, INVOICE_PERIOD_LABEL } from '../data';
import type { InvoiceBookRecord } from '../data';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import InvoiceBookDialog from './InvoiceBookDialog';
import PrintFormatDialog from './PrintFormatDialog';
import type { PrintFormatSettings } from './PrintFormatDialog';

const DEFAULT_PRINT_FORMAT: PrintFormatSettings = { invoiceFormat: 'triple', printerType: 'laser' };

export default function InvoiceBookTab() {
  const [books, setBooks] = useState<InvoiceBookRecord[]>(HAND_INVOICE_BOOKS);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<InvoiceBookRecord | undefined>(undefined);
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null);

  const [printFormat, setPrintFormat] = useState<PrintFormatSettings>(DEFAULT_PRINT_FORMAT);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  const openNewBook = () => {
    setEditingBook(undefined);
    setBookDialogOpen(true);
  };
  const openEditBook = (book: InvoiceBookRecord) => {
    setEditingBook(book);
    setBookDialogOpen(true);
  };
  const handleBookSubmit = (data: Omit<InvoiceBookRecord, 'id'>) => {
    if (editingBook) {
      setBooks(list => list.map(b => (b.id === editingBook.id ? { ...editingBook, ...data } : b)));
    } else {
      setBooks(list => [...list, { ...data, id: `ib${list.length + 1}` }]);
    }
  };
  const handleBookDelete = () => {
    if (!deleteBookId) return;
    setBooks(list => list.filter(b => b.id !== deleteBookId));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white px-4 py-3 text-sm text-neutral-dark">
        {INVOICE_PERIOD_LABEL}
      </div>

      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-dark">手開發票簿</h2>
          <Button size="sm" icon={CirclePlus} onClick={openNewBook}>
            新增本期發票本
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {books.map(book => (
            <div
              key={book.id}
              className="w-full rounded-md border border-neutral-blue-gray/30 bg-white p-4 nav:w-[calc(50%-0.375rem)]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-semibold text-neutral-dark">{book.name}</span>
                <div className="flex items-center gap-3 text-neutral-mid">
                  <button type="button" onClick={() => openEditBook(book)} aria-label={`編輯發票本 ${book.name}`}>
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => setDeleteBookId(book.id)} aria-label={`刪除發票本 ${book.name}`}>
                    <Trash2 size={14} className="text-semantic-error" />
                  </button>
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
          <Button size="sm" variant="outline" icon={Printer} onClick={() => setPrintDialogOpen(true)}>
            列印格式設定
          </Button>
        </div>
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">目前沒有發票本</div>
      </div>

      <InvoiceBookDialog open={bookDialogOpen} onClose={() => setBookDialogOpen(false)} onSubmit={handleBookSubmit} initial={editingBook} />
      <ConfirmDeleteDialog
        open={deleteBookId !== null}
        onClose={() => setDeleteBookId(null)}
        onConfirm={handleBookDelete}
        title="刪除發票本"
        message="確定要刪除此發票本嗎？此動作無法復原。"
      />
      <PrintFormatDialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)} value={printFormat} onSubmit={setPrintFormat} />
    </div>
  );
}
