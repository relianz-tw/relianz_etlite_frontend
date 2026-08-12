'use client';

import type { EntryDetailAllowanceDto } from '@/api/types';
import { fmtCurrency } from '@/lib/utils';
import Link from 'next/link';
import type { Side } from '../../types';
import { appendReturnQuery } from '../../urlState';

interface TransactionAllowanceListCardProps {
  side: Side;
  returnQuery?: string;
  allowances: EntryDetailAllowanceDto[];
}

/** 原單交易細節頁的「折讓紀錄」區塊：僅原單（非折讓單）且已被開立過折讓單時顯示，逐筆列出可點擊前往折讓單細節頁 */
export default function TransactionAllowanceListCard({ side, returnQuery, allowances }: TransactionAllowanceListCardProps) {
  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-neutral-dark">折讓紀錄（{allowances.length}）</h2>
      <div className="flex flex-col divide-y divide-neutral-blue-gray/20">
        {allowances.map(allowance => (
          <Link
            key={allowance.ledgerUuid}
            href={appendReturnQuery(`/ledger/${allowance.ledgerUuid}?side=${side}`, returnQuery)}
            className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0 hover:bg-brand-blue/5"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-mono font-semibold text-neutral-dark hover:text-brand-blue hover:underline">{allowance.orderCode}</span>
              <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(allowance.allowanceAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-mid">
              <span>
                未稅 {fmtCurrency(allowance.netAmount)}　稅額 {fmtCurrency(allowance.taxAmount)}
              </span>
              <span>總額 {fmtCurrency(allowance.totalAmount)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
