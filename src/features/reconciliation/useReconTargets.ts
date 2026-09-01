'use client';

import { listBankAccounts } from '@/api/bankAccounts';
import { filterOfficialSubjects, listSubjectBalances } from '@/api/subjects';
import type { BankAccountDto, OfficialSubjectDto, SubjectBalanceDto } from '@/api/types';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildTargets, pickDefaultTargetKey } from './targets';
import type { ReconAllocationRow, ReconTarget } from './targets';
import type { ReconSide } from './types';

export interface UseReconTargetsResult {
  /** 依 side 過濾好的沖帳對象清單（銀行帳戶＋固定科目） */
  options: ReconTarget[];
  /** 僅銀行帳戶載入失敗才視為錯誤（沿用原本 accountsError 的行為）；科目／科目餘額載入失敗只降級，不擋銀行帳戶 */
  loading: boolean;
  error: string;

  primaryTargetKey: string;
  setPrimaryTargetKey: (key: string) => void;

  allocationRows: ReconAllocationRow[];
  addAllocationRow: () => void;
  removeAllocationRow: (id: string) => void;
  changeAllocationRow: (id: string, patch: Partial<Omit<ReconAllocationRow, 'id'>>) => void;
  /** 清空全部分出列，供 ReconciliationView 的 resetInputs() 呼叫（比照 otherDeductions 的重置時機） */
  resetAllocationRows: () => void;
}

/**
 * 沖帳對象分配的資料取得與狀態：銀行帳戶＋會計科目清單、科目餘額、主對象與分出列狀態。
 * 取代原本 ReconciliationView 內的 accounts／accountsLoading／accountsError／bankAccountUuid
 * 四個 state 與兩個 useEffect（見該檔案原本的沖帳對象載入區塊）。
 *
 * 科目清單依 side 呼叫 /ael/subject/official/list/filter（settle：應收 1、應付 2），
 * 科目餘額依清單取到的 id 逐一呼叫 /ael/ledger/subjectBalances（見 api/subjects.ts）。
 *
 * @param preferredBankAccountUuid 預設主對象的第一優先候選（目前選定銷售管道的收款帳戶 uuid），
 * 由 ReconciliationView 依 selectedGroupKey 算出；變動時（含側邊欄切換管道）會重新套用預設，見下方 effect
 */
export function useReconTargets(side: ReconSide, preferredBankAccountUuid?: string): UseReconTargetsResult {
  const [accounts, setAccounts] = useState<BankAccountDto[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState('');
  const [officialSubjects, setOfficialSubjects] = useState<OfficialSubjectDto[]>([]);
  const [subjectBalances, setSubjectBalances] = useState<SubjectBalanceDto[]>([]);

  const [primaryTargetKey, setPrimaryTargetKey] = useState('');
  const [allocationRows, setAllocationRows] = useState<ReconAllocationRow[]>([]);
  const rowIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    listBankAccounts()
      .then(list => {
        if (cancelled) return;
        setAccounts(list.filter(a => a.isActive));
      })
      .catch(err => {
        if (!cancelled) setAccountsError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setAccountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 科目清單依 side 篩選（settle：應收 1、應付 2），失敗只讓科目選項消失，不擋銀行帳戶
  useEffect(() => {
    let cancelled = false;
    filterOfficialSubjects({ calculationType: 0, settle: side === 'receivable' ? 1 : 2 })
      .then(list => {
        if (!cancelled) setOfficialSubjects(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [side]);

  // 科目餘額跟隨科目清單：清單為空不打 API；純資訊、不參與任何驗證，失敗時對應選項餘額維持 undefined，顯示「—」
  useEffect(() => {
    if (officialSubjects.length === 0) {
      setSubjectBalances([]);
      return;
    }
    let cancelled = false;
    listSubjectBalances(officialSubjects.map(s => s.id))
      .then(list => {
        if (!cancelled) setSubjectBalances(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [officialSubjects]);

  const options = useMemo(() => {
    const built = buildTargets(accounts, officialSubjects);
    return built.map(t =>
      t.kind === 'subject'
        ? { ...t, balance: subjectBalances.find(b => b.officialAccountingSubjectId === t.officialAccountingSubjectId)?.currentBalance }
        : t,
    );
  }, [accounts, officialSubjects, subjectBalances]);

  // 優先套用 preferredBankAccountUuid（見 pickDefaultTargetKey），查無則應付找預設付款帳戶、應收找預設收款帳戶；
  // side／帳戶載入完成／preferredBankAccountUuid 任一變動（含側邊欄切換銷售管道）都會重新套用預設
  useEffect(() => {
    if (accounts.length === 0) return;
    setPrimaryTargetKey(pickDefaultTargetKey(accounts, side, preferredBankAccountUuid));
  }, [side, accounts, preferredBankAccountUuid]);

  // 應收／應付的科目選項不同，切換 side 時清空分出列，避免殘留另一側才有的科目 key
  // （送出時 buildSettleChannels 會靜默略過該列，導致金額對不上而非明確報錯）
  useEffect(() => {
    setAllocationRows([]);
  }, [side]);

  const addAllocationRow = () => {
    rowIdRef.current += 1;
    setAllocationRows(prev => [...prev, { id: `ALLOC-${rowIdRef.current}`, targetKey: '', amount: 0 }]);
  };
  const removeAllocationRow = (id: string) => setAllocationRows(prev => prev.filter(r => r.id !== id));
  const changeAllocationRow = (id: string, patch: Partial<Omit<ReconAllocationRow, 'id'>>) =>
    setAllocationRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  const resetAllocationRows = () => setAllocationRows([]);

  return {
    options,
    loading: accountsLoading,
    error: accountsError,
    primaryTargetKey,
    setPrimaryTargetKey,
    allocationRows,
    addAllocationRow,
    removeAllocationRow,
    changeAllocationRow,
    resetAllocationRows,
  };
}
