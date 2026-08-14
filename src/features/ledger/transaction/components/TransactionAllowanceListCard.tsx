'use client';

import type { EntryDetailAllowanceDto, EntryDetailEntryDto } from '@/api/types';
import Button from '@/components/ui/Button';
import { fmtCurrency } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { Side } from '../../types';
import { appendReturnQuery } from '../../urlState';

interface TransactionAllowanceListCardProps {
  side: Side;
  returnQuery?: string;
  entry: EntryDetailEntryDto;
  allowances: EntryDetailAllowanceDto[];
  onCreate: () => void;
}

/** 原單交易細節頁的「折讓紀錄」區塊：常駐顯示（折讓單本身不會渲染此卡片，由呼叫端排除），
 *  逐筆列出已開立的折讓單並可點擊前往細節頁；標題列右側提供「開立折讓單」入口。 */
export default function TransactionAllowanceListCard({ side, returnQuery, entry, allowances, onCreate }: TransactionAllowanceListCardProps) {
  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-dark">折讓紀錄（{allowances.length}）</h2>
        {/* entry.remainingAmount 是「未沖金額」（沖帳/收付款進度），不是可折讓額度：交易已沖帳完畢
            （remainingAmount＝0）仍可能需要開立折讓單，故不可用它來 disable 這顆按鈕 */}
        <Button variant="outline" size="sm" icon={Plus} onClick={onCreate}>
          開立折讓單
        </Button>
      </div>
      {allowances.length === 0 ? (
        <p className="text-sm text-neutral-mid">尚無折讓紀錄</p>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-blue-gray/20">
          {allowances.map(allowance => (
            <Link
              key={allowance.ledgerUuid}
              href={appendReturnQuery(`/ledger/${allowance.ledgerUuid}?side=${side}`, returnQuery)}
              className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0"
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
      )}
    </div>
  );
}
