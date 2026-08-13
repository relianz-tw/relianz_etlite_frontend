import { FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '開立電子發票 | Easytax Lite',
};

export default function EInvoicePage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <FileText size={40} strokeWidth={1.5} className="text-brand-tan" />
      <h1 className="heading-card mt-6">開立電子發票</h1>
      <p className="mt-2 text-neutral-mid">功能開發中，敬請期待。</p>
    </main>
  );
}
