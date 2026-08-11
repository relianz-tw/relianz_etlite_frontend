import { parseRocDate } from '@/components/ui/DatePicker';
import type { PurchaseRow, SalesRow } from '@/features/ledger/types';
import type { ReconTxnRef } from './types';

/** 側邊欄「其他」群組：找不到對應啟用中管道/廠商 uuid 的交易（含未指定與已停用/未知 uuid） */
export const OTHER_GROUP_KEY = '__OTHER__';
export const OTHER_GROUP_LABEL = '其他';

/** 側邊欄「全部管道」：唯讀列出整張交易清單，不參與沖帳勾選 */
export const ALL_GROUP_KEY = '__ALL__';
export const ALL_GROUP_LABEL = '全部管道';

/** 側邊欄可選群組（銷售管道或廠商），key 一律為 uuid */
export interface ReconGroupOption {
  uuid: string;
  name: string;
  /** 該銷售管道／廠商的當前餘額（GET channelRules／vendors 回應新增欄位） */
  balance: number;
}

export interface ReconGroup {
  key: string;
  label: string;
  /** 該群組尚未沖帳（已排除作廢/已沖帳）的交易筆數 */
  count: number;
  /** 該群組尚未沖帳交易金額加總 */
  amount: number;
  /** 該群組的當前餘額；「全部管道」／前端合成的「其他」無對應實體，故為 undefined */
  balance?: number;
}

/** 「其他」內依原始 groupUuid 再分組，讓使用者看清楚為何這些交易落在「其他」 */
export interface ReconSubGroup {
  key: string;
  label: string;
  rows: ReconTxnRef[];
}

/** 匯總沖帳候選交易的統一內部形狀：銷項/進項經正規化後共用同一套分組邏輯，不需各自實作一份 */
interface ReconCandidate {
  uuid: string;
  orderCode: string;
  voucherNumber?: string;
  amount: number;
  date: string;
  counterparty: string;
  /** 銷項為 paymentChannelUuid、進項為 counterpartyUuid；未指定時為 null */
  groupUuid: string | null;
  summary?: string;
  /** 未沖帳金額；可為負代表超沖 */
  remainingAmount?: number;
}

function byDate(a: ReconTxnRef, b: ReconTxnRef): number {
  return (parseRocDate(a.date)?.getTime() ?? 0) - (parseRocDate(b.date)?.getTime() ?? 0);
}

/** 應收帳款列（已排除作廢）→ 統一候選交易形狀，分組鍵為 paymentChannelUuid */
export function receivableRowsToCandidates(rows: SalesRow[]): ReconCandidate[] {
  return rows
    .filter(r => !r.voided)
    .map(r => ({
      uuid: r.uuid ?? r.id,
      orderCode: r.id,
      voucherNumber: r.voucherNumber,
      amount: r.amount,
      date: r.date,
      counterparty: r.counterparty,
      groupUuid: r.paymentChannelUuid ?? null,
      remainingAmount: r.remainingAmount,
    }));
}

/** 應付帳款列 → 統一候選交易形狀，分組鍵為 counterpartyUuid（廠商），summary 顯示科目摘要取代重複的廠商欄 */
export function payableRowsToCandidates(rows: PurchaseRow[]): ReconCandidate[] {
  return rows.map(r => ({
    uuid: r.uuid ?? r.id,
    orderCode: r.id,
    voucherNumber: r.voucherNumber,
    amount: r.amount,
    date: r.date,
    counterparty: r.party,
    groupUuid: r.counterpartyUuid ?? null,
    summary: [r.category, r.project].filter(Boolean).join(' · '),
    remainingAmount: r.remainingAmount,
  }));
}

function toTxnRef(candidate: ReconCandidate): ReconTxnRef {
  return {
    uuid: candidate.uuid,
    orderCode: candidate.orderCode,
    voucherNumber: candidate.voucherNumber,
    amount: candidate.amount,
    date: candidate.date,
    counterparty: candidate.counterparty,
    summary: candidate.summary,
    channelUuid: candidate.groupUuid,
    remainingAmount: candidate.remainingAmount,
  };
}

/**
 * 決定「未分類交易」的收納對象：若使用者在設定頁自建過一個名稱剛好也叫「其他」的管道／廠商，
 * 就把找不到對應管道的交易併入這個真實 uuid，不再另外合成一個「其他」桶——
 * 避免畫面同時出現「使用者自建的其他」與「前端合成的其他」兩列同名分組。
 * 找不到同名管道時，才回退為前端合成的 OTHER_GROUP_KEY。
 */
export function resolveCatchAllKey(groupOptions: ReconGroupOption[]): string {
  return groupOptions.find(o => o.name === OTHER_GROUP_LABEL)?.uuid ?? OTHER_GROUP_KEY;
}

