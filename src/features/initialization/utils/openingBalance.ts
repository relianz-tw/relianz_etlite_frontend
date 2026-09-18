import type { BalanceField, BalanceGroup, InitializationState } from '../state/initializationReducer';

/** 期初表欄位 key → 所屬分組，供套用文件辨識結果（扁平 Record）時分流到正確的 assets/liabilities/equity */
const FIELD_GROUP_MAP: Record<string, BalanceGroup> = {
  cash: 'assets',
  bankDeposits: 'assets',
  accountsReceivable: 'assets',
  inventory: 'assets',
  businessTaxCredit: 'assets',
  fixedAssets: 'assets',
  accountsPayable: 'liabilities',
  shortTermLoans: 'liabilities',
  ownerCurrentAccount: 'liabilities',
  registeredCapital: 'equity',
  retainedEarnings: 'equity',
};

/** 依 FIELD_GROUP_MAP 將辨識 API 回傳的扁平欄位分流成各分組的 Record，未知欄位名稱忽略 */
export function groupRecognizedFields(fields: Record<string, number>): Partial<Record<BalanceGroup, Record<string, number>>> {
  const grouped: Partial<Record<BalanceGroup, Record<string, number>>> = {};
  for (const [key, value] of Object.entries(fields)) {
    const group = FIELD_GROUP_MAP[key];
    if (!group) continue;
    grouped[group] = { ...(grouped[group] ?? {}), [key]: value };
  }
  return grouped;
}

export interface BalanceTotals {
  assetsTotal: number;
  liabilitiesTotal: number;
  equityTotal: number;
  /** 資產合計 - (負債合計 + 權益合計)，0 表示借貸平衡 */
  diff: number;
  isBalanced: boolean;
}

/** 計算期初表借貸平衡狀態，供 3B 校正頁與 4 確認頁共用 */
export function calcBalanceTotals(balance: InitializationState['openingBalance']): BalanceTotals {
  const assetsTotal = Object.values(balance.assets).reduce((sum, f) => sum + f.value, 0);
  const liabilitiesTotal = Object.values(balance.liabilities).reduce((sum, f) => sum + f.value, 0);
  const equityTotal = Object.values(balance.equity).reduce((sum, f) => sum + f.value, 0);
  const diff = assetsTotal - (liabilitiesTotal + equityTotal);

  return { assetsTotal, liabilitiesTotal, equityTotal, diff, isBalanced: diff === 0 };
}

/** 將一個分組的 BalanceField 物件轉為 API 送出用的扁平 { key: value } Record（去除 aiFilled 標記） */
export function flattenBalanceGroup(group: Record<string, BalanceField>): Record<string, number> {
  return Object.fromEntries(Object.entries(group).map(([key, field]) => [key, field.value]));
}
