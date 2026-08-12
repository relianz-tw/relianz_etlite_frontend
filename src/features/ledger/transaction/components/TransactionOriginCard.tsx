'use client';

import type { EntryDetailEntryDto } from '@/api/types';
import { formatRocDate } from '@/components/ui/DatePicker';
import { fmtCurrency } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { Side } from '../../types';
import { appendReturnQuery } from '../../urlState';

interface TransactionOriginCardProps {
  side: Side;
  originLedgerUuid: string;
  returnQuery?: string;
  loading: boolean;
  error: string;
  entry: EntryDetailEntryDto | null;
}

interface DetailRow {
  label: string;
  value: string;
}

/** 折讓單交易細節頁的「原始交易憑證」區塊：僅 isAllowance 為 true 時顯示，預設收合，
 *  收合互動比照 TransactionSettlementStatus 既有的 button + Chevron 樣式。 */
export default function TransactionOriginCard({ side, originLedgerUuid, returnQuery, loading, error, entry }: TransactionOriginCardProps) {
  const [open, setOpen] = useState(false);

  const rows: DetailRow[] = entry
    ? [
        { label: '交易編號', value: entry.orderCode },
        { label: '交易對象', value: entry.counterpartyName || '—' },
        { label: '開立日期', value: formatRocDate(entry.transactionDate ? new Date(entry.transactionDate) : undefined) || '—' },
        { label: '科目', value: entry.subjectName },
        { label: '總金額', value: fmtCurrency(entry.totalAmount) },
        { label: '未稅', value: fmtCurrency(entry.netAmount) },
        { label: '稅額', value: fmtCurrency(entry.taxAmount) },
        { label: '已沖金額', value: fmtCurrency(entry.settledAmount) },
        { label: '未沖金額', value: fmtCurrency(entry.remainingAmount) },
      ]
    : [];

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold text-neutral-dark"
      >
        原始交易憑證
        {open ? <ChevronUp size={16} className="text-neutral-mid" /> : <ChevronDown size={16} className="text-neutral-mid" />}
      </button>
      {open && (
        <div className="mt-3 border-t border-neutral-blue-gray/20 pt-3">
          {loading ? (
            <p className="text-sm text-neutral-mid">載入中…</p>
          ) : error ? (
            <p className="text-sm text-semantic-error">{error}</p>
          ) : entry ? (
            <>
              <div className="flex flex-col gap-2">
                {rows.map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-neutral-mid">{row.label}</span>
                    <span className="font-mono font-semibold tabular-nums text-neutral-dark">{row.value}</span>
                  </div>
                ))}
              </div>
              <Link
                href={appendReturnQuery(`/ledger/${originLedgerUuid}?side=${side}`, returnQuery)}
                className="mt-3 inline-block text-sm font-semibold text-brand-blue hover:underline"
              >
                前往原始交易
              </Link>
            </>
          ) : (
            <p className="text-sm text-neutral-mid">查無原始交易資訊</p>
          )}
        </div>
      )}
    </div>
  );
}
