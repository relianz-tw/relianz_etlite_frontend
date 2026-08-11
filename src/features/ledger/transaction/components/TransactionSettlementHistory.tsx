import type { EntryDetailSettleEventDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';

interface TransactionSettlementHistoryProps {
  /** 1 銷項／2 進項；決定待收／待付、實際存入／付款等名詞 */
  buyOrSell: number;
  settleEvents: EntryDetailSettleEventDto[];
  /** 僅單筆沖帳（reconMethod=0）提供；沖帳金額填 0 即等於恢復（撤銷）此筆紀錄 */
  onEdit: (event: EntryDetailSettleEventDto) => void;
  /** 僅多筆沖帳（reconMethod=2）提供；會一併恢復同批所有交易 */
  onReverse: (event: EntryDetailSettleEventDto) => void;
}

export default function TransactionSettlementHistory({ buyOrSell, settleEvents, onEdit, onReverse }: TransactionSettlementHistoryProps) {
  const isPurchase = buyOrSell === 2;
  const remainingLabel = isPurchase ? '待付金額' : '待收金額';
  const cashLabel = isPurchase ? '實際付款金額' : '實際存入金額';
  // 已撤銷的沖帳紀錄不再佔用畫面，只顯示目前仍有效的筆數
  const activeEvents = settleEvents.filter(event => !event.isReverse);

  if (activeEvents.length === 0) {
    return <p className="text-sm text-neutral-mid">尚無沖帳紀錄</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-blue-gray/20">
      {activeEvents.map(event => {
        // 後端僅回傳沖帳金額與實際收付金額的合計差額，無法拆分手續費／額外項目明細，差額為 0 時不顯示該列
        const deduction = event.settleAmount - event.cashAmount;
        return (
          <div key={event.settleEventUuid} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-neutral-dark">
                {formatYyyymmddRoc(event.paymentDate)}
                {event.reconMethod === 2 && (
                  <Badge tone="info" variant="muted">
                    多筆沖帳
                  </Badge>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-neutral-mid">
              <span>{remainingLabel}</span>
              <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(event.settleAmount)}</span>
            </div>
            {deduction !== 0 && (
              <div className="flex items-center justify-between text-sm text-neutral-mid">
                <span>手續費及額外金額</span>
                <span className="font-mono font-semibold tabular-nums text-neutral-dark">-{fmtCurrency(deduction)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-neutral-blue-gray/20 pt-1.5 text-sm text-neutral-mid">
              <span>{cashLabel}</span>
              <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(event.cashAmount)}</span>
            </div>
            {event.canReverse && (
              <div className="mt-1 flex justify-end gap-2">
                {event.reconMethod === 0 ? (
                  <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                    編輯金額
                  </Button>
                ) : (
                  <Button variant="danger" size="sm" onClick={() => onReverse(event)}>
                    恢復沖帳紀錄
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
