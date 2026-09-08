import type { SortDir } from '@/lib/utils';

export type FixedAssetStatus = 'active' | 'completed';
export type FixedAssetStatusFilter = FixedAssetStatus | 'all';

export type FixedAssetRow = {
  id: string;
  name: string;
  subject: string;
  /** YYYYMMDD 格式 */
  acquiredDate: string;
  usefulLifeYears: number;
  originalAmount: number;
  /** 剩餘可扣抵餘額，由後端計算提供 */
  remainingAmount: number;
  /** 使用中 / 已折舊完畢，由後端判定 */
  status: FixedAssetStatus;
};

export type SortKey = 'acquiredDate' | 'name' | 'originalAmount' | 'remainingAmount';

export interface SortState {
  key: SortKey | null;
  dir: SortDir;
}
