'use client';

import type { SettleEventListItemDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn, fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { ReconSide } from '../types';

interface ReconHistoryCardProps {
  side: ReconSide;
  item: SettleEventListItemDto;
  onReverse: (item: SettleEventListItemDto) => void;
}

/** 交易狀態標示（見 DESIGN.md Status Badge「應收／應付狀態標示」），比照 ReconTxnList 的 SETTLEMENT_STATUS_BADGE 寫法 */
const SIDE_BADGE: Record<ReconSide, { label: string; tone: 'info' | 'neutral' }> = {
  receivable: { label: '應收', tone: 'info' },
  payable: { label: '應付', tone: 'neutral' },
};

/** createdAt 為 ISO 字串（含時區位移），直接切片取時分即為當地時間 */
function formatTimeHHmm(createdAt: string): string {
  return createdAt.slice(11, 16);
}

/** 收／付款帳戶顯示：可能拆多個管道，全部列出；欄寬不夠時交由 truncate + title 顯示完整名單 */
function targetSummary(targetNames: string[]): string {
  return targetNames.length === 0 ? '—' : targetNames.join('、');
}

/** 桌機列金額欄：$ 與數字貼在一起靠欄位右緣顯示（同一欄每列右緣仍對齊成直排），
 *  不把 $ 單獨貼在欄位左緣——一列有多個金額欄並排時，$ 離數字太遠會讓版面看起來斷開、不像同一組金額；
 *  一律不顯示負號，無金額時顯示 0（比照其他金額欄格式，不特別弱化）。
 *  emphasis 用於本列唯一的主要數值欄（沖帳金額），僅以深淺色區分主次，字級與字重三欄一致 */
function DeskAmountCell({ amount, emphasis }: { amount: number; emphasis?: boolean }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-baseline justify-end gap-0.5 font-mono text-sm tabular-nums',
        emphasis ? 'w-24 text-neutral-dark' : 'w-20 text-neutral-mid',
      )}
    >
      <span className={emphasis ? 'text-neutral-mid' : 'text-neutral-blue-gray'}>$</span>
      <span>{Math.abs(amount).toLocaleString('en-US')}</span>
    </span>
  );
}

