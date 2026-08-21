/**
 * 沖帳對象分配：型別定義與純函式（選項組裝、預設值、試算、驗證）。
 * 不含任何 React／API 呼叫，資料載入邏輯見 useReconTargets.ts。
 */
import type { BankAccountDto, OfficialSubjectDto } from '@/api/types';
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
 * 固定科目對象：僅 code 與顯示名，id 於執行期以 code 比對 listOfficialSubjects 結果取得。
 * 業主（股東）往來需求：僅應付（進項）出現。官方科目表有兩筆同名——資產側 0201192、負債側 0202192，
 * 應付情境為「錢由股東代墊」應貸記負債，故採負債側 0202192；如與會計實務認定不同，改這裡的 subjectCode 即可。
 */
export const FIXED_SUBJECT_TARGETS: { subjectCode: string; name: string; sides: ReconSide[] }[] = [
  { subjectCode: '0201111', name: '現金', sides: ['receivable', 'payable'] },
  { subjectCode: '0202192', name: '業主（股東）往來', sides: ['payable'] },
  { subjectCode: '0202130', name: '其他應付款', sides: ['payable'] },
  { subjectCode: '0201191', name: '暫付款', sides: ['payable'] },
];

/**
 * 組出當前 side 可用的沖帳對象：啟用中的銀行帳戶（含餘額）＋該 side 適用的固定科目（依 subjectCode
 * 比對官方科目清單取得 id；查無對應代碼的科目直接不列入選項，避免送出時 officialAccountingSubjectId 缺值）。
 */
export function buildTargets(accounts: BankAccountDto[], officialSubjects: OfficialSubjectDto[], side: ReconSide): ReconTarget[] {
  const bankTargets: ReconTarget[] = accounts.map(a => ({
    key: `bank:${a.bankAccountUuid}`,
    kind: 'bankAccount',
    name: a.accountName || a.bankName,
    subLabel: `${a.branchName}（${a.accountNo}）`,
    balance: a.currentBalance,
    bankAccountUuid: a.bankAccountUuid,
    singleUse: true,
  }));

  const subjectTargets: ReconTarget[] = FIXED_SUBJECT_TARGETS.filter(s => s.sides.includes(side))
    .map((s): ReconTarget | null => {
      const matched = officialSubjects.find(o => o.subjectCode === s.subjectCode);
      if (!matched) return null;
      return {
        key: `subject:${s.subjectCode}`,
        kind: 'subject',
        name: s.name,
        subLabel: s.subjectCode,
        officialAccountingSubjectId: matched.id,
        subjectCode: s.subjectCode,
        singleUse: true,
      };
    })
    .filter((t): t is ReconTarget => t !== null);

  return [...bankTargets, ...subjectTargets];
}

/** 依 side 選出預設主對象：應付找 isDefaultPaymentAccount，應收找 isDefaultReceivingAccount，找不到退回第一個銀行帳戶 */
export function pickDefaultTargetKey(accounts: BankAccountDto[], side: ReconSide): string {
  if (accounts.length === 0) return '';
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
