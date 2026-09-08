/**
 * 沖帳對象分配：型別定義與純函式（選項組裝、預設值、試算、驗證）。
 * 不含任何 React／API 呼叫，資料載入邏輯見 useReconTargets.ts。
 */
import type { BankAccountDto, OfficialSubjectDto, SettleChannel } from '@/api/types';
import { fmtCurrency } from '@/lib/utils';
import type { ReconSide } from './types';

export type ReconTargetKind = 'bankAccount' | 'subject';

/** 沖帳對象：銀行帳戶或會計科目，balance 為 undefined 表示尚未取得／後端尚未提供餘額 */
export interface ReconTarget {
  /** 下拉選項的唯一鍵：銀行帳戶為 `bank:${bankAccountUuid}`，科目為 `subject:${subjectCode}`。
   * 科目一律以 subjectCode（而非官方科目 id）組鍵——id 隨年度版本變動，用 id 當鍵換版當天就會對不上。 */
  key: string;
  kind: ReconTargetKind;
  name: string;
  /** 銀行帳戶的分行／帳號；科目為科目代碼 */
  subLabel: string;
  balance?: number;
  bankAccountUuid?: string;
  officialAccountingSubjectId?: number;
  /** 公司自訂子科目 uuid；選到子科目時才有值，送出 API 時對應 SettleChannel.companyAccountingSubjectUuid（選填） */
  companyAccountingSubjectUuid?: string;
  subjectCode?: string;
  /** 同一次沖帳最多只能被選一次（固定科目為 true，銀行帳戶可重複選則為 false，目前恆不重複故一律 true 亦可，
   * 保留欄位供未來若允許同帳戶拆多筆時放寬） */
  singleUse: boolean;
}

/** 分出列：主對象不是一列 state，它的金額由 depositAmount 扣除所有分出列後自動算出（1c 主帳戶自動補足） */
export interface ReconAllocationRow {
  /** 遞增計數器產生，比照專案其餘列表 id 慣例，不可用 Date.now()／Math.random() */
  id: string;
  targetKey: string;
  /** 分出金額，恆為正值 */
  amount: number;
}

/**
 * 組出當前可用的沖帳對象：啟用中的銀行帳戶（含餘額）＋會計科目（含餘額）。
 * officialSubjects 由呼叫端（useReconTargets）依 side 呼叫 /ael/subject/official/list/filter
 * 的 settle 參數先篩好，這裡不再依 side 過濾。
 */
export function buildTargets(accounts: BankAccountDto[], officialSubjects: OfficialSubjectDto[]): ReconTarget[] {
  const bankTargets: ReconTarget[] = accounts.map(a => ({
    key: `bank:${a.bankAccountUuid}`,
    kind: 'bankAccount',
    name: a.accountName || a.bankName,
    subLabel: `${a.branchName}（${a.accountNo}）`,
    balance: a.currentBalance,
    bankAccountUuid: a.bankAccountUuid,
    singleUse: true,
  }));

  // 有子科目（children）的官方科目改列出子科目本身，不再列父科目一筆——子科目才是使用者實際要選的記帳對象
  // （如「銀行存款」底下的「銀行存款-國泰世華」）。子科目若掛有 bankAccountUuid，代表與上方銀行帳戶分組
  // 是同一個帳戶（見 SubjectChildDto.bankAccountUuid 註解），此處略過避免重複；若該父科目底下的子科目
  // 因此被略光，則整個父科目都不出現在清單中。
  const subjectTargets: ReconTarget[] = officialSubjects.flatMap(s => {
    if (!s.children || s.children.length === 0) {
      return [
        {
          key: `subject:${s.subjectCode}`,
          kind: 'subject' as const,
          name: s.name,
          subLabel: s.subjectCode,
          officialAccountingSubjectId: s.id,
          subjectCode: s.subjectCode,
          singleUse: true,
        },
      ];
    }
    return s.children
      .filter(c => !c.bankAccountUuid)
      .map(c => ({
        key: `subject:${c.subjectCode}`,
        kind: 'subject' as const,
        name: c.name,
        subLabel: c.subjectCode,
        officialAccountingSubjectId: s.id,
        companyAccountingSubjectUuid: c.uuid,
        subjectCode: c.subjectCode,
        singleUse: true,
      }));
  });

  return [...bankTargets, ...subjectTargets];
}

/**
 * 依 side 選出預設主對象：第一優先比對 preferredBankAccountUuid（銷售管道設定的收款帳戶，見
 * ReconciliationView 的 preferredBankAccountUuid），命中啟用中銀行帳戶即採用；查無（含應付側，
 * 廠商無對應銀行帳戶 uuid 可比對）則退回 side 對應的預設帳戶旗標（應付找 isDefaultPaymentAccount，
 * 應收找 isDefaultReceivingAccount），仍找不到再退回第一個銀行帳戶。
 */