export default function ReconHistoryCard({ side, item, onReverse }: ReconHistoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isPayable = side === 'payable';
  const cashLabel = isPayable ? '實際付款金額' : '實際存入金額';
  const targetLabel = isPayable ? '付款帳戶' : '存入帳戶';
  const originAmountLabel = isPayable ? '應付金額' : '應收金額';
  const balanceLabel = isPayable ? '應付餘額' : '應收餘額';
  const targetText = targetSummary(item.targetNames);
  // 後端僅回傳沖帳金額與實際收付金額的合計差額，無法拆分手續費／額外項目明細，差額為 0 時不顯示該列（比照 TransactionSettlementHistory）
  const deduction = item.settleAmount - item.cashAmount;
  const chevronClass = cn('shrink-0 text-neutral-blue-gray transition-transform', expanded && 'rotate-180');

  const detailPanel = expanded && (
    <div className="mt-3 max-h-[240px] divide-y divide-neutral-blue-gray/20 overflow-y-auto rounded-md border border-neutral-blue-gray/20 bg-surface-cream">
      {item.details.map(d => (
        <div key={d.ledgerUuid} className="flex flex-col gap-1 px-3 py-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-neutral-dark">
              {formatYyyymmddRoc(d.voucherDate)}
              {d.voucherNumber && <span className="ml-2">{d.voucherNumber}</span>}
            </span>
            <span className="flex items-center gap-2">
              <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(d.amount)}</span>
              <Link
                href={`/ledger/${d.ledgerUuid}?side=${isPayable ? 'purchase' : 'sales'}`}
                target="_blank"
                rel="noopener noreferrer"
                title="查看原始交易憑證"
                className="text-neutral-mid hover:text-brand-blue"
              >
                <ExternalLink size={14} />
              </Link>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-neutral-mid">
            <span>{isPayable ? '應付' : '應收'} {fmtCurrency(d.originAmount)}</span>
            <span className="font-mono tabular-nums">{fmtCurrency(d.balanceAfter)}</span>
          </div>
          <span className="text-neutral-mid">
            {d.counterpartyLabel}：{d.counterpartyName}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* 行動版：卡片式，label 左數值右，維持原樣 */}
      <div className="min-[1300px]:hidden rounded-md border border-neutral-blue-gray/30 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-neutral-dark">{formatTimeHHmm(item.createdAt)}</span>
          <Badge tone={SIDE_BADGE[side].tone} variant="muted">
            {SIDE_BADGE[side].label}
          </Badge>
          <span className="text-neutral-mid">{item.counterpartyName}</span>
        </div>

        <div className="mt-2 flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-mid">{item.itemCount} 筆 · 沖帳金額</span>
            <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(item.settleAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-neutral-mid">
            <span>{originAmountLabel}</span>
            <span className="font-mono tabular-nums text-neutral-dark">{fmtCurrency(item.originAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-neutral-mid">
            <span>{balanceLabel}</span>
            <span className="font-mono tabular-nums text-neutral-dark">{fmtCurrency(item.balanceAfter)}</span>
          </div>
          {deduction !== 0 && (
            <div className="flex items-center justify-between text-neutral-mid">
              <span>手續費及額外金額</span>
              <span className="font-mono font-semibold tabular-nums text-neutral-dark">-{fmtCurrency(deduction)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-neutral-blue-gray/20 pt-1.5 text-neutral-mid">
            <span>{cashLabel}</span>
            <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(item.cashAmount)}</span>
          </div>
          {item.targetNames.length > 0 && (
            <div className="flex items-center justify-between text-neutral-mid">
              <span>{targetLabel}</span>
              <span className="text-neutral-dark">{item.targetNames.join('、')}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-neutral-blue-gray/20 pt-3">
          <button type="button" onClick={() => setExpanded(e => !e)} className="flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline">
            {expanded ? '收合' : `展開 ${item.itemCount} 筆`}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <Button variant="danger" size="sm" disabled={!item.canReverse} onClick={() => onReverse(item)}>
            復原此次沖帳
          </Button>
        </div>

        {detailPanel}
      </div>

      {/* 桌機：欄位化列，以時間為主軸，一列掃完一筆（比照 ReconTxnList 桌機列） */}
      <div className="hidden min-[1300px]:block">
        <div className="flex items-center gap-3 rounded-md bg-white px-3 py-2 text-sm hover:bg-surface-cream">
          <button type="button" onClick={() => setExpanded(e => !e)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <span className="w-14 shrink-0 font-mono text-xs text-neutral-mid">{formatTimeHHmm(item.createdAt)}</span>
            <span className="w-16 shrink-0">
              <Badge tone={SIDE_BADGE[side].tone} variant="muted">
                {SIDE_BADGE[side].label}
              </Badge>
            </span>
            <span className="w-28 min-w-0 shrink-0 truncate text-sm text-neutral-dark" title={item.counterpartyName}>
              {item.counterpartyName}
            </span>
            <span className="w-14 shrink-0 text-right text-xs text-neutral-mid">{item.itemCount} 筆</span>
            <DeskAmountCell amount={item.originAmount} />
            <DeskAmountCell amount={item.settleAmount} emphasis />
            <DeskAmountCell amount={deduction} />
            <DeskAmountCell amount={item.cashAmount} />
            <DeskAmountCell amount={item.balanceAfter} />
            <span className="ml-3 min-w-0 flex-1 truncate text-sm text-neutral-mid" title={item.targetNames.join('、')}>
              {targetText}
            </span>
            <ChevronDown size={16} className={chevronClass} />
          </button>
          <Button variant="danger" size="sm" disabled={!item.canReverse} onClick={() => onReverse(item)}>
            復原
          </Button>
        </div>

        {expanded && <div className="ml-14 mb-2">{detailPanel}</div>}
      </div>
    </div>
  );
}
