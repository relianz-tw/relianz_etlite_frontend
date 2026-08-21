'use client';

import { listBankAccounts } from '@/api/bankAccounts';
import { listOfficialSubjects, listSubjectBalances } from '@/api/subjects';
import type { BankAccountDto, OfficialSubjectDto, SubjectBalanceDto } from '@/api/types';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildTargets, FIXED_SUBJECT_TARGETS, pickDefaultTargetKey } from './targets';
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
 * 沖帳對象分配的資料取得與狀態：銀行帳戶＋固定科目清單、科目餘額、主對象與分出列狀態。
 * 取代原本 ReconciliationView 內的 accounts／accountsLoading／accountsError／bankAccountUuid
 * 四個 state 與兩個 useEffect（見該檔案原本的沖帳對象載入區塊）。
 *
 * 唯一的後端接線點：科目餘額目前恆為 stub（listSubjectBalances 一律回空陣列，見 api/subjects.ts），
 * 後端提供端點後只需把該函式換成真正的 API 呼叫，此 hook 與呼叫端都不用改。
 */
export function useReconTargets(side: ReconSide): UseReconTargetsResult {
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

  // 科目清單載入失敗只讓固定科目選項消失（buildTargets 查無對應 subjectCode 時不列入），不擋銀行帳戶
  useEffect(() => {
    let cancelled = false;
    listOfficialSubjects()
      .then(list => {
        if (!cancelled) setOfficialSubjects(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // 科目餘額純資訊、不參與任何驗證，失敗或尚未提供（目前為 stub）時對應選項餘額維持 undefined，顯示「—」
  useEffect(() => {
    let cancelled = false;
    listSubjectBalances(FIXED_SUBJECT_TARGETS.map(s => s.subjectCode))
      .then(list => {
        if (!cancelled) setSubjectBalances(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => {
    const built = buildTargets(accounts, officialSubjects, side);
    return built.map(t => (t.kind === 'subject' ? { ...t, balance: subjectBalances.find(b => b.subjectCode === t.subjectCode)?.balance } : t));
  }, [accounts, officialSubjects, side, subjectBalances]);

  // 應付找預設付款帳戶、應收找預設收款帳戶；side 切換或帳戶載入完成時重新套用
  // （沿用原本 bankAccountUuid 的重置行為，見 ReconciliationView 舊版的 [side, accounts] effect）
  useEffect(() => {
    if (accounts.length === 0) return;
    setPrimaryTargetKey(pickDefaultTargetKey(accounts, side));
  }, [side, accounts]);

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
