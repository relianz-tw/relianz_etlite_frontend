'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import { getSettlementStatusBadge } from '@/lib/settlementStatus';
import type { ReconSettleResult, ReconSide } from '../types';

interface ReconSettleResultModalProps {
  open: boolean;
  side: ReconSide;
  groupLabel: string;
  result: ReconSettleResult | null;
  onClose: () => void;
}

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark';

/** 沖帳執行結果：呼叫 settle/summary 成功後，顯示本次實際入帳的摘要（含沖前/沖後餘額）與各原單明細 */
export default function ReconSettleResultModal({ open, side, groupLabel, result, onClose }: ReconSettleResultModalProps) {
  if (!open || !result) return null;

  // wrap 'nowrap'：金額／筆數／日期等短值不換行；'break'：結算單號可能很長，逐字斷行避免只在連字號處攔腰折斷
  const summaryRows: { label: string; value: string; wrap: 'nowrap' | 'break' }[] = [
    { label: side === 'receivable' ? '銷售管道' : '廠商', value: groupLabel, wrap: 'break' as const },
    { label: '沖帳總額', value: fmtCurrency(result.settleAmount), wrap: 'nowrap' as const },
    { label: '有沖帳筆數', value: `${result.allocations.length} 筆`, wrap: 'nowrap' as const },
    { label: '沖前餘額', value: fmtCurrency(result.balanceBefore), wrap: 'nowrap' as const },
    { label: '沖後餘額', value: fmtCurrency(result.balanceAfter), wrap: 'nowrap' as const },
    {
      label: result.paymentDate ? (side === 'receivable' ? '收款日' : '付款日') : '',
      value: result.paymentDate ? formatYyyymmddRoc(result.paymentDate) : '',
      wrap: 'nowrap' as const,
    },
    { label: '結算單號', value: result.settlementOrderCode ?? '—', wrap: 'break' as const },
  ].filter(row => row.label);

  return (
    <Modal open onClose={onClose} title="沖帳結果" widthClassName="max-w-[840px]">
      <div className="grid grid-cols-1 gap-y-2 text-sm nav:grid-cols-3 nav:gap-x-6">
        {summaryRows.map(row => (
          <div key={row.label} className="flex items-center justify-between gap-2">
            <span className="shrink-0 text-neutral-mid">{row.label}</span>
            <span className={`font-mono font-semibold tabular-nums text-neutral-dark ${row.wrap === 'nowrap' ? 'whitespace-nowrap' : 'break-all text-right'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* 行動版：卡片式列表，避免窄螢幕橫向滑動表格導致狀態欄被切到看不見；筆數多時內容過長，限制最大高度可捲動，
          避免使用者要捲好幾個螢幕才找得到底部的「關閉」鈕（見下方 sticky 動作列） */}
      <div className="mt-4 flex max-h-[55vh] flex-col gap-2 overflow-y-auto overscroll-contain nav:hidden nav:max-h-none nav:overflow-visible">
        {result.allocations.map(a => {
          const badge = getSettlementStatusBadge(a.settlementStatus);
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
                  <span className="text-neutral-mid">沖前剩餘</span>
                  <span className="font-mono tabular-nums text-neutral-dark">{fmtCurrency(a.beforeRemaining)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-mid">本次沖帳</span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(a.settleAmount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-mid">沖後剩餘</span>
                  <span className="font-mono tabular-nums text-neutral-dark">{fmtCurrency(a.afterRemaining)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 桌機：欄位化表格 */}
      <div className="mt-4 hidden overflow-x-auto rounded-md border border-neutral-blue-gray/30 nav:block">
        <table className="w-full min-w-[720px] border-collapse">
          <thead className="bg-surface-off-white">
            <tr className="border-b border-neutral-blue-gray/40">
              <th className={thClass}>交易編號</th>
              <th className={thClass}>交易日</th>
              <th className={`${thClass} text-right`}>沖前剩餘</th>
              <th className={`${thClass} text-right`}>本次沖帳</th>
              <th className={`${thClass} text-right`}>沖後剩餘</th>
              <th className={thClass}>狀態</th>
            </tr>
          </thead>
          <tbody>
            {result.allocations.map((a, i) => {
              const badge = getSettlementStatusBadge(a.settlementStatus);
              return (
                <tr key={a.ledgerUuid} className={`border-b border-neutral-blue-gray/20 last:border-0 ${i % 2 === 1 ? 'bg-surface-warm/30' : ''}`}>
                  <td className={tdClass}>{a.orderCode}</td>
                  <td className={`${tdClass} font-mono`}>{a.transactionDate ? formatYyyymmddRoc(a.transactionDate) : '—'}</td>
                  <td className={`${tdClass} text-right font-mono tabular-nums`}>{fmtCurrency(a.beforeRemaining)}</td>
                  <td className={`${tdClass} text-right font-mono tabular-nums font-semibold`}>{fmtCurrency(a.settleAmount)}</td>
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

      {/* 手機上筆數多時內容可能高達數千 px，關閉鈕黏在底部，避免使用者要捲到最底才找得到唯一的關閉出口；
          負 margin 對齊 Modal 面板內距（手機 p-4／桌機 p-6，見 Modal.tsx） */}
      <div className="sticky bottom-0 -mx-4 -mb-4 mt-6 flex justify-end border-t border-neutral-blue-gray/30 bg-white px-4 py-3 nav:static nav:mx-0 nav:mb-0 nav:mt-6 nav:border-0 nav:bg-transparent nav:px-0 nav:py-0">
        <Button variant="primary" onClick={onClose} className="w-full nav:w-auto">
          關閉
        </Button>
      </div>
    </Modal>
  );
}
