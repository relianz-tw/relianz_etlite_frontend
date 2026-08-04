'use client';

import { fetchEntryDetail } from '@/api/ledger';
import type { EntryInvoiceDetailDto } from '@/api/types';
import Modal from '@/components/ui/Modal';
import { fmtCurrency } from '@/lib/utils';
import { useEffect, useState } from 'react';
import type { ReconSide, ReconTxnRef } from '../types';

interface ReconTxnDetailModalProps {
  open: boolean;
  row: ReconTxnRef | null;
  side: ReconSide;
  onClose: () => void;
}

/** 憑證明細民國年 year/month/day 欄位補零組成 YYY/MM/DD，與清單日期格式一致 */
function formatInvoiceDate(invoice: EntryInvoiceDetailDto): string {
  const month = String(invoice.month).padStart(2, '0');
  const day = String(invoice.day).padStart(2, '0');
  return `${invoice.year}/${month}/${day}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="shrink-0 text-neutral-mid">{label}</span>
      <span className="truncate text-right font-medium text-neutral-dark">{value}</span>
    </div>
  );
}

/**
 * 查看單張交易明細：呼叫 GET /ael/ledger/entries/detail 撈憑證資料並顯示摘要。
 * invoice 為 null 代表該筆交易尚無對應憑證，此時金額/日期改以交易列既有資料呈現，不視為錯誤。
 * 沖帳紀錄區塊本次未串接後端，先以假資料佔位並標註提醒，供日後接上真實 API。
 */
export default function ReconTxnDetailModal({ open, row, side, onClose }: ReconTxnDetailModalProps) {
  const [invoice, setInvoice] = useState<EntryInvoiceDetailDto | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !row) return;
    let cancelled = false;
    setInvoice(undefined);
    setLoading(true);
    setError('');
    fetchEntryDetail({ ledgerUuid: row.uuid })
      .then(result => {
        if (cancelled) return;
        setInvoice(result.invoice);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '操作失敗');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, row]);

  if (!open || !row) return null;

  const voucherNumber = invoice ? `${invoice.invoiceTrack}${invoice.invoiceNumber}` : row.voucherNumber || '—';
  const taxId = invoice ? (side === 'receivable' ? invoice.buyerTaxIdNumber : invoice.sellerTaxIdNumber) : '';
  const totalAmount = invoice ? invoice.sales + invoice.businessTax + invoice.taxFreeAmount : row.amount;
  const issueDate = invoice ? formatInvoiceDate(invoice) : row.date;

  return (
    <Modal open onClose={onClose} title="交易明細" widthClassName="max-w-[480px]">
      {loading ? (
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入憑證資料中…</div>
      ) : error ? (
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{error}</div>
      ) : (
        <div className="flex flex-col gap-5">
          {invoice === null && (
            <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-xs text-neutral-mid">
              此交易尚無對應憑證，以下金額與日期取自交易紀錄。
            </div>
          )}

          <div className="flex flex-col divide-y divide-neutral-blue-gray/20 text-sm">
            <DetailRow label="憑證號碼" value={voucherNumber} />
            <DetailRow label={side === 'receivable' ? '買受人' : '賣方'} value={row.counterparty || '—'} />
            <DetailRow label="統一編號" value={taxId || '—'} />
            <DetailRow label="總金額" value={fmtCurrency(totalAmount)} />
            <DetailRow label="開立日期" value={issueDate} />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-neutral-dark">沖帳紀錄</p>
            <div className="rounded-md border border-dashed border-neutral-blue-gray/40 bg-surface-cream/60 p-3">
              <p className="mb-2 text-xs text-neutral-mid">示意資料，尚未串接沖帳紀錄查詢 API</p>
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-mid">115/03/12 · 對帳單沖銷</span>
                  <span className="font-mono tabular-nums text-neutral-dark">{fmtCurrency(row.amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
