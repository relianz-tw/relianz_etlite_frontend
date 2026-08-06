'use client';

import type { SettleReceivableSummaryResult } from '@/api/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency } from '@/lib/utils';

interface ReconSettleResultModalProps {
  open: boolean;
  result: SettleReceivableSummaryResult | null;
  onClose: () => void;
}

type BadgeTone = 'success' | 'error' | 'info' | 'neutral';

/** settlementStatus：0平衡 1超沖 2少沖；比照既有沖帳狀態徽章配色慣例 */
const SETTLEMENT_STATUS_BADGE: Record<number, { label: string; tone: BadgeTone }> = {
  0: { label: '平衡', tone: 'success' },
  1: { label: '超沖', tone: 'error' },
  2: { label: '少沖', tone: 'info' },
};

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark';

/** 沖帳執行結果：呼叫 settle/summary 成功後，顯示本次實際入帳的摘要與各原單明細 */
export default function ReconSettleResultModal({ open, result, onClose }: ReconSettleResultModalProps) {
  if (!open || !result) return null;

  const summaryRows: { label: string; value: string }[] = [
    { label: '沖帳總額', value: fmtCurrency(result.settleAmount) },
    { label: '有沖帳筆數', value: `${result.affectedCount} 筆` },
    { label: '沖前剩餘合計', value: fmtCurrency(result.totalBeforeRemaining) },
    { label: '付款日', value: result.paymentDate },
    { label: '結算單號', value: result.settlementOrderCode },
  ];

  return (
    <Modal open onClose={onClose} title="沖帳結果" widthClassName="max-w-[840px]">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm nav:grid-cols-3">
        {summaryRows.map(row => (
          <div key={row.label} className="flex items-center justify-between gap-2">
            <span className="text-neutral-mid">{row.label}</span>
            <span className="font-mono font-semibold tabular-nums text-neutral-dark">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-neutral-blue-gray/30">
        <table className="w-full min-w-[720px] border-collapse">
          <thead className="bg-surface-off-white">
            <tr className="border-b border-neutral-blue-gray/40">
              <th className={thClass}>交易編號</th>
              <th className={thClass}>交易日</th>
              <th className={`${thClass} text-right`}>沖前剩餘</th>
              <th className={`${thClass} text-right`}>本次沖帳</th>
              <th className={`${thClass} text-right`}>沖後剩餘</th>
              <th className={thClass}>狀態</th>
              <th className={thClass}>結算單號</th>
            </tr>
          </thead>
          <tbody>
            {result.allocations.map((a, i) => {
              const badge = SETTLEMENT_STATUS_BADGE[a.settlementStatus] ?? { label: '未知狀態', tone: 'neutral' as const };
              return (
                <tr key={a.ledgerUuid} className={`border-b border-neutral-blue-gray/20 last:border-0 ${i % 2 === 1 ? 'bg-surface-warm/30' : ''}`}>
                  <td className={tdClass}>{a.orderCode}</td>
                  <td className={`${tdClass} font-mono`}>{a.transactionDate ?? '—'}</td>
                  <td className={`${tdClass} text-right font-mono tabular-nums`}>{fmtCurrency(a.beforeRemaining)}</td>
                  <td className={`${tdClass} text-right font-mono tabular-nums font-semibold`}>{fmtCurrency(a.settleAmount)}</td>
                  <td className={`${tdClass} text-right font-mono tabular-nums`}>{fmtCurrency(a.afterRemaining)}</td>
                  <td className={tdClass}>
                    <Badge tone={badge.tone} variant="muted">
                      {badge.label}
                    </Badge>
                  </td>
                  <td className={`${tdClass} font-mono`}>{a.settlementOrderCode ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="primary" onClick={onClose}>
          關閉
        </Button>
      </div>
    </Modal>
  );
}
