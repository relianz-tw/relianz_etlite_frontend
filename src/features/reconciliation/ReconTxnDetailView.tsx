'use client';

import { fetchEntryDetail } from '@/api/ledger';
import type { EntryInvoiceDetailDto } from '@/api/types';
import VoucherPreviewCard from '@/components/ui/VoucherPreviewCard';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReconSide } from './types';

interface ReconTxnDetailViewProps {
  transactionId: string;
  side: ReconSide;
  /** 買受人/賣方名稱，沿用清單既有資料（發票明細 API 對銷項不含買受人名稱欄位） */
  counterparty?: string;
}

/** 憑證明細民國年 year/month/day 欄位補零組成 YYY/MM/DD（ReconTxnList 的展開面板懶載入亦重用此函式） */
export function formatInvoiceDate(invoice: EntryInvoiceDetailDto): string {
  const month = String(invoice.month).padStart(2, '0');
  const day = String(invoice.day).padStart(2, '0');
  return `${invoice.year}/${month}/${day}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="shrink-0 text-neutral-mid">{label}</span>
      <span className="truncate text-right font-medium text-neutral-dark">{value}</span>
    </div>
  );
}

/**
 * 匯總沖帳交易明細頁：呼叫 GET /ael/ledger/entries/detail 撈憑證資料（含照片）並顯示摘要。
 * 這是獨立頁面（非帳簿的 /ledger/[id] 編輯頁），由匯總沖帳清單展開列的「查看詳細」按鈕導向。
 * invoice 為 null 代表該筆交易尚無對應憑證，此時金額/日期無法由 API 取得，僅顯示網址帶入的買受人/賣方名稱。
 */
export default function ReconTxnDetailView({ transactionId, side, counterparty }: ReconTxnDetailViewProps) {
  const [invoice, setInvoice] = useState<EntryInvoiceDetailDto | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setInvoice(undefined);
    setLoading(true);
    setError('');
    fetchEntryDetail({ ledgerUuid: transactionId })
      .then(result => {
        if (cancelled) return;
        setInvoice(result.invoice);
      })
      .catch(err => {
        if (cancelled) return;
        setError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [transactionId]);

  const voucherNumber = invoice ? `${invoice.invoiceTrack}${invoice.invoiceNumber}` : '—';
  const taxId = invoice ? (side === 'receivable' ? invoice.buyerTaxIdNumber : invoice.sellerTaxIdNumber) : '';
  const totalAmount = invoice ? invoice.sales + invoice.businessTax + invoice.taxFreeAmount : null;
  const issueDate = invoice ? formatInvoiceDate(invoice) : '';

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6">
          <Link href="/ledger/reconciliation" className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
            <ChevronLeft size={16} />
            返回沖帳中心
          </Link>
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">交易明細</h1>
        </div>

        {loading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : error ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{error}</div>
        ) : (
          // 手機（<nav 斷點）單欄堆疊：照片在上、摘要在下；桌機才切成左右兩欄且左側照片 sticky
          <div className="nav:grid nav:grid-cols-[380px_1fr] nav:items-start nav:gap-8">
            <div className="mb-5 nav:sticky nav:top-20 nav:mb-0">
              <VoucherPreviewCard voucherImage={invoice?.invoicePicUrl || null} />
            </div>
            <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
              {invoice === null && (
                <div className="mb-3 rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-xs text-neutral-mid">
                  此交易尚無對應憑證，以下欄位可能不完整。
                </div>
              )}
              <div className="flex flex-col divide-y divide-neutral-blue-gray/20">
                <DetailRow label="憑證號碼" value={voucherNumber} />
                <DetailRow label={side === 'receivable' ? '買受人' : '賣方'} value={counterparty || '—'} />
                <DetailRow label="統一編號" value={taxId || '—'} />
                <DetailRow label="總金額" value={totalAmount !== null ? fmtCurrency(totalAmount) : '—'} />
                <DetailRow label="開立日期" value={issueDate || '—'} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
