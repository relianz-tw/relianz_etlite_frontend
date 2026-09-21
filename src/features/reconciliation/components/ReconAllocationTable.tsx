'use client';

import Badge from '@/components/ui/Badge';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import { getSettlementStatusBadge } from '@/lib/settlementStatus';
import type { SettleLedgerAllocation } from '@/api/types';
import type { ReconAllocationInfo, ReconSide } from '../types';

interface ReconAllocationTableProps {
  allocations: SettleLedgerAllocation[];
  side: ReconSide;
  /** ledgerUuid → 買受人／賣方與憑證號碼（見 ReconAllocationInfo 說明），沖帳 API 回應本身不含這兩個欄位 */
  allocationInfoByUuid: Map<string, ReconAllocationInfo>;
  /** 反向沖帳（見 settle.ts 的 isReversedSettleResult）：true 時「本次付款／收款」取絕對值顯示，
   * 「應收金額」「付款餘額」屬餘額性質維持會計括號表示法不變 */
  reversed?: boolean;
}

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark';

/**
 * 各原單拆帳明細表：交易編號／憑證號碼／買受人(賣方)／交易日／應收金額／本次付款(收款)／付款餘額／狀態。
 * 手機用卡片、桌機用表格，供確認沖帳彈窗（ReconConfirmSummaryModal）與結果彈窗（ReconSettleResultModal）共用。
 */
export default function ReconAllocationTable({ allocations, side, allocationInfoByUuid, reversed = false }: ReconAllocationTableProps) {
  const counterpartyLabel = side === 'payable' ? '賣方' : '買受人';
  const settleAmountLabel = side === 'payable' ? '本次付款' : '本次收款';
  // 反向沖帳時「本次付款／收款」是本次實際移動的金額，方向已由外層彈窗翻面表達，不再帶負號
  const fmtSettleAmount = (n: number) => fmtCurrency(reversed ? Math.abs(n) : n);

  return (
    <>
      {/* 行動版：卡片式列表，避免窄螢幕橫向滑動表格導致狀態欄被切到看不見；筆數多時內容過長，限制最大高度可捲動 */}
      <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto overscroll-contain min-[1300px]:hidden min-[1300px]:max-h-none min-[1300px]:overflow-visible">
        {allocations.map(a => {
          const badge = getSettlementStatusBadge(a.settlementStatus);
          const info = allocationInfoByUuid.get(a.ledgerUuid);
          return (
            <div key={a.ledgerUuid} className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-neutral-dark">{a.orderCode}</span>
                <Badge tone={badge.tone} variant="muted">
                  {badge.label}
                </Badge>
              </div>
              <span className="font-mono text-xs text-neutral-mid">{a.transactionDate ? formatYyyymmddRoc(a.transactionDate) : '—'}</span>
              <div className="mt-2 flex flex-col gap-1 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-mid">憑證號碼</span>
                  <span className="font-mono tabular-nums text-neutral-dark">{info?.voucherNumber || '—'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-mid">{counterpartyLabel}</span>
                  <span className="text-neutral-dark">{info?.counterparty || '—'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-mid">應收金額</span>
                  <span className="font-mono tabular-nums text-neutral-dark">{fmtCurrency(a.beforeRemaining)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-mid">{settleAmountLabel}</span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtSettleAmount(a.settleAmount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-mid">付款餘額</span>
                  <span className="font-mono tabular-nums text-neutral-dark">{fmtCurrency(a.afterRemaining)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 桌機：欄位化表格 */}
      <div className="hidden overflow-x-auto rounded-md border border-neutral-blue-gray/30 min-[1300px]:block">
        <table className="w-full min-w-[920px] border-collapse">
          <thead className="bg-surface-off-white">
            <tr className="border-b border-neutral-blue-gray/40">
              <th className={thClass}>交易編號</th>
              <th className={thClass}>憑證號碼</th>
              <th className={thClass}>{counterpartyLabel}</th>
              <th className={thClass}>交易日</th>
              <th className={`${thClass} text-right`}>應收金額</th>
              <th className={`${thClass} text-right`}>{settleAmountLabel}</th>
              <th className={`${thClass} text-right`}>付款餘額</th>
              <th className={thClass}>狀態</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((a, i) => {
              const badge = getSettlementStatusBadge(a.settlementStatus);
              const info = allocationInfoByUuid.get(a.ledgerUuid);
              return (
                <tr key={a.ledgerUuid} className={`border-b border-neutral-blue-gray/20 last:border-0 ${i % 2 === 1 ? 'bg-surface-warm/30' : ''}`}>
                  <td className={tdClass}>{a.orderCode}</td>
                  <td className={`${tdClass} font-mono`}>{info?.voucherNumber || '—'}</td>
                  <td className={tdClass}>{info?.counterparty || '—'}</td>
                  <td className={`${tdClass} font-mono`}>{a.transactionDate ? formatYyyymmddRoc(a.transactionDate) : '—'}</td>
                  <td className={`${tdClass} text-right font-mono tabular-nums`}>{fmtCurrency(a.beforeRemaining)}</td>
                  <td className={`${tdClass} text-right font-mono tabular-nums font-semibold`}>{fmtSettleAmount(a.settleAmount)}</td>
                  <td className={`${tdClass} text-right font-mono tabular-nums`}>{fmtCurrency(a.afterRemaining)}</td>
                  <td className={tdClass}>
                    <Badge tone={badge.tone} variant="muted">
                      {badge.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
