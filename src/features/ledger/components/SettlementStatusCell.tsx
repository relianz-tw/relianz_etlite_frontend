import Badge from '@/components/ui/Badge';
import { fmtCurrency } from '@/lib/utils';
import { getSettlementStatusBadge } from '@/lib/settlementStatus';

interface SettlementStatusCellProps {
  settledAmount?: number;
  remainingAmount?: number;
  settlementStatus?: number;
}

/**
 * 已沖帳金額 + 剩餘未沖帳的緊湊顯示：remainingAmount 可能為負（超沖），
 * 故不直接顯示負數，改用徽章文字區分「超沖／剩餘／已結清」並依 settlementStatus 上色。
 * 供帳簿應收帳款/應付帳款分頁的桌機表格與手機卡片共用；已收款/已付款分頁不使用此欄位。
 */
export default function SettlementStatusCell({ settledAmount, remainingAmount, settlementStatus }: SettlementStatusCellProps) {
  if (settledAmount === undefined || remainingAmount === undefined || settlementStatus === undefined) return null;
  const badge = getSettlementStatusBadge(settlementStatus);
  const remainingLabel = settlementStatus === 1 ? `超沖 ${fmtCurrency(Math.abs(remainingAmount))}` : settlementStatus === 0 ? '已結清' : `剩 ${fmtCurrency(remainingAmount)}`;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-neutral-mid">已沖 {fmtCurrency(settledAmount)}</span>
      <Badge tone={badge.tone} variant="muted">
        {remainingLabel}
      </Badge>
    </div>
  );
}
