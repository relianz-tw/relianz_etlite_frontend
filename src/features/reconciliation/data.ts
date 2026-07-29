import { parseRocDate } from '@/components/ui/DatePicker';
import type { ReconTxnRef } from './types';

/**
 * 匯總沖帳的交易挑選演算法：依日期由舊到新依序累加，加入下一筆會超過輸入金額（扣除手續費後）時即停止，
 * 避免沖過頭；未被累加到的交易維持待沖帳狀態（少沖），累加後仍有餘額則視為超額（多收/多付，另立調整項）。
 */
export function allocateTxnsToAmount(rows: ReconTxnRef[], targetAmount: number): { matched: ReconTxnRef[]; matchedAmount: number; unmatched: ReconTxnRef[] } {
  const sorted = [...rows].sort((a, b) => (parseRocDate(a.date)?.getTime() ?? 0) - (parseRocDate(b.date)?.getTime() ?? 0));
  const matched: ReconTxnRef[] = [];
  let matchedAmount = 0;
  for (const row of sorted) {
    if (matchedAmount + row.amount > targetAmount) break;
    matched.push(row);
    matchedAmount += row.amount;
  }
  const matchedIds = new Set(matched.map(r => r.id));
  const unmatched = sorted.filter(r => !matchedIds.has(r.id));
  return { matched, matchedAmount, unmatched };
}