/**
 * 側邊欄群組清單：依 uuid 比對候選交易的 groupUuid 是否等於某個啟用中管道／廠商的 uuid；
 * 找不到對應的一律歸入「其他」（合併規則見 resolveCatchAllKey）。
 * candidates 需先排除已沖帳的交易再傳入。
 */
export function buildReconGroups(candidates: ReconCandidate[], groupOptions: ReconGroupOption[]): ReconGroup[] {
  const knownUuids = new Set(groupOptions.map(o => o.uuid));
  const catchAllKey = resolveCatchAllKey(groupOptions);
  const isUnclassified = (groupUuid: string | null) => !groupUuid || !knownUuids.has(groupUuid);

  const groups: ReconGroup[] = groupOptions.map(opt => {
    const matchRows = candidates.filter(c => c.groupUuid === opt.uuid || (opt.uuid === catchAllKey && isUnclassified(c.groupUuid)));
    return { key: opt.uuid, label: opt.name, count: matchRows.length, amount: matchRows.reduce((sum, c) => sum + c.amount, 0), balance: opt.balance };
  });

  // 沒有使用者自建的「其他」管道時，才需要前端合成一個桶收納未分類交易
  if (catchAllKey === OTHER_GROUP_KEY) {
    const otherRows = candidates.filter(c => isUnclassified(c.groupUuid));
    groups.push({ key: OTHER_GROUP_KEY, label: OTHER_GROUP_LABEL, count: otherRows.length, amount: otherRows.reduce((sum, c) => sum + c.amount, 0) });
  }
  return groups;
}

/** 選定群組下尚未沖帳的候選交易，依日期由舊到新排序供清單顯示 */
export function getGroupRows(candidates: ReconCandidate[], groupKey: string | null, groupOptions: ReconGroupOption[]): ReconTxnRef[] {
  if (!groupKey) return [];
  const knownUuids = new Set(groupOptions.map(o => o.uuid));
  const catchAllKey = resolveCatchAllKey(groupOptions);
  const isUnclassified = (groupUuid: string | null) => !groupUuid || !knownUuids.has(groupUuid);
  const isCatchAllGroup = groupKey === OTHER_GROUP_KEY || groupKey === catchAllKey;
  const filtered = isCatchAllGroup
    ? candidates.filter(c => c.groupUuid === groupKey || isUnclassified(c.groupUuid))
    : candidates.filter(c => c.groupUuid === groupKey);
  return filtered.map(toTxnRef).sort(byDate);
}

/** 「全部管道」唯讀總覽：該側全部候選交易（不分群組），依日期由舊到新排序 */
export function getAllRows(candidates: ReconCandidate[]): ReconTxnRef[] {
  return candidates.map(toTxnRef).sort(byDate);
}

/**
 * 「其他」群組專用：依原始 groupUuid 再分組，讓使用者理解為何落在「其他」——
 * 未指定 uuid 的交易以 blankLabel 顯示（如「未設定管道」），已知但非啟用中的 uuid 以 nameByUuid 反查名稱，
 * 查無名稱（如已刪除的管道/廠商）則顯示「未知」。
 */
export function getOtherSubGroups(
  candidates: ReconCandidate[],
  groupOptions: ReconGroupOption[],
  nameByUuid: Map<string, string>,
  blankLabel: string,
): ReconSubGroup[] {
  const knownUuids = new Set(groupOptions.map(o => o.uuid));
  const otherRows = candidates.filter(c => !c.groupUuid || !knownUuids.has(c.groupUuid));
  const byKey = new Map<string, typeof otherRows>();
  otherRows.forEach(c => {
    const key = c.groupUuid ?? '__BLANK__';
    byKey.set(key, [...(byKey.get(key) ?? []), c]);
  });
  return Array.from(byKey.entries()).map(([key, list]) => ({
    key,
    label: key === '__BLANK__' ? blankLabel : (nameByUuid.get(key) ?? '未知'),
    rows: list.map(toTxnRef).sort(byDate),
  }));
}

/**
 * 依日期由舊到新依序累加，加入下一筆會超過輸入金額時即停止，避免沖過頭；
 * 未被累加到的交易維持待沖帳狀態（少沖），累加後仍有餘額則視為超額（多收/多付）。
 * 目前匯總沖帳頁改為使用者逐筆手動勾選，此函式暫留供日後「智慧建議」等自動預選功能使用。
 */
export function allocateTxnsToAmount(rows: ReconTxnRef[], targetAmount: number): { matched: ReconTxnRef[]; matchedAmount: number; unmatched: ReconTxnRef[] } {
  const sorted = [...rows].sort(byDate);
  const matched: ReconTxnRef[] = [];
  let matchedAmount = 0;
  for (const row of sorted) {
    if (matchedAmount + row.amount > targetAmount) break;
    matched.push(row);
    matchedAmount += row.amount;
  }
  const matchedUuids = new Set(matched.map(r => r.uuid));
  const unmatched = sorted.filter(r => !matchedUuids.has(r.uuid));
  return { matched, matchedAmount, unmatched };
}
