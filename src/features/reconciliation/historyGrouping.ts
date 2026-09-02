import type { SettleEventListItemDto } from '@/api/types';
import { formatYyyymmddRoc } from '@/lib/utils';

export interface SettleEventHistoryGroup {
  /** 付款／收款日，YYYYMMDD */
  dateKey: string;
  /** 民國年 YYY/MM/DD，供分組標頭顯示 */
  label: string;
  items: SettleEventListItemDto[];
}

/** 依 paymentDate 分組，組內依 createdAt 新到舊排序；組間依日期新到舊排序（比照 JournalCard 的 sort→分組模式） */
export function groupSettleEventsByDate(items: SettleEventListItemDto[]): SettleEventHistoryGroup[] {
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const map = new Map<string, SettleEventListItemDto[]>();
  for (const item of sorted) {
    const bucket = map.get(item.paymentDate);
    if (bucket) bucket.push(item);
    else map.set(item.paymentDate, [item]);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateKey, groupItems]) => ({ dateKey, label: formatYyyymmddRoc(dateKey), items: groupItems }));
}
