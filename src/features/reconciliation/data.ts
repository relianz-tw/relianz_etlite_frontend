import type { ReconPayableGroupDto, ReconReceivableGroupDto } from '@/api/types';
import { formatRocDate, parseRocDate } from '@/components/ui/DatePicker';
import { parseApiDate } from '@/features/ledger/data';
import type { ReconSide, ReconTxnRef } from './types';

/** 側邊欄「其他」群組：找不到對應啟用中管道/廠商 uuid 的交易（含未指定與已停用/未知 uuid） */
export const OTHER_GROUP_KEY = '__OTHER__';
export const OTHER_GROUP_LABEL = '其他';

/** 側邊欄「全部管道／全部廠商」：唯讀列出整張交易清單，不參與沖帳勾選 */
export const ALL_GROUP_KEY = '__ALL__';

/** 側邊欄「其他」桶的顯示文字：應收沿用「其他」，應付因無統編廠商多為個人交易，改用更貼切的「個人無統編」 */
export function getOtherGroupLabel(side: ReconSide): string {
  return side === 'payable' ? '個人無統編' : OTHER_GROUP_LABEL;
}

/** 應收顯示「全部管道」、應付顯示「全部廠商」，比照側邊欄其餘項目依 side 使用管道／廠商用語 */
export function getAllGroupLabel(side: ReconSide): string {
  return side === 'receivable' ? '全部管道' : '全部廠商';
}

/** 解析 URL 的 side query 參數；缺值或非 payable 一律回退為 receivable，供沖帳中心列表頁與交易明細頁共用 */
export function parseReconSideParam(value: string | string[] | undefined): ReconSide {
  return value === 'payable' ? 'payable' : 'receivable';
}

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
  amount: number;
  date: string;
  counterparty: string;
  /** 銷項為 paymentChannelUuid、進項為 counterpartyUuid；未指定時為 null */
  groupUuid: string | null;
  /** 未沖帳金額；可為負代表超沖 */
  remainingAmount?: number;
  /** 憑證號碼（發票字軌＋發票號碼），供確認沖帳／沖帳結果彈窗顯示（沖帳 API 本身不回傳此欄位，需反查候選清單） */
  voucherNumber: string;
}

function byDate(a: ReconTxnRef, b: ReconTxnRef): number {
  return (parseRocDate(a.date)?.getTime() ?? 0) - (parseRocDate(b.date)?.getTime() ?? 0);
}

/**
 * 開立日期＝憑證上的開立日（item.invoice.date，民國年 YYYMMDD），與 features/ledger/data.ts 的
 * issueDateFrom 相同慣例；查無憑證日期時退回 entryDate（交易收款/付款日 YYYYMMDD，未入帳時為 null，
 * 此時不顯示日期）。
 */
function toIssueDate(invoiceDate: string, entryDate: string | null): string {
  const date = parseRocDate(invoiceDate) ?? (entryDate ? parseApiDate(entryDate) : undefined);
  return formatRocDate(date);
}

/** 對帳中心銷項應收分組回應 → 攤平為統一候選交易形狀，分組鍵為 paymentChannelUuid */
export function receivableGroupsToCandidates(groups: ReconReceivableGroupDto[]): ReconCandidate[] {
  return groups.flatMap(group =>
    group.items.map(item => ({
      uuid: item.ledgerUuid,
      orderCode: item.orderCode,
      amount: item.totalAmount,
      date: toIssueDate(item.invoice.date, item.entryDate),
      counterparty: item.counterpartyName,
      groupUuid: item.paymentChannelUuid,
      remainingAmount: item.remainingAmount,
      voucherNumber: item.invoice.voucherNumber,
    })),
  );
}

/** 對帳中心進項應付分組回應 → 攤平為統一候選交易形狀，分組鍵為 counterpartyUuid（廠商） */
export function payableGroupsToCandidates(groups: ReconPayableGroupDto[]): ReconCandidate[] {
  return groups.flatMap(group =>
    group.items.map(item => ({
      uuid: item.ledgerUuid,
      orderCode: item.orderCode,
      amount: item.totalAmount,
      date: toIssueDate(item.invoice.date, item.entryDate),
      counterparty: item.counterpartyName,
      groupUuid: item.counterpartyUuid,
      remainingAmount: item.remainingAmount,
      voucherNumber: item.invoice.voucherNumber,
    })),
  );
}

function toTxnRef(candidate: ReconCandidate): ReconTxnRef {
  return {
    uuid: candidate.uuid,
    orderCode: candidate.orderCode,
    amount: candidate.amount,
    date: candidate.date,
    counterparty: candidate.counterparty,
    voucherNumber: candidate.voucherNumber,
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
export function buildReconGroups(candidates: ReconCandidate[], groupOptions: ReconGroupOption[], side: ReconSide): ReconGroup[] {
  const knownUuids = new Set(groupOptions.map(o => o.uuid));
  const catchAllKey = resolveCatchAllKey(groupOptions);
  const isUnclassified = (groupUuid: string | null) => !groupUuid || !knownUuids.has(groupUuid);

  // 使用者自建剛好同名「其他」的管道／廠商固定排在清單最末，讓使用者優先看到具體項目（比照 TransactionMetaCard 銷售管道排序）
  const sortedOptions = [...groupOptions.filter(o => o.name !== OTHER_GROUP_LABEL), ...groupOptions.filter(o => o.name === OTHER_GROUP_LABEL)];

  const groups: ReconGroup[] = sortedOptions.map(opt => {
    const matchRows = candidates.filter(c => c.groupUuid === opt.uuid || (opt.uuid === catchAllKey && isUnclassified(c.groupUuid)));
    const label = opt.name === OTHER_GROUP_LABEL ? getOtherGroupLabel(side) : opt.name;
    return { key: opt.uuid, label, count: matchRows.length, amount: matchRows.reduce((sum, c) => sum + c.amount, 0), balance: opt.balance };
  });

  // 沒有使用者自建的「其他」管道時，才需要前端合成一個桶收納未分類交易
  if (catchAllKey === OTHER_GROUP_KEY) {
    const otherRows = candidates.filter(c => isUnclassified(c.groupUuid));
    groups.push({ key: OTHER_GROUP_KEY, label: getOtherGroupLabel(side), count: otherRows.length, amount: otherRows.reduce((sum, c) => sum + c.amount, 0) });
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
  // 與 getGroupRows 的 isCatchAllGroup 判斷對齊：使用者自建同名「其他」管道時，明確指到該 uuid 的交易
  // 也要納入（該 uuid 本身在 knownUuids 內，單靠「不在啟用清單」判斷會漏掉這批交易）
  const catchAllKey = resolveCatchAllKey(groupOptions);
  const otherRows = candidates.filter(c => c.groupUuid === catchAllKey || !c.groupUuid || !knownUuids.has(c.groupUuid));
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
