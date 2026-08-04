'use client';

import Modal from '@/components/ui/Modal';
import { fmtCurrency, formatYyyymmdd } from '@/lib/utils';
import type { BankTransactionRow } from '../types';

interface TransactionDetailModalProps {
  open: boolean;
  row: BankTransactionRow | null;
  onClose: () => void;
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
 * 查看單筆交易的憑證/入帳資訊：精簡呈現摘要、金額（依支出/存入標示）、備註、帳務時間，
 * 聚焦核對所需的重點欄位，非完整明細。
 */
export default function TransactionDetailModal({ open, row, onClose }: TransactionDetailModalProps) {
  if (!open || !row) return null;

  const amountLabel = row.expense != null ? '支出金額' : '存入金額';
  const amountValue = fmtCurrency(row.expense ?? row.deposit ?? 0);

  return (
    <Modal open onClose={onClose} title="交易憑證資訊" widthClassName="max-w-[420px]">
      <div className="flex flex-col divide-y divide-neutral-blue-gray/20 text-sm">
        <DetailRow label="摘要" value={row.summary || '—'} />
        <DetailRow label={amountLabel} value={amountValue} />
        <DetailRow label="備註" value={row.remark || '—'} />
        <DetailRow label="帳務時間" value={formatYyyymmdd(row.accountingDate)} />
      </div>
    </Modal>
  );
}
