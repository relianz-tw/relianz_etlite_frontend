import type { EntryDetailSettlementDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import { fmtCurrency, formatYyyymmdd } from '@/lib/utils';

export default function TransactionSettlementHistory({ settlements }: { settlements: EntryDetailSettlementDto[] }) {
  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <h2 className="mb-5 text-base font-semibold text-neutral-dark">沖帳紀錄</h2>
      {settlements.length === 0 ? (
        <p className="text-sm text-neutral-mid">尚無沖帳紀錄</p>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-blue-gray/20">
          {settlements.map(item => {
            const entryDate = item.settlement?.entryDate;
            return (
              <div key={item.relationUuid} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-dark">{entryDate ? formatYyyymmdd(entryDate) : '—'}</span>
                  <Badge tone={item.isOpen ? 'info' : 'success'} variant="muted">
                    {item.isOpen ? '尚有餘額' : '已結清'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-mid">
                  <span>沖帳金額</span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(item.settlementAmount)}</span>
                </div>
                <p className="text-xs text-neutral-mid">
                  沖帳前 {fmtCurrency(item.beforeSettlementAmount)} → 沖帳後 {fmtCurrency(item.afterSettlementAmount)}
                </p>
                {item.remark && <p className="text-xs text-neutral-mid">備註：{item.remark}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
