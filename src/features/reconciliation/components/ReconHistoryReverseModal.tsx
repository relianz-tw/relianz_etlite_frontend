'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import type { SettleEventListItemDto } from '@/api/types';
import { AlertTriangle } from 'lucide-react';

interface ReconHistoryReverseModalProps {
  open: boolean;
  item: SettleEventListItemDto | null;
  submitting?: boolean;
  submitError?: string;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * 沖帳紀錄卡片的復原確認彈窗，比照交易明細頁 SettlementReverseConfirmModal 的結構，
 * 差別是明細已隨列表 API 一次帶回（見 item.details），不需要懶載入關聯交易。
 */
export default function ReconHistoryReverseModal({ open, item, submitting, submitError, onClose, onConfirm }: ReconHistoryReverseModalProps) {
  if (!open || !item) return null;

  return (
    <Modal open onClose={onClose} title="恢復沖帳紀錄" widthClassName="max-w-[520px]">
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-neutral-mid">沖帳日期</span>
          <span className="font-mono font-semibold tabular-nums text-neutral-dark">{formatYyyymmddRoc(item.paymentDate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-mid">沖帳金額</span>
          <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(item.settleAmount)}</span>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-neutral-dark">本次將恢復的交易（{item.details.length}）</p>
        {item.details.length === 0 ? (
          <p className="text-xs text-neutral-mid">查無關聯交易</p>
        ) : (
          <div className="max-h-[240px] divide-y divide-neutral-blue-gray/20 overflow-y-auto rounded-md border border-neutral-blue-gray/20">
            {item.details.map(d => (
              <div key={d.ledgerUuid} className="flex flex-col gap-1 px-3 py-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-neutral-dark">
                    {formatYyyymmddRoc(d.voucherDate) || '—'}
                    {d.voucherNumber && <span className="ml-2">{d.voucherNumber}</span>}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(d.amount)}</span>
                </div>
                <span className="text-neutral-mid">
                  {d.counterpartyLabel}：{d.counterpartyName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-md bg-semantic-error/10 p-3 text-sm text-semantic-error">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <p>
          {item.reconMethod === 2
            ? '此筆為多筆沖帳，恢復後系統會一併恢復當初同批沖帳的所有交易，確定要恢復嗎？'
            : '恢復後此筆交易將回到待沖狀態，確定要恢復嗎？'}
        </p>
      </div>

      {submitError && <p className="mt-3 text-sm text-semantic-error">{submitError}</p>}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          取消
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={submitting}>
          {submitting ? '處理中…' : '確定恢復'}
        </Button>
      </div>
    </Modal>
  );
}