export function pickDefaultTargetKey(accounts: BankAccountDto[], side: ReconSide, preferredBankAccountUuid?: string): string {
  if (accounts.length === 0) return '';
  const preferred = preferredBankAccountUuid ? accounts.find(a => a.bankAccountUuid === preferredBankAccountUuid) : undefined;
  if (preferred) return `bank:${preferred.bankAccountUuid}`;
  const defaultAccount = side === 'payable' ? accounts.find(a => a.isDefaultPaymentAccount) : accounts.find(a => a.isDefaultReceivingAccount);
  return `bank:${(defaultAccount ?? accounts[0]).bankAccountUuid}`;
}

export interface AllocationSummary {
  /** 所有分出列金額加總 */
  splitTotal: number;
  /** 主對象自動補足的金額（depositAmount − splitTotal），可為負代表分出總額已超過待分配總額 */
  primaryAmount: number;
}

/** 分配試算：純函式，UI 與驗證共用同一份數字 */
export function computeAllocation(depositAmount: number, rows: ReconAllocationRow[]): AllocationSummary {
  const splitTotal = rows.reduce((sum, r) => sum + r.amount, 0);
  return { splitTotal, primaryAmount: depositAmount - splitTotal };
}

/** 某個對象是否已被其他分出列選走（固定科目最多選一次；銀行帳戶同理不重複），currentRowId 為呼叫端自己那列，不算佔用 */
export function isTargetTaken(targetKey: string, primaryTargetKey: string, rows: ReconAllocationRow[], currentRowId?: string): boolean {
  if (targetKey === primaryTargetKey) return true;
  return rows.some(r => r.id !== currentRowId && r.targetKey === targetKey);
}

/** 下拉選單顯示用的餘額文字：undefined（尚未取得／後端未提供）顯示「—」而非誤導的 $0 */
export function formatTargetBalance(balance: number | undefined): string {
  return balance === undefined ? '—' : fmtCurrency(balance);
}

/**
 * 分出列驗證：於 ReconciliationView 的 validateAmountInputs 呼叫，回傳非空字串時擋下「確認沖帳」。
 * 沒有任何分出列時一律回傳空字串（不影響現行只用主對象的送出流程）。
 */
export function validateAllocationRows(depositAmount: number, rows: ReconAllocationRow[], side: ReconSide): string {
  if (rows.length === 0) return '';
  if (rows.some(r => !r.targetKey || r.amount <= 0)) return '請完整填寫每一個分出對象與金額';
  const { splitTotal, primaryAmount } = computeAllocation(depositAmount, rows);
  if (primaryAmount < 0) {
    const directionLabel = side === 'payable' ? '付出' : '存入';
    return `分出金額加總（${fmtCurrency(splitTotal)}）不可超過實際${directionLabel}金額（${fmtCurrency(depositAmount)}）`;
  }
  return '';
}

/**
 * 依主對象與分出列組出送給沖帳 API 的收付款管道陣列（見 SettleChannel）：主對象金額為
 * depositAmount 扣除所有分出列後自動補足（見 computeAllocation），金額 <= 0（全部分出去或未選主對象）
 * 時不放入該管道；分出列金額 <= 0 同樣略過。找不到對應 option 的 key 直接忽略——
 * 呼叫端應先以 primaryTargetKey 是否有值、及本函式回傳是否為空陣列擋下送出（見 ReconciliationView）。
 */
export function buildSettleChannels(options: ReconTarget[], primaryTargetKey: string, rows: ReconAllocationRow[], depositAmount: number): SettleChannel[] {
  const toChannel = (target: ReconTarget | undefined, amount: number): SettleChannel | null => {
    if (!target || amount <= 0) return null;
    return target.kind === 'bankAccount'
      ? { isBankAccount: true, bankAccountUuid: target.bankAccountUuid, amount }
      : {
          isBankAccount: false,
          officialAccountingSubjectId: target.officialAccountingSubjectId,
          companyAccountingSubjectUuid: target.companyAccountingSubjectUuid,
          amount,
        };
  };

  const { primaryAmount } = computeAllocation(depositAmount, rows);
  const primaryTarget = options.find(o => o.key === primaryTargetKey);
  const channels = [
    toChannel(primaryTarget, primaryAmount),
    ...rows.map(r => toChannel(options.find(o => o.key === r.targetKey), r.amount)),
  ].filter((c): c is SettleChannel => c !== null);

  return channels;
}
