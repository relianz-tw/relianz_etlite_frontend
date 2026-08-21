'use client';

import type { EntryDetailSettleEventDto } from '@/api/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import type { SettleOriginVoucher } from '../settleEventOrigins';

interface SettlementReverseConfirmModalProps {
  open: boolean;
  event: EntryDetailSettleEventDto | null;
  /** 本次沖帳事件關聯的業務原單憑證摘要（懶載入，見 useSettleEventOrigins） */
  origins: SettleOriginVoucher[];
  originsLoading: boolean;
  originsError: string;
  submitting?: boolean;
  submitError?: string;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * 恢復沖帳紀錄前的確認彈窗。僅多筆沖帳（reconMethod=2）觸發此彈窗（單筆沖帳改由「編輯金額」填 0 恢復），
 * 撤銷時後端會一併恢復當初同批沖帳的所有交易，故列出關聯業務原單憑證並加上警示文字，
 * 避免使用者誤以為只會影響當前這筆交易。關聯清單載入失敗不擋恢復操作，僅顯示錯誤訊息。
 */
export default function SettlementReverseConfirmModal({
  open,
  event,
  origins,
  originsLoading,
  originsError,
  submitting,
  submitError,
  onClose,
  onConfirm,
}: SettlementReverseConfirmModalProps) {
  if (!open || !event) return null;

  return (
    <Modal open onClose={onClose} title="恢復沖帳紀錄" widthClassName="max-w-[520px]">
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-neutral-mid">沖帳日期</span>
          <span className="font-mono font-semibold tabular-nums text-neutral-dark">{formatYyyymmddRoc(event.paymentDate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-mid">沖帳金額</span>
          <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(event.settleAmount)}</span>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-neutral-dark">本次將恢復的交易（{origins.length}）</p>
        {originsLoading && <p className="text-xs text-neutral-mid">載入關聯交易中…</p>}
        {!originsLoading && originsError && <p className="text-xs text-semantic-error">{originsError}</p>}
        {!originsLoading && !originsError && origins.length === 0 && <p className="text-xs text-neutral-mid">查無關聯交易</p>}
        {!originsLoading && !originsError && origins.length > 0 && (
          <div className="max-h-[240px] divide-y divide-neutral-blue-gray/20 overflow-y-auto rounded-md border border-neutral-blue-gray/20">
            {origins.map(origin => (
              <div key={origin.ledgerUuid} className="flex flex-col gap-1 px-3 py-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-neutral-dark">
                    {origin.voucherDate || '—'}
                    {origin.voucherNumber && <span className="ml-2">{origin.voucherNumber}</span>}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(origin.totalAmount)}</span>
                </div>
                <span className="text-neutral-mid">
                  {origin.counterpartyLabel}：{origin.counterpartyName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-md bg-semantic-error/10 p-3 text-sm text-semantic-error">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <p>此筆為多筆沖帳，恢復後系統會一併恢復當初同批沖帳的所有交易，確定要恢復嗎？</p>
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
