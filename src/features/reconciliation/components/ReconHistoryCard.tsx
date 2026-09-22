'use client';

import type { SettleEventListItemDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn, fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import { ArrowRight, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { ReconSide } from '../types';

interface ReconHistoryCardProps {
  side: ReconSide;
  item: SettleEventListItemDto;
  onReverse: (item: SettleEventListItemDto) => void;
}

/** 桌機列欄寬＋群組外距共用定義，與 ReconHistoryList 表頭逐欄對應，改欄寬時兩處不會走鐘。
 *  依語意分三群（識別／金額／帳戶），群間用 marginLeft 拉開，群內維持容器 gap-3（見 DESIGN.md Record Row 分組間距）。 */
export const HISTORY_COL = {
  time: 'w-14 shrink-0',
  status: 'w-16 shrink-0',
  counterparty: 'w-32 shrink-0',
  count: 'w-14 shrink-0 text-right',
  balanceBefore: 'w-28 shrink-0 text-right ml-4',
  balanceAfter: 'w-28 shrink-0 text-right',
  cashAmount: 'w-32 shrink-0 text-right',
  target: 'ml-6 min-w-0 flex-1',
} as const;

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
 *  負值（超沖／折讓）依會計慣例改用括號包住 $ 與數字，不出現負號，無金額時顯示 0（比照其他金額欄格式，不特別弱化）。
 *  emphasis 用於本列唯一的主要數值欄（實際存入／付款金額），僅以深淺色區分主次，字級與字重三欄一致。
 *  widthClassName 來自 HISTORY_COL，與表頭逐欄同寬，欄寬本身不含 gap（群組外距靠呼叫端的 ml-* 疊加）。 */
function DeskAmountCell({ amount, emphasis, widthClassName }: { amount: number; emphasis?: boolean; widthClassName: string }) {
  const negative = amount < 0;
  const signClass = emphasis ? 'text-neutral-mid' : 'text-neutral-blue-gray';
  return (
    <span
      className={cn(
        'flex items-baseline justify-end gap-0.5 font-mono text-sm tabular-nums',
        emphasis ? 'text-neutral-dark' : 'text-neutral-mid',
        widthClassName,
      )}
    >
      {negative && <span className={signClass}>(</span>}
      <span className={signClass}>$</span>
      <span>{Math.abs(amount).toLocaleString('en-US')}</span>
      {negative && <span className={signClass}>)</span>}
    </span>
  );
}

export default function ReconHistoryCard({ side, item, onReverse }: ReconHistoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isPayable = side === 'payable';
  const cashLabel = isPayable ? '實際付款金額' : '實際存入金額';
  const targetLabel = isPayable ? '付款帳戶' : '存入帳戶';
  const targetText = targetSummary(item.targetNames);
  const chevronClass = cn('shrink-0 text-neutral-blue-gray transition-transform', expanded && 'rotate-180');

  // 每筆原單明細僅保留識別資訊（日期／傳票號碼／對象／摘要）與沖前→沖後餘額變化，
  // 原單金額（應收/應付）不在此重複顯示——已可從上層「沖前餘額」對照得知，避免資訊重複
  const detailPanel = expanded && (
    <div className="mt-3 max-h-[240px] divide-y divide-neutral-blue-gray/20 overflow-y-auto rounded-md border border-neutral-blue-gray/20 bg-surface-cream">
      {item.details.map(d => (
        <div key={d.ledgerUuid} className="flex flex-col gap-1 px-3 py-2 text-xs">
          {/* 日期／餘額變化／連結固定同一行顯示，不受 counterpartyName、summary 是否有值影響；
              買受人與摘要各自獨立一行、無值時整行不渲染，避免留白看起來像漏了內容 */}
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-mono text-neutral-dark">
              {/* 日期與傳票號碼分成獨立 flex item，避免雙擊選字時因無真實空白字元而連帶選到日期 */}
              <span>{formatYyyymmddRoc(d.voucherDate)}</span>
              {d.voucherNumber && <span>{d.voucherNumber}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="flex items-center gap-1.5 font-mono tabular-nums text-neutral-mid">
                <span>{fmtCurrency(d.balanceBefore)}</span>
                <ArrowRight size={12} className="shrink-0 text-neutral-blue-gray" />
                <span className="font-semibold text-neutral-dark">{fmtCurrency(d.balanceAfter)}</span>
              </span>
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
          {d.counterpartyName && (
            <span className="truncate text-neutral-mid">
              {d.counterpartyLabel}：{d.counterpartyName}
            </span>
          )}
          {d.summary && (
            <span className="truncate text-neutral-mid" title={d.summary}>
              摘要：{d.summary}
            </span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* 行動版：卡片式，label 左數值右 */}
      <div className="min-[1300px]:hidden rounded-md border border-neutral-blue-gray/30 bg-white p-4">
        {/* 時間與筆數為同一層級的識別資訊，字級同步（text-sm），僅以粗細／深淺區分主次 */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-neutral-dark">{formatTimeHHmm(item.createdAt)}</span>
          <span className="text-neutral-mid">{item.itemCount} 筆</span>
          <Badge tone={SIDE_BADGE[side].tone} variant="muted">
            {SIDE_BADGE[side].label}
          </Badge>
          <span className="min-w-0 truncate text-neutral-mid">{item.counterpartyName}</span>
        </div>

        <div className="mt-2 flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between border-b border-neutral-blue-gray/20 pb-1.5">
            <span className="text-neutral-mid">{cashLabel}</span>
            <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(item.cashAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-neutral-mid">
            <span>沖前餘額</span>
            <span className="font-mono tabular-nums text-neutral-dark">{fmtCurrency(item.balanceBefore)}</span>
          </div>
          <div className="flex items-center justify-between text-neutral-mid">
            <span>沖後餘額</span>
            <span className="font-mono tabular-nums text-neutral-dark">{fmtCurrency(item.balanceAfter)}</span>
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
            <span className={cn(HISTORY_COL.time, 'font-mono text-sm text-neutral-mid')}>{formatTimeHHmm(item.createdAt)}</span>
            <span className={HISTORY_COL.status}>
              <Badge tone={SIDE_BADGE[side].tone} variant="muted">
                {SIDE_BADGE[side].label}
              </Badge>
            </span>
            <span className={cn(HISTORY_COL.counterparty, 'min-w-0 truncate text-sm text-neutral-dark')} title={item.counterpartyName}>
              {item.counterpartyName}
            </span>
            {/* 時間欄（上方同為 text-sm font-mono）與此欄字級同步，主次改由顏色（text-neutral-mid）承擔 */}
            <span className={cn(HISTORY_COL.count, 'text-sm text-neutral-mid')}>{item.itemCount} 筆</span>
            <DeskAmountCell amount={item.balanceBefore} widthClassName={HISTORY_COL.balanceBefore} />
            <DeskAmountCell amount={item.balanceAfter} widthClassName={HISTORY_COL.balanceAfter} />
            <DeskAmountCell amount={item.cashAmount} emphasis widthClassName={HISTORY_COL.cashAmount} />
            <span className={cn(HISTORY_COL.target, 'truncate text-sm text-neutral-mid')} title={item.targetNames.join('、')}>
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
