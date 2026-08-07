'use client';

import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import type { BankTransactionRow } from '../types';

function DetailField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-neutral-mid">{label}</p>
      <p className={`mt-0.5 font-medium text-neutral-dark ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</p>
    </div>
  );
}

/**
 * 交易明細頁的交易資訊卡：除存摺式重點欄位（交易時間/帳務時間/支出或存入/餘額/摘要/備註）外，
 * 另呈現 inline 展開未顯示的銀行系統欄位（交易管道/流水編號/經辦人員），轉帳類交易並列出對方帳戶資訊
 */
export default function BankTransactionSummaryCard({ row }: { row: BankTransactionRow }) {
  const amountLabel = row.expense != null ? '支出金額' : '存入金額';
  const amountValue = fmtCurrency(row.expense ?? row.deposit ?? 0);
  const hasCounterparty = row.counterpartyBank || row.counterpartyAccount;

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <h2 className="mb-5 text-base font-semibold text-neutral-dark">交易資訊</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm nav:grid-cols-4">
        <DetailField label="交易時間" value={formatYyyymmddRoc(row.transactionDate)} mono />
        <DetailField label="帳務時間" value={formatYyyymmddRoc(row.accountingDate)} mono />
        <DetailField label={amountLabel} value={amountValue} mono />
        <DetailField label="餘額" value={fmtCurrency(row.balance)} mono />
        <DetailField label="交易管道" value={row.channel} />
        <DetailField label="交易序號" value={row.referenceNo} mono />
        <DetailField label="經辦人員" value={row.handler} />
        <div />
        <div className="col-span-2">
          <DetailField label="摘要" value={row.summary || '—'} />
        </div>
        <div className="col-span-2">
          <DetailField label="備註" value={row.remark || '—'} />
        </div>
      </div>

      {hasCounterparty && (
        <div className="mt-5 border-t border-neutral-blue-gray/20 pt-5">
          <h3 className="mb-3 text-xs font-semibold text-neutral-mid">對方帳戶資訊</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm nav:grid-cols-4">
            <DetailField label="對方銀行" value={row.counterpartyBank || '—'} />
            <DetailField label="對方帳號" value={row.counterpartyAccount || '—'} mono />
          </div>
        </div>
      )}
    </div>
  );
}
