'use client';

import Badge from '@/components/ui/Badge';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import { sideLabel } from '../labels';
import type { BankTxnRow } from '../types';

function DetailField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-neutral-mid">{label}</p>
      <p className={`mt-0.5 font-medium text-neutral-dark ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</p>
    </div>
  );
}

/** 交易明細頁的交易資訊卡：呈現沖帳事件的完整欄位（POST /ael/bankAccounts/transactions 回應），
 *  無逐筆累計餘額（見 AccountSummaryCard「目前餘額」） */
export default function BankTransactionSummaryCard({ row, counterpartyName }: { row: BankTxnRow; counterpartyName: string | null }) {
  const amountLabel = row.expense != null ? '支出金額' : '存入金額';
  const amountValue = fmtCurrency(row.expense ?? row.deposit ?? 0);
  // 交易對象：優先呈現關聯帳簿交易的買方／賣方名稱，查無關聯交易則回退沖帳事件本身的廠商名稱／備註
  const partyLabel = counterpartyName || row.counterpartyLabel;

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-dark">交易資訊</h2>
        {row.isReverse && <Badge tone="error">已恢復</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm nav:grid-cols-4">
        <DetailField label="交易日期" value={formatYyyymmddRoc(row.paymentDate)} mono />
        <div>
          <p className="text-xs text-neutral-mid">類型</p>
          <p className="mt-0.5">
            <Badge tone={row.side === 0 ? 'info' : 'neutral'}>{sideLabel(row.side)}</Badge>
          </p>
        </div>
        <DetailField label={amountLabel} value={amountValue} mono />
        <DetailField label="沖帳金額" value={fmtCurrency(row.settleAmount)} mono />
        <DetailField label="實際收付" value={fmtCurrency(row.cashAmount)} mono />
        <DetailField label="建立時間" value={formatYyyymmddRoc(row.createdAt)} mono />
        <div className="col-span-2">
          <DetailField label="交易對象" value={partyLabel} />
        </div>
      </div>
    </div>
  );
}
