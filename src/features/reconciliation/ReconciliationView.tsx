'use client';

import { listBankAccounts } from '@/api/bankAccounts';
import { listChannelRules } from '@/api/channelRules';
import { fetchReconciliationPayables, fetchReconciliationReceivables } from '@/api/ledger';
import type { BankAccountDto, SettleLedgerAllocation } from '@/api/types';
import { listVendors } from '@/api/vendors';
import Button from '@/components/ui/Button';
import ResizableSplitPane from '@/components/ui/ResizableSplitPane';
import SegmentedControl from '@/components/ui/SegmentedControl';
import TabBar from '@/components/ui/TabBar';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { cn, fmtCurrency } from '@/lib/utils';
import { subMonths } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReconConfirmSummaryModal from './components/ReconConfirmSummaryModal';
import ReconDateFilter from './components/ReconDateFilter';
import ReconGroupSidebar from './components/ReconGroupSidebar';
import ReconPoolPanel, { StepBadge, type ReconOtherDeductionRow } from './components/ReconPoolPanel';
import ReconPoolSummary from './components/ReconPoolSummary';
import ReconSettleResultModal from './components/ReconSettleResultModal';
import ReconSurplusModal from './components/ReconSurplusModal';
import ReconTxnList from './components/ReconTxnList';
import {
  ALL_GROUP_KEY,
  buildReconGroups,
  getAllGroupLabel,
  getAllRows,
  getGroupRows,
  getOtherSubGroups,
  OTHER_GROUP_KEY,
  payableGroupsToCandidates,
  receivableGroupsToCandidates,
  resolveCatchAllKey,
} from './data';
import type { ReconGroup, ReconGroupOption } from './data';
import { previewSettle, submitSettle, submitSingleSettle } from './settle';
import type { ReconMode, ReconSettleResult, ReconSide, ReconTxnRef } from './types';

const SIDE_OPTIONS: { value: ReconSide; label: string }[] = [
  { value: 'receivable', label: '應收' },
  { value: 'payable', label: '應付' },
];

const MODE_OPTIONS: { value: ReconMode; label: string }[] = [
  { value: 'perTxn', label: '逐筆沖帳' },
  { value: 'summary', label: '匯總沖帳' },
];

interface SideData {
  candidates: ReturnType<typeof receivableGroupsToCandidates>;
  groupOptions: ReconGroupOption[];
  nameByUuid: Map<string, string>;
}

/** Date → API 需要的西元 YYYYMMDD 字串（比照 features/ledger/transaction/data.ts 的 formatYmd） */
function toYyyymmdd(date: Date | undefined): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/** 「近一個月」預設查詢區間：今天往前推一個月為起始日，今天為結束日（比照 bank-accounts 的 defaultRange），
 * 僅供日期篩選彈出層內「重設」按鈕與草稿初始值使用——實際首屏查詢預設為不限日期（見 unlimitedDate 初始值） */
function defaultDateRange(): { dateFrom: string; dateTo: string } {
  const today = new Date();
  return { dateFrom: toYyyymmdd(subMonths(today, 1)), dateTo: toYyyymmdd(today) };
}

/**
 * 沖帳中心：同一頁承載逐筆／匯總兩種沖帳操作（見頁首 TabBar），選擇銷售管道／廠商後輸入金額完成沖帳。
 * 版面採左右兩欄：左欄為管道／廠商側邊欄＋金額面板，右欄為交易清單，兩欄同時在首屏出現，不需要先捲動看清單
 * 才能勾選，也不需要先捲動看金額欄才能填寫。銷售管道與廠商清單取自真實 API（/ael/payment/channelRules、
 * /ael/vendors，含當前餘額 balance），候選交易取自對帳中心專屬 API（/ael/ledger/reconciliation/receivables、
 * /ael/ledger/reconciliation/payables，依 dateRange 篩選、settled 固定帶 false 僅顯示未結清，
 * 一律不帶 paymentChannelUuid／counterpartyUuid 一次抓全部分組），分組比對一律依 uuid 而非名稱字串，
 * 避免同名不同管道/廠商誤判。
 *
 * 兩種模式：
 * - perTxn（逐筆沖帳，單筆／多筆整合）：使用者從右側清單勾選交易（可複選），依勾選筆數自動分流 API——
 *   勾 1 筆走手動沖帳 API（reconMethod=0，允許超沖少沖，事後可在交易明細頁編輯金額），不限定必須是明確
 *   管道／廠商，「全部管道」「其他」亦可操作；勾多筆走與 summary 相同的 settle/preview + settle/summary
 *   流程，差別僅在於預覽時明確帶入使用者勾選的 ledgerUuids 與 isDefault=false，需先於左側選擇明確銷售
 *   管道／廠商。畫面上兩種筆數共用同一套「預覽拆帳→確認沖帳→結果」流程（見 handlePreview／
 *   handleOpenConfirmSummary），僅差在有差額時：多筆彈出 A/B/C 三選一（見 ReconSurplusModal），勾 1 筆因
 *   手動沖帳 API 沒有 isBalance 參數，差額一律直接留在該筆原單，不彈三選一，直接開放送出。
 * - summary（匯總沖帳）：沿用既有流程，沖帳對象與拆帳結果一律由後端 settle/preview API 決定
 *   （依 transaction_date 由舊到新分配），前端不由使用者手動勾選調整；下方交易清單改為純檢視，
 *   將預覽結果疊加顯示為圓形狀態（見 ReconTxnList）。僅有明確 uuid 的真實管道／廠商可使用。
 *
 *   預覽（isBalance 固定帶 false，僅作試算）成功後：
 *   - 若對帳單金額與待沖總額完全相符（無超沖／少沖），開放「確認沖帳」直接送出（isBalance 送 false，無影響）。
 *   - 若有差額且非逐筆沖帳勾 1 筆，立即彈出三選一提示（見 ReconSurplusModal）：
 *     A 回去檢查：不呼叫任何 API，停留原畫面讓使用者確認金額／交易資料。
 *     B 留在餘額上，帶下次沖帳使用：以 isBalance=true 重新預覽一次取得正確的 closed 分佈，
 *       實際存入/付出金額（depositAmount／paymentAmount）改帶「實際沖完整那幾筆金額總和」
 *       （closed=true 各筆 settleAmount 加總，見 api.md 對 settle/summary 的說明），再呼叫執行 API。
 *     C 將金額沖入最後一筆交易：以 isBalance=false（沿用原本的預覽結果）呼叫執行 API，
 *       實際存入/付出金額沿用使用者原始輸入值。
 *   執行成功後，清空已快取的候選清單並重新向後端拉取（含最新餘額），讓已沖帳交易與餘額變動自然反映。
 *
 * 使用餘額（balanceUsed）：ReconPoolPanel「使用餘額」欄位，逐筆／匯總沖帳共用同一個輸入框，
 * 使用者輸入後會一併帶入預覽／執行 API 的 balanceUsed 參數，決定該次沖帳要使用多少目前餘額。
 */
