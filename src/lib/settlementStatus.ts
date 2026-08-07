import type { BadgeTone } from '@/components/ui/Badge';

export interface SettlementStatusBadgeInfo {
  label: string;
  tone: BadgeTone;
}

/** settlementStatus：0平衡 1超沖 2少沖；未知值一律顯示中性樣式，避免畫面出錯 */
const SETTLEMENT_STATUS_BADGE: Record<number, SettlementStatusBadgeInfo> = {
  0: { label: '平衡', tone: 'success' },
  1: { label: '超沖', tone: 'error' },
  2: { label: '少沖', tone: 'info' },
};

export function getSettlementStatusBadge(status: number): SettlementStatusBadgeInfo {
  return SETTLEMENT_STATUS_BADGE[status] ?? { label: '未知狀態', tone: 'neutral' };
}
