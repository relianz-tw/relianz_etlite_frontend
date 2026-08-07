import type { EntryDetailSettleEventDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { fmtCurrency, formatYyyymmdd } from '@/lib/utils';
import type { Side } from '../../types';

interface TransactionSettlementHistoryProps {
  side: Side;
  settleEvents: EntryDetailSettleEventDto[];
  /** 僅手動沖帳（reconMethod=0）提供，點擊後先恢復該筆再重新沖帳一次 */
  onEdit: (event: EntryDetailSettleEventDto) => void;
  onReverse: (event: EntryDetailSettleEventDto) => void;
}

/** reconMethod：0 手動沖帳／2 匯總沖帳；其餘值視為未知方式，不顯示標籤 */
const RECON_METHOD_BADGE: Record<number, string> = {
  0: '手動沖帳',
  2: '匯總沖帳',
};

export default function TransactionSettlementHistory({ side, settleEvents, onEdit, onReverse }: TransactionSettlementHistoryProps) {
  const cashLabel = side === 'sales' ? '實際存入' : '實際付款';

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <h2 className="mb-5 text-base font-semibold text-neutral-dark">沖帳紀錄</h2>
      {settleEvents.length === 0 ? (
        <p className="text-sm text-neutral-mid">尚無沖帳紀錄</p>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-blue-gray/20">
          {settleEvents.map(event => {
            const methodLabel = RECON_METHOD_BADGE[event.reconMethod];
            return (
              <div key={event.settleEventUuid} className={`flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0 ${event.isReverse ? 'text-neutral-mid' : ''}`}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-medium text-neutral-dark">
                    {formatYyyymmdd(event.paymentDate)}
                    {methodLabel && (
                      <Badge tone={event.reconMethod === 0 ? 'neutral' : 'info'} variant="muted">
                        {methodLabel}
                      </Badge>
                    )}
                    {event.isReverse && (
                      <Badge tone="error" variant="muted">
                        已撤銷
                      </Badge>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-mid">
                  <span>沖帳金額</span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(event.settleAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-mid">
                  <span>{cashLabel}</span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(event.cashAmount)}</span>
                </div>
                <p className="text-xs text-neutral-mid">
                  廠商／管道餘額 {fmtCurrency(event.balanceBefore)} → {fmtCurrency(event.balanceAfter)}
                </p>
                {event.canReverse && (
                  <div className="mt-1 flex justify-end gap-2">
                    {event.reconMethod === 0 && (
                      <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                        編輯金額
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => onReverse(event)}>
                      恢復沖帳紀錄
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