interface ReconciliationViewProps {
  /** 進頁時的初始應收／應付分頁，來自 URL 的 side query 參數；預設應收 */
  initialSide?: ReconSide;
}

export default function ReconciliationView({ initialSide = 'receivable' }: ReconciliationViewProps) {
  const router = useRouter();
  const [side, setSide] = useState<ReconSide>(initialSide);
  const [mode, setMode] = useState<ReconMode>('perTxn');
  // 預設顯示「全部管道」唯讀總覽，讓使用者一進頁面就能看到完整交易清單，不需先手動點選
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(ALL_GROUP_KEY);
  // 逐筆沖帳模式勾選的交易 uuid（可複選）；勾 1 筆走手動沖帳 API、勾多筆走 summary API（見上方檔案說明）
  const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set());
  // 本次沖帳使用的餘額（元），對應 ReconPoolPanel「使用餘額」欄位，逐筆／匯總沖帳共用同一個輸入狀態
  const [balanceUsed, setBalanceUsed] = useState(0);
  const [statementAmount, setStatementAmount] = useState(0);
  const [feeAmount, setFeeAmount] = useState(0);
  // 額外金額（otherDeductions）：id 以遞增計數器產生（不可用 Date.now()/Math.random()）
  const [otherDeductions, setOtherDeductions] = useState<ReconOtherDeductionRow[]>([]);
  const otherDeductionIdRef = useRef(0);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(() => new Date());
  const [previewResult, setPreviewResult] = useState<ReconSettleResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [confirmSummaryOpen, setConfirmSummaryOpen] = useState(false);
  const [surplusOpen, setSurplusOpen] = useState(false);
  // 目前展開中的交易 uuid（就地展開看大約資訊，一次僅展開一列）
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);

  // 銀行帳戶：確認沖帳時實際入帳／出帳的目標帳戶
  const [accounts, setAccounts] = useState<BankAccountDto[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState('');
  const [bankAccountUuid, setBankAccountUuid] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // 沖帳執行結果（正規化後統一形狀）：成功後開結果 modal 顯示摘要與各原單明細，逐筆／匯總沖帳共用
  const [settleResult, setSettleResult] = useState<ReconSettleResult | null>(null);
  const [settleResultOpen, setSettleResultOpen] = useState(false);

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

  // 應收預設收款帳戶、應付預設付款帳戶；side 切換時重新套用（呼應 handleSideChange 重置其餘輸入的行為）
  useEffect(() => {
    if (accounts.length === 0) return;
    const defaultAccount = side === 'payable' ? accounts.find(a => a.isDefaultPaymentAccount) : accounts.find(a => a.isDefaultReceivingAccount);
    setBankAccountUuid((defaultAccount ?? accounts[0]).bankAccountUuid);
  }, [side, accounts]);

  const [receivableData, setReceivableData] = useState<SideData | null>(null);
  const [payableData, setPayableData] = useState<SideData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  // 對帳中心資料查詢區間，預設近一個月（僅供日期篩選彈出層草稿使用）；套用新區間時會清空兩側快取觸發重新拉取
  const [dateRange, setDateRange] = useState(defaultDateRange);
  // 「不限日期」：預設開啟，一次撈出全部未結清交易（仍受後端限制，僅能查今年與去年），日期篩選收合於
  // ReconDateFilter 彈出層，使用者需點開才會看到期間選擇器（見該元件說明）
  const [unlimitedDate, setUnlimitedDate] = useState(true);

  // 依 side 惰性載入並快取：切換回已載入過的一側不重新打 API；執行沖帳成功、套用新日期區間或切換「不限日期」後
  // 會清空快取觸發重新拉取。一律不帶 paymentChannelUuid／counterpartyUuid（抓全部分組），settled 固定帶 false（僅顯示未結清）
  useEffect(() => {
    if (side === 'receivable' ? receivableData !== null : payableData !== null) return;
    let cancelled = false;
    setDataLoading(true);
    setDataError('');
    const dateQuery = unlimitedDate ? {} : dateRange;
    const task =
      side === 'receivable'
        ? Promise.all([listChannelRules(), fetchReconciliationReceivables({ ...dateQuery, settled: 'false' })]).then(([channelList, groups]) => {
            const activeChannels = channelList.filter(c => c.isActive);
            const groupOptions = activeChannels.map(c => ({ uuid: c.channelUuid, name: c.channelName, balance: c.balance }));
            const nameByUuid = new Map(channelList.map(c => [c.channelUuid, c.channelName]));
            const candidates = receivableGroupsToCandidates(groups);
            if (!cancelled) setReceivableData({ candidates, groupOptions, nameByUuid });
          })
        : Promise.all([listVendors(), fetchReconciliationPayables({ ...dateQuery, settled: 'false' })]).then(([vendorList, groups]) => {
            const activeVendors = vendorList.filter(v => v.isActive);
            const groupOptions = activeVendors.map(v => ({ uuid: v.uuid, name: v.name, balance: v.balance }));
            const nameByUuid = new Map(vendorList.map(v => [v.uuid, v.name]));
            const candidates = payableGroupsToCandidates(groups);
            if (!cancelled) setPayableData({ candidates, groupOptions, nameByUuid });
          });
    task
      .catch(err => {
        if (!cancelled) setDataError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [side, receivableData, payableData, dateRange, unlimitedDate]);

  // 套用新查詢區間：關閉「不限日期」改回依區間篩選，兩側快取都失效，重置選取的群組與輸入，避免殘留舊區間的沖帳輸入誤送
  const handleApplyDateRange = (dateFrom: string, dateTo: string) => {
    setDateRange({ dateFrom, dateTo });
    setUnlimitedDate(false);
    setReceivableData(null);
    setPayableData(null);
    setSelectedGroupKey(ALL_GROUP_KEY);
    resetInputs();
  };

  // 切換「不限日期」：與套用新區間一樣需清空快取重抓，並重置選取的群組與輸入
  const handleToggleUnlimitedDate = () => {
    setUnlimitedDate(prev => !prev);
    setReceivableData(null);
    setPayableData(null);
    setSelectedGroupKey(ALL_GROUP_KEY);
    resetInputs();
  };

  const sideData = side === 'receivable' ? receivableData : payableData;
  const availableCandidates = sideData?.candidates ?? [];

  const groupOptions = sideData?.groupOptions ?? [];

  // 「全部管道」為唯讀總覽項，永遠列在最前面，不參與 buildReconGroups 的管道比對邏輯
  const groups = useMemo(() => {
    const allGroup: ReconGroup = {
      key: ALL_GROUP_KEY,
      label: getAllGroupLabel(side),
      count: availableCandidates.length,
      amount: availableCandidates.reduce((sum, c) => sum + c.amount, 0),
    };
    return [allGroup, ...buildReconGroups(availableCandidates, groupOptions, side)];
  }, [availableCandidates, groupOptions, side]);

  const catchAllKey = useMemo(() => resolveCatchAllKey(groupOptions), [groupOptions]);
  const isAllGroup = selectedGroupKey === ALL_GROUP_KEY;
  // 「其他」可能是前端合成桶，也可能是使用者自建、剛好同名的真實管道（見 resolveCatchAllKey），兩種情況都要拆 sub-section
  const isOtherGroup = !isAllGroup && (selectedGroupKey === OTHER_GROUP_KEY || selectedGroupKey === catchAllKey);

  const groupRows = useMemo(
    () => getGroupRows(availableCandidates, isAllGroup ? null : selectedGroupKey, groupOptions),
    [availableCandidates, isAllGroup, selectedGroupKey, groupOptions],
  );
  const allRows = useMemo(() => getAllRows(availableCandidates), [availableCandidates]);
  const sections = useMemo(() => {
    if (!selectedGroupKey) return [];
    if (isAllGroup) return [{ key: ALL_GROUP_KEY, label: '', rows: allRows }];
    if (isOtherGroup) {
      const blankLabel = side === 'receivable' ? '未設定管道' : '未設定廠商';
      return getOtherSubGroups(availableCandidates, groupOptions, sideData?.nameByUuid ?? new Map(), blankLabel);
    }
    return [{ key: selectedGroupKey, label: '', rows: groupRows }];
  }, [selectedGroupKey, isAllGroup, isOtherGroup, allRows, side, availableCandidates, groupOptions, sideData, groupRows]);

  const selectedGroup = groups.find(g => g.key === selectedGroupKey);
  const selectedGroupLabel = selectedGroup?.label ?? '';

  // 預覽結果依 ledgerUuid 疊加回交易清單顯示狀態圓圈，純檢視用途（僅匯總沖帳模式使用）
  const allocationByUuid = useMemo(() => {
    const map = new Map(previewResult?.allocations.map(a => [a.ledgerUuid, a]) ?? []);
    return map;
  }, [previewResult]);

  // 目前選定群組是否對應一個真實銷售管道／廠商 uuid（含使用者自建同名「其他」的情況）；匯總沖帳與逐筆沖帳
  // 勾多筆的預覽拆帳與確認沖帳皆需要明確的 uuid（逐筆沖帳勾 1 筆例外，見下方 isSingleSelection）
  const isKnownChannel = groupOptions.some(o => o.uuid === selectedGroupKey);
  const canSettle = isKnownChannel;

  // 逐筆沖帳模式：目前選取欄要顯示在「全部管道」與「其他」也能操作，這是三模式改版新增的沖帳路徑（之前完全沒有）
  const showStatusColumn = mode === 'perTxn' ? true : !isAllGroup;
  const selectedRows: ReconTxnRef[] = useMemo(
    () => sections.flatMap(s => s.rows).filter(r => selectedUuids.has(r.uuid)),
    [sections, selectedUuids],
  );
  const selectedAmount = selectedRows.reduce((sum, r) => sum + (r.remainingAmount ?? r.amount), 0);
  const singleSelectedRow = selectedRows.length === 1 ? selectedRows[0] : null;
  // 逐筆沖帳勾恰好 1 筆：手動沖帳 API 沒有 isBalance 參數，差額一律直接留在該筆原單，不彈 A/B/C 三選一
  // （見上方檔案說明）；勾多筆才走與匯總沖帳相同的 settle/preview + settle/summary 流程
  const isSingleSelection = mode === 'perTxn' && selectedUuids.size === 1;

  const otherDeductionsTotal = otherDeductions.reduce((sum, r) => sum + r.amount, 0);
  // 使用餘額不是實際入帳/出帳的錢（僅為系統內部既有餘額，用來沖抵帳款），故不計入實際存入/付出金額，
  // 只會計入下方的 settleAmount（實測驗證過：depositAmount 若加上 balanceUsed 會被後端拒絕）
  const depositAmount = statementAmount + feeAmount + otherDeductionsTotal;
  // 真正的沖帳金額須把使用餘額併進去（使用餘額也是實際拿去沖銷帳款的錢，只是來源不是本次存入/付出），
  // 不能只送使用者輸入框裡的原始金額，否則沖帳結果會少算這筆餘額，被後端判定少沖
  const settleAmount = statementAmount + balanceUsed;
  // 差額判斷須以逐筆拆帳狀態（settlementStatus）為準，不能只比較 settleAmount 與 totalBeforeRemaining——
  // 該管道／廠商若已有非零的既有餘額（balanceBefore），後端會自動將其併入本次結算，
  // 即使 settleAmount 剛好等於 totalBeforeRemaining 仍可能造成超沖/少沖（實測驗證過），此時仍須讓使用者透過 A/B/C 選擇處理方式
  const hasDiff = !!previewResult && previewResult.allocations.some(a => a.settlementStatus !== 0);
  // 差額顯示須以「本次實際分配到的原單」沖前剩餘加總為準，不能用 previewResult.totalBeforeRemaining（該管道／廠商
  // 全部未沖交易的合計，含本次完全沒被觸及的其他原單）——否則差額會混入不相干的交易金額，讓使用者誤解沖帳結果
  const touchedRemaining = previewResult ? previewResult.allocations.reduce((sum, a) => sum + a.beforeRemaining, 0) : 0;
  const diffAmount = previewResult ? Math.abs(previewResult.appliedSettleAmount - touchedRemaining) : 0;

  const resetInputs = () => {
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setBalanceUsed(0);
    setPreviewResult(null);
    setPreviewError('');
    setSubmitError('');
    setConfirmSummaryOpen(false);
    setSurplusOpen(false);
    setExpandedUuid(null);
    setSettleResultOpen(false);
    setSelectedUuids(new Set());
  };

  const handleSideChange = (next: ReconSide) => {
    setSide(next);
    setSelectedGroupKey(ALL_GROUP_KEY);
    resetInputs();
    // 同步 side 到網址，讓重新整理、瀏覽器上一頁與交易明細頁的返回連結都能回到同一分頁
    router.replace(`/ledger/reconciliation?side=${next}`, { scroll: false });
  };

  const handleModeChange = (next: ReconMode) => {
    setMode(next);
    resetInputs();
  };

  const handleSelectGroup = (key: string) => {
    setSelectedGroupKey(key);
    resetInputs();
  };

  // 清空已算出的結果與錯誤提示，供任何金額輸入變動時呼叫
  const clearComputedState = () => {
    setPreviewResult(null);
    setPreviewError('');
  };

  const handleStatementChange = (value: number) => {
    setStatementAmount(value);
    clearComputedState();
  };
  const handleFeeChange = (value: number) => {
    setFeeAmount(value);
    clearComputedState();
  };

  const handleAddOtherDeduction = () => {
    otherDeductionIdRef.current += 1;
    setOtherDeductions(prev => [...prev, { id: `OD-${otherDeductionIdRef.current}`, subject: null, name: '', amount: 0 }]);
    clearComputedState();
  };
  const handleRemoveOtherDeduction = (id: string) => {
    setOtherDeductions(prev => prev.filter(r => r.id !== id));
    clearComputedState();
  };
  const handleChangeOtherDeduction = (id: string, patch: Partial<Omit<ReconOtherDeductionRow, 'id'>>) => {
    setOtherDeductions(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
    clearComputedState();
  };

  // 清除全部已勾選交易與試算結果；金額與使用餘額是使用者對整批交易的輸入，維持不歸零（通常會先勾好多筆再統一輸入金額）
  const handleClearSelection = () => {
    setSelectedUuids(new Set());
    clearComputedState();
  };
  // 切換單筆勾選狀態（複選）
  const handleToggleSelect = (uuid: string) => {
    setSelectedUuids(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
    clearComputedState();
  };
  // 全選／取消全選：uuids 為呼叫端（ReconTxnList）依目前搜尋篩選後可勾選的交易；已全數勾選時視為「取消全選」
  const handleSelectAllToggle = (uuids: string[]) => {
    setSelectedUuids(prev => {
      const allSelected = uuids.length > 0 && uuids.every(uuid => prev.has(uuid));
      const next = new Set(prev);
      uuids.forEach(uuid => (allSelected ? next.delete(uuid) : next.add(uuid)));
      return next;
    });
    clearComputedState();
  };
  // 使用餘額欄位變更：與手續費／額外金額同樣視為影響試算結果的輸入，變更後清除舊試算結果
  const handleBalanceUsedChange = (value: number) => {
    setBalanceUsed(value);
    clearComputedState();
  };

  // 金額輸入共用驗證：對帳單金額（或沖帳金額）需大於 0、實際存入/付出不可為負、額外金額須填完整、使用餘額不可超過目前餘額、需選收/付款日
  const validateAmountInputs = (): string => {
    if (statementAmount <= 0) return `請先輸入${mode === 'perTxn' ? '沖帳' : '對帳單'}金額`;
    if (depositAmount < 0) return `實際${side === 'payable' ? '付出' : '存入'}金額不可為負，請確認手續費與額外金額`;
    if (otherDeductions.some(r => !r.subject?.id || !r.name.trim() || r.amount === 0)) return '請完整填寫額外金額的科目、名稱與金額';
    if (selectedGroup?.balance !== undefined && balanceUsed > selectedGroup.balance) return '使用餘額不可超過目前餘額';
    if (!paymentDate) return side === 'payable' ? '請先選擇付款日' : '請先選擇收款日';
    return '';
  };

  /**
   * 主要動作「預覽拆帳」：匯總沖帳與逐筆沖帳勾多筆走後端 settle/preview（isBalance 固定帶 false，僅作試算），
   * 成功後若有差額立即彈出三選一提示；逐筆沖帳勾恰好 1 筆改為本地試算（見檔案頂端說明，該情境不需要也無法
   * 呼叫 preview API——preview API 必填 paymentChannelUuid／counterpartyUuid，但單筆沖帳允許在「全部管道」
   * 「其他」操作，拿不到明確 uuid；且單筆的拆帳結果本來就是確定的：沖前剩餘＝該列 remainingAmount，
   * 沖後剩餘＝相減，不需多打一支 API），且不彈三選一（差額直接留在該筆原單）。
   */
  const handlePreview = async () => {
    const err = validateAmountInputs();
    if (err) {
      setPreviewError(err);
      return;
    }

    if (mode === 'perTxn' && selectedUuids.size === 1) {
      const row = selectedRows[0];
      if (!row) return;
      const remaining = row.remainingAmount ?? row.amount;
      const status = settleAmount === remaining ? 0 : settleAmount > remaining ? 1 : 2;
      const allocation: SettleLedgerAllocation = {
        ledgerUuid: row.uuid,
        orderCode: row.orderCode,
        transactionDate: undefined,
        beforeRemaining: remaining,
        settleAmount,
        afterRemaining: remaining - settleAmount,
        settlementStatus: status,
        closed: remaining - settleAmount <= 0,
      };
      setPreviewResult({
        settleAmount,
        appliedSettleAmount: settleAmount,
        actualAmount: depositAmount,
        isBalance: false,
        affectedCount: 1,
        totalBeforeRemaining: remaining,
        allocations: [allocation],
      });
      return;
    }

    if (!selectedGroupKey || !isKnownChannel) return;
    if (mode === 'perTxn' && selectedUuids.size === 0) return;

    setPreviewLoading(true);
    setPreviewError('');
    try {
      const result = await previewSettle({
        side,
        groupUuid: selectedGroupKey,
        ledgerUuids: mode === 'perTxn' ? Array.from(selectedUuids) : [],
        isDefault: mode !== 'perTxn',
        settleAmount,
        actualAmount: depositAmount,
        balanceUsed,
        isBalance: false,
        feeAmount,
        otherDeductions,
      });
      setPreviewResult(result);
      // 差額判斷邏輯同 hasDiff（見上方註解），須以逐筆拆帳狀態為準，不能只比較 settleAmount 與 totalBeforeRemaining
      if (result.allocations.some(a => a.settlementStatus !== 0)) setSurplusOpen(true);
    } catch (err) {
      setPreviewError(getFriendlyErrorMessage(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  // 執行沖帳成功後的共用收尾：清空快取候選清單觸發重新拉取（含最新餘額），並開啟結果彈窗（逐筆／匯總沖帳共用）
  const finalizeSettle = (result: ReconSettleResult) => {
    if (side === 'receivable') setReceivableData(null);
    else setPayableData(null);
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setBalanceUsed(0);
    setPreviewResult(null);
    setPreviewError('');
    setConfirmSummaryOpen(false);
    setSurplusOpen(false);
    setSelectedUuids(new Set());
    setSettleResult(result);
    setSettleResultOpen(true);
  };

  const requireSubmitReady = (): boolean => {
    if (!selectedGroupKey) return false;
    // 逐筆沖帳勾 1 筆走手動沖帳 API，不需要明確管道／廠商 uuid（見 isSingleSelection 說明）
    if (!isSingleSelection && !canSettle) return false;
    if (!bankAccountUuid) {
      setSubmitError('請先選擇銀行帳戶');
      return false;
    }
    if (!paymentDate) {
      setSubmitError(side === 'payable' ? '請先選擇付款日' : '請先選擇收款日');
      return false;
    }
    return true;
  };

  // 逐筆沖帳勾 1 筆：走手動沖帳 API，回應正規化為 ReconSettleResult 後與其餘流程共用 finalizeSettle／結果彈窗
  const handleConfirmSingleSettle = async () => {
    const row = selectedRows[0];
    if (!requireSubmitReady() || !row) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const result = await submitSingleSettle({
        side,
        ledgerUuid: row.uuid,
        settleAmount,
        actualAmount: depositAmount,
        balanceUsed,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        feeAmount,
        otherDeductions,
      });
      finalizeSettle(result);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  // 完全平衡（無超沖少沖）時的直接送出：isBalance 送 false 對結果無影響，沿用原始輸入的存入/付出金額
  const handleConfirmNoDiff = async () => {
    if (!requireSubmitReady() || !previewResult) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const result = await submitSettle({
        side,
        ledgerUuids: mode === 'perTxn' ? Array.from(selectedUuids) : previewResult.allocations.map(a => a.ledgerUuid),
        settleAmount,
        actualAmount: depositAmount,
        balanceUsed,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        isBalance: false,
        feeAmount,
        otherDeductions,
      });
      finalizeSettle(result);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  // 確認彈窗的送出：逐筆沖帳勾 1 筆走手動沖帳 API，其餘（勾多筆／匯總沖帳）走 summary API
  const handleConfirmSettle = () => (isSingleSelection ? handleConfirmSingleSettle() : handleConfirmNoDiff());

  // A：回去檢查，純關閉提示，不呼叫任何 API，讓使用者調整輸入後重新預覽
  const handleChooseBack = () => {
    setSurplusOpen(false);
  };

  // B：留在餘額上，帶下次沖帳使用——isBalance=true 下「已結清」的原單分佈與 isBalance=false 不同（見檔案頂端說明），
  // 故重新預覽一次，僅為取得正確的 ledgerUuids 子集合（isBalance=true 時未結清的最後一筆會被排除）；
  // 勾多筆須沿用原本勾選的 ledgerUuids／isDefault=false，避免重新預覽時擴大到整個管道／廠商的待沖交易
  const handleChooseKeepOnBalance = async () => {
    if (!requireSubmitReady() || !selectedGroupKey) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const rePreview = await previewSettle({
        side,
        groupUuid: selectedGroupKey,
        ledgerUuids: mode === 'perTxn' ? Array.from(selectedUuids) : [],
        isDefault: mode !== 'perTxn',
        settleAmount,
        actualAmount: depositAmount,
        balanceUsed,
        isBalance: true,
        feeAmount,
        otherDeductions,
      });
      // isBalance=true 時，後端只會沖能「完整結清」的原單——沖不滿的最後一筆會直接排除在 ledgerAllocations 外
      // （不勾選、不異動），差額改記入餘額；rePreview 僅用於取得正確的 ledgerUuids 子集合。
      // settleAmount／實際存入(付出)金額一律沿用本地算好的 settleAmount 與 depositAmount
      // （settleAmount ＝ statementAmount + balanceUsed；depositAmount ＝ statementAmount + 手續費 + 額外金額，
      // 不含 balanceUsed），不可用 rePreview 的 appliedSettleAmount／actualAmount 取代（實測驗證過會被後端拒絕）。
      const result = await submitSettle({
        side,
        ledgerUuids: mode === 'perTxn' ? Array.from(selectedUuids) : rePreview.allocations.map(a => a.ledgerUuid),
        settleAmount,
        actualAmount: depositAmount,
        balanceUsed,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        isBalance: true,
        feeAmount,
        otherDeductions,
      });
      finalizeSettle(result);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  // C：將差額沖入最後一筆交易——沿用目前的預覽結果（isBalance=false），存入/付出金額沿用使用者原始輸入值
  const handleChooseSettleToLast = async () => {
    if (!requireSubmitReady() || !previewResult) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const result = await submitSettle({
        side,
        ledgerUuids: mode === 'perTxn' ? Array.from(selectedUuids) : previewResult.allocations.map(a => a.ledgerUuid),
        settleAmount,
        actualAmount: depositAmount,
        balanceUsed,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        isBalance: false,
        feeAmount,
        otherDeductions,
      });
      finalizeSettle(result);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenConfirmSummary = () => {
    if (!previewResult) return;
    if (!isSingleSelection && !canSettle) return;
    setSubmitError('');
    setConfirmSummaryOpen(true);
  };

  const actionLabel = previewLoading ? '預覽拆帳中…' : '預覽拆帳';
  const actionDisabled =
    mode === 'perTxn'
      ? previewLoading || statementAmount <= 0 || selectedUuids.size === 0 || (selectedUuids.size > 1 && !canSettle)
      : previewLoading || statementAmount <= 0;
  // 逐筆沖帳勾多筆但尚未選定明確管道／廠商時，提示原因而非讓使用者按下去才失敗
  const actionHint =
    mode === 'perTxn' && selectedUuids.size > 1 && !canSettle
      ? `多筆沖帳需先於左側選擇單一${side === 'receivable' ? '銷售管道' : '廠商'}才能送出`
      : undefined;
  // 逐筆沖帳一律以「已勾選至少 1 筆」決定是否顯示動作區，不隨管道是否明確增減掛載／卸載——
  // 否則勾選第一筆交易時這塊區域才出現，會把下方交易清單往下推，使接續快速勾選的第二、三筆點擊座標對不準（實測會漏勾）
  const showActionArea = mode === 'perTxn' ? selectedUuids.size > 0 : canSettle;

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1440px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-5 flex flex-col gap-3 nav:flex-row nav:items-end nav:justify-between">
          <div>
            <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">沖帳中心</h1>
            <p className="mt-1 text-sm text-neutral-mid">選擇交易後確認金額，完成應收應付沖帳</p>
          </div>
          <div className="w-full nav:w-56">
            <SegmentedControl options={SIDE_OPTIONS} value={side} onChange={handleSideChange} size="md" />
          </div>
        </div>

        <div className="mb-5 flex flex-col items-stretch gap-2 border-b border-neutral-blue-gray/30 nav:flex-row nav:items-center nav:justify-between">
          <TabBar options={MODE_OPTIONS} value={mode} onChange={handleModeChange} />
          <div className="pb-2">
            <ReconDateFilter
              dateFrom={dateRange.dateFrom}
              dateTo={dateRange.dateTo}
              defaultDateFrom={defaultDateRange().dateFrom}
              defaultDateTo={defaultDateRange().dateTo}
              unlimitedDate={unlimitedDate}
              onApply={handleApplyDateRange}
              onToggleUnlimitedDate={handleToggleUnlimitedDate}
            />
          </div>
        </div>

        {dataLoading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">
            載入{side === 'receivable' ? '銷售管道與應收帳款' : '廠商與應付帳款'}中…
          </div>
        ) : dataError ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{dataError}</div>
        ) : (
          <ResizableSplitPane
            defaultLeftWidth={330}
            minLeftWidth={260}
            maxLeftWidth={480}
            left={
              <div className="flex flex-col gap-4 nav:sticky nav:top-7">
                <ReconGroupSidebar groups={groups} selectedKey={selectedGroupKey} onSelect={handleSelectGroup} />
                {selectedGroupKey && (
                  <ReconPoolPanel
                    mode={mode}
                    side={side}
                    stepNumber={mode === 'perTxn' ? 2 : 1}
                    panelTitle={mode === 'perTxn' ? '確認金額' : '輸入入帳金額'}
                    selectedCount={selectedUuids.size}
                    singleSelectedRow={singleSelectedRow}
                    selectedAmount={selectedAmount}
                    onClearSelection={handleClearSelection}
                    balanceLabel={selectedGroupLabel}
                    balance={selectedGroup?.balance}
                    balanceUsed={balanceUsed}
                    onBalanceUsedChange={handleBalanceUsedChange}
                    amountLabel={mode === 'perTxn' ? '沖帳金額' : '對帳單金額'}
                    statementAmount={statementAmount}
                    feeAmount={feeAmount}
                    onStatementChange={handleStatementChange}
                    onFeeChange={handleFeeChange}
                    otherDeductions={otherDeductions}
                    onAddOtherDeduction={handleAddOtherDeduction}
                    onRemoveOtherDeduction={handleRemoveOtherDeduction}
                    onChangeOtherDeduction={handleChangeOtherDeduction}
                    paymentDate={paymentDate}
                    onPaymentDateChange={date => {
                      setPaymentDate(date);
                      clearComputedState();
                    }}
                    showActionArea={showActionArea}
                    actionLabel={actionLabel}
                    actionDisabled={actionDisabled}
                    actionError={previewError}
                    actionHint={actionHint}
                    onAction={handlePreview}
                    accounts={accounts}
                    accountsLoading={accountsLoading}
                    accountsError={accountsError}
                    bankAccountUuid={bankAccountUuid}
                    onBankAccountChange={setBankAccountUuid}
                  />
                )}
              </div>
            }
          >
            {!selectedGroupKey ? (
              <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">
                請從左側選擇{side === 'receivable' ? '銷售管道' : '廠商'}
              </div>
            ) : (
              <div className={cn('flex flex-col gap-4', previewResult ? 'pb-32 nav:pb-20' : 'pb-4')}>
                {mode === 'perTxn' && isAllGroup && selectedUuids.size > 1 && (
                  <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                    「{getAllGroupLabel(side)}」為唯讀總覽，一次沖銷多筆交易需先於左側選擇單一{side === 'receivable' ? '銷售管道' : '廠商'}；若只沖一筆，可直接勾選
                  </div>
                )}
                {mode === 'summary' && isAllGroup && (
                  <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                    「{getAllGroupLabel(side)}」為唯讀總覽，匯總沖帳需先於左側選擇單一{side === 'receivable' ? '銷售管道' : '廠商'}
                    ；若要沖銷單一交易，可改用「逐筆沖帳」
                  </div>
                )}
                {mode === 'perTxn' && !isAllGroup && selectedUuids.size > 1 && !canSettle && (
                  <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                    此分類無對應{side === 'receivable' ? '銷售管道' : '廠商'}，暫不支援一次沖銷多筆，可改為只勾選一筆，或於左側切換至實際{side === 'receivable' ? '管道' : '廠商'}
                  </div>
                )}
                {mode === 'summary' && !isAllGroup && !canSettle && (
                  <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                    此分類無對應{side === 'receivable' ? '銷售管道' : '廠商'}，暫不支援匯總沖帳，可改用逐筆沖帳，或於左側切換至實際{side === 'receivable' ? '管道' : '廠商'}
                  </div>
                )}

                <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2">
                    {!isAllGroup && <StepBadge n={mode === 'perTxn' ? 1 : 2} />}
                    <p className="text-sm font-semibold text-neutral-dark">
                      {isAllGroup ? '全部交易' : mode === 'perTxn' ? '選擇交易' : '系統勾選結果'}
                    </p>
                  </div>
                  {/* 「對帳單金額」文案僅符合匯總沖帳（逐筆沖帳左欄欄位標題是「沖帳金額」，見 amountLabel），故僅匯總沖帳顯示 */}
                  {mode === 'summary' && !isAllGroup && <ReconPoolSummary side={side} statementAmount={statementAmount} previewResult={previewResult} />}
                  <ReconTxnList
                    side={side}
                    sections={sections}
                    showSectionHeaders={isOtherGroup}
                    showStatusColumn={showStatusColumn}
                    mode={mode}
                    emptyMessage={isAllGroup ? '目前沒有交易' : `此群組沒有${side === 'payable' ? '待付' : '待收'}的交易`}
                    channelNameByUuid={sideData?.nameByUuid ?? new Map()}
                    expandedUuid={expandedUuid}
                    onToggleExpand={uuid => setExpandedUuid(prev => (prev === uuid ? null : uuid))}
                    allocationByUuid={allocationByUuid}
                    selectedUuids={selectedUuids}
                    onToggleSelect={handleToggleSelect}
                    onSelectAllToggle={mode === 'perTxn' ? handleSelectAllToggle : undefined}
                  />
                </div>
              </div>
            )}
          </ResizableSplitPane>
        )}
      </div>

      {selectedGroupKey && previewResult && (
        <div className="sticky bottom-0 z-10 border-t border-neutral-blue-gray/30 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 nav:px-7 nav:pb-3">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-1 nav:flex-row nav:items-center nav:justify-between">
            <div className="flex flex-col gap-0.5">
              <div className="text-sm text-neutral-dark">
                本次沖帳 <span className="font-semibold">{previewResult.allocations.length}</span> 筆 · 合計{' '}
                <span className="font-mono font-semibold tabular-nums">{fmtCurrency(previewResult.appliedSettleAmount)}</span>
                {hasDiff && (
                  <>
                    {' '}
                    · 差額 <span className="font-mono font-semibold tabular-nums text-semantic-error">{fmtCurrency(diffAmount)}</span>
                  </>
                )}
              </div>
              {hasDiff && (
                <p className="text-xs text-neutral-mid">
                  {isSingleSelection ? '本次沖帳有差額，差額將直接留在該筆交易上' : '本次沖帳有差額，請選擇處理方式'}
                </p>
              )}
            </div>
            {hasDiff && !isSingleSelection ? (
              <Button variant="outline" onClick={() => setSurplusOpen(true)} disabled={submitLoading}>
                查看處理方式
              </Button>
            ) : (
              <Button variant="primary" onClick={handleOpenConfirmSummary} disabled={submitLoading}>
                {submitLoading ? '沖帳中…' : '確認沖帳'}
              </Button>
            )}
          </div>
        </div>
      )}

      {previewResult && (!hasDiff || isSingleSelection) && (
        <ReconConfirmSummaryModal
          open={confirmSummaryOpen}
          groupLabel={selectedGroupLabel}
          side={side}
          result={previewResult}
          submitting={submitLoading}
          submitError={submitError}
          onCancel={() => setConfirmSummaryOpen(false)}
          onConfirm={handleConfirmSettle}
        />
      )}

      {previewResult && hasDiff && !isSingleSelection && (
        <ReconSurplusModal
          open={surplusOpen}
          side={side}
          groupLabel={selectedGroupLabel}
          settleAmount={previewResult.appliedSettleAmount}
          remainingAmount={touchedRemaining}
          diff={diffAmount}
          submitting={submitLoading}
          submitError={submitError}
          onBack={handleChooseBack}
          onKeepOnBalance={handleChooseKeepOnBalance}
          onSettleToLast={handleChooseSettleToLast}
        />
      )}

      <ReconSettleResultModal open={settleResultOpen} side={side} groupLabel={selectedGroupLabel} result={settleResult} onClose={() => setSettleResultOpen(false)} />
    </div>
  );
}
