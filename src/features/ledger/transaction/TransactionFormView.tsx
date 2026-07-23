'use client';

import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import VoidConfirmDialog from '../components/VoidConfirmDialog';
import type { Side } from '../types';
import TransactionAllowanceCard from './components/TransactionAllowanceCard';
import TransactionAmountCard from './components/TransactionAmountCard';
import TransactionMetaCard from './components/TransactionMetaCard';
import TransactionStatusSummary from './components/TransactionStatusSummary';
import VoucherUpload from './components/VoucherUpload';
import { EDIT_PURCHASE_FORM, EDIT_SALES_FORM, EMPTY_TRANSACTION_FORM } from './data';
import type { TransactionFormState, TransactionMode } from './types';

interface TransactionFormViewProps {
  mode: TransactionMode;
  side: Side;
  transactionId?: string;
}

const SIDE_LABEL: Record<Side, string> = { sales: '銷項', purchase: '進項' };

function initialForm(mode: TransactionMode, side: Side, transactionId?: string): TransactionFormState {
  if (mode === 'create') return EMPTY_TRANSACTION_FORM;
  const base = side === 'sales' ? EDIT_SALES_FORM : EDIT_PURCHASE_FORM;
  // 發票號碼與附件檔名對應進入編輯畫面的交易編碼，讓每筆交易顯示各自的資料
  return transactionId ? { ...base, invoiceNumber: transactionId, voucherFileName: `${transactionId}.jpg` } : base;
}

export default function TransactionFormView({ mode, side, transactionId }: TransactionFormViewProps) {
  const router = useRouter();
  const [form, setForm] = useState<TransactionFormState>(() => initialForm(mode, side, transactionId));
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false);

  const handleChange = (patch: Partial<TransactionFormState>) => setForm(f => ({ ...f, ...patch }));
  const handleFileChange = (fileName: string, previewUrl: string) =>
    handleChange({ voucherFileName: fileName, voucherPreviewUrl: previewUrl });

  const handleSideChange = (next: Side) => router.push(`/ledger/new?side=${next}`);

  // 視覺模擬：建立/更新/作廢/刪除皆不接後端，一律返回帳簿
  const backToLedger = () => router.push('/ledger');
  const totalAmount = form.salesAmount + form.taxAmount;

  const breadcrumb = mode === 'create' ? `帳簿 / 新增${SIDE_LABEL[side]}交易` : `帳簿 / ${SIDE_LABEL[side]}交易細節`;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 py-7 nav:px-7">
        <div className="mb-6 flex flex-col gap-4 nav:flex-row nav:items-start nav:justify-between">
          <div>
            <Link href="/ledger" className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
              <ChevronLeft size={16} />
              返回帳簿
            </Link>
            <p className="text-sm text-neutral-mid">{breadcrumb}</p>
          </div>
          {mode === 'create' && (
            <div className="w-full nav:w-64">
              <SegmentedControl
                options={[
                  { value: 'sales', label: '銷項' },
                  { value: 'purchase', label: '進項' },
                ]}
                value={side}
                onChange={handleSideChange}
                size="md"
              />
            </div>
          )}
        </div>

        <div className="nav:grid nav:grid-cols-[380px_1fr] nav:items-start nav:gap-8">
          <div className="mb-5 flex flex-col gap-4 nav:sticky nav:top-20 nav:mb-0">
            <VoucherUpload mode={mode} fileName={form.voucherFileName} previewUrl={form.voucherPreviewUrl} onFileChange={handleFileChange} />
            {mode === 'edit' && <TransactionStatusSummary side={side} />}
          </div>

          <div className="flex flex-col gap-5">
            <TransactionMetaCard side={side} mode={mode} form={form} onChange={handleChange} />
            <TransactionAmountCard side={side} form={form} onChange={handleChange} />
            {side === 'sales' && mode === 'edit' && <TransactionAllowanceCard />}

            <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-neutral-blue-gray/20 bg-surface-off-white px-4 py-4 nav:static nav:mx-0 nav:border-0 nav:bg-transparent nav:px-0 nav:py-0">
              {mode === 'create' && (
                <Button variant="primary" className="w-full nav:w-auto" onClick={backToLedger}>
                  建立交易
                </Button>
              )}
              {mode === 'edit' && (
                <>
                  <Button
                    variant="danger"
                    className="flex-1 nav:flex-none"
                    onClick={side === 'sales' ? () => setVoidConfirmOpen(true) : backToLedger}
                  >
                    {side === 'sales' ? '作廢' : '刪除'}
                  </Button>
                  <Button variant="primary" className="flex-1 nav:flex-none" onClick={backToLedger}>
                    更新
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {mode === 'edit' && side === 'sales' && (
        <VoidConfirmDialog
          open={voidConfirmOpen}
          onClose={() => setVoidConfirmOpen(false)}
          onConfirm={backToLedger}
          transactionId={form.invoiceNumber}
          amount={totalAmount}
        />
      )}
    </div>
  );
}
