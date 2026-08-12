'use client';

import { listBankAccounts } from '@/api/bankAccounts';
import { listChannelRules } from '@/api/channelRules';
import { fetchReconciliationPayables, fetchReconciliationReceivables } from '@/api/ledger';
import type { BankAccountDto } from '@/api/types';
import { listVendors } from '@/api/vendors';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import PeriodFilterBar from '@/components/ui/PeriodFilterBar';
import ResizableSplitPane from '@/components/ui/ResizableSplitPane';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { cn, fmtCurrency } from '@/lib/utils';
import { subMonths } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReconConfirmSummaryModal from './components/ReconConfirmSummaryModal';
import ReconGroupSidebar from './components/ReconGroupSidebar';
import ReconPoolPanel, { type ReconOtherDeductionRow } from './components/ReconPoolPanel';
import ReconPoolSummary from './components/ReconPoolSummary';
import ReconSettleResultModal from './components/ReconSettleResultModal';
import ReconSingleConfirmModal from './components/ReconSingleConfirmModal';
import ReconSurplusModal from './components/ReconSurplusModal';
import ReconTxnList from './components/ReconTxnList';
import {
  ALL_GROUP_KEY,
  ALL_GROUP_LABEL,
  buildReconGroups,
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

/** 「近一個月」預設查詢區間：今天往前推一個月為起始日，今天為結束日（比照 bank-accounts 的 defaultRange） */
function defaultDateRange(): { dateFrom: string; dateTo: string } {
  const today = new Date();
  return { dateFrom: toYyyymmdd(subMonths(today, 1)), dateTo: toYyyymmdd(today) };
}

/**
 * 沖帳中心：同一頁承載單筆／多筆／匯總三種沖帳操作（見 ReconPoolPanel 頂部 TabBar），選擇銷售管道／廠商後
 * 輸入金額完成沖帳。銷售管道與廠商清單取自真實 API（/ael/payment/channelRules、/ael/vendors，含當前餘額
 * balance），候選交易取自對帳中心專屬 API（/ael/ledger/reconciliation/receivables、
 * /ael/ledger/reconciliation/payables，依 dateRange 篩選、settled 固定帶 false 僅顯示未結清，
 * 一律不帶 paymentChannelUuid／counterpartyUuid 一次抓全部分組），分組比對一律依 uuid 而非名稱字串，
 * 避免同名不同管道/廠商誤判。
 *
 * 三種模式：
 * - single（單筆沖帳）：使用者從清單勾選一筆交易，走手動沖帳 API（reconMethod=0），允許超沖少沖，
 *   事後可在交易明細頁編輯金額。不限定必須是明確管道／廠商，「全部管道」「其他」亦可操作。
 * - multi（多筆沖帳）：使用者從清單勾選多筆交易，走與 summary 相同的 settle/preview + settle/summary
 *   流程，差別僅在於預覽時明確帶入使用者勾選的 ledgerUuids 與 isDefault=false（summary 固定
 *   isDefault=true、ledgerUuids=[]，由後端自動拆帳）。需先於左側選擇明確銷售管道／廠商，
 *   下方交易清單的選取圓圈改為可複選勾選（見 ReconTxnList）。
 * - summary（匯總沖帳）：沿用既有流程，沖帳對象與拆帳結果一律由後端 settle/preview API 決定
 *   （依 transaction_date 由舊到新分配），前端不由使用者手動勾選調整；下方交易清單改為純檢視，
 *   將預覽結果疊加顯示為圓形狀態（見 ReconTxnList）。僅有明確 uuid 的真實管道／廠商可使用。
 *
 *   預覽（isBalance 固定帶 false，僅作試算）成功後：
 *   - 若對帳單金額與待沖總額完全相符（無超沖／少沖），開放「確認沖帳」直接送出（isBalance 送 false，無影響）。
 *   - 若有差額，立即彈出三選一提示（見 ReconSurplusModal）：
 *     A 回去檢查：不呼叫任何 API，停留原畫面讓使用者確認金額／交易資料。
 *     B 留在餘額上，帶下次沖帳使用：以 isBalance=true 重新預覽一次取得正確的 closed 分佈，
 *       實際存入/付出金額（depositAmount／paymentAmount）改帶「實際沖完整那幾筆金額總和」
 *       （closed=true 各筆 settleAmount 加總，見 api.md 對 settle/summary 的說明），再呼叫執行 API。
 *     C 將金額沖入最後一筆交易：以 isBalance=false（沿用原本的預覽結果）呼叫執行 API，
 *       實際存入/付出金額沿用使用者原始輸入值。
 *   執行成功後，清空已快取的候選清單並重新向後端拉取（含最新餘額），讓已沖帳交易與餘額變動自然反映。
 *
 * 使用餘額（balanceUsed）：ReconPoolPanel「本次抵銷」欄位，單筆／多筆／匯總沖帳共用同一個輸入框，
 * 使用者輸入後會一併帶入預覽／執行 API 的 balanceUsed 參數，決定該次沖帳要使用多少目前餘額。
 */
export default function ReconciliationView() {
  const [side, setSide] = useState<ReconSide>('receivable');
  const [mode, setMode] = useState<ReconMode>('single');
  // 預設顯示「全部管道」唯讀總覽，讓使用者一進頁面就能看到完整交易清單，不需先手動點選
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(ALL_GROUP_KEY);
  // 單筆沖帳模式勾選的交易 uuid；僅會有 0～1 筆（單選）
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  // 多筆沖帳模式勾選的交易 uuid 集合（複選）
  const [selectedMultiUuids, setSelectedMultiUuids] = useState<Set<string>>(new Set());
  // 本次沖帳使用的餘額（元），對應 ReconPoolPanel「本次抵銷」欄位，單筆／多筆／匯總沖帳共用同一個輸入狀態
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
  // 單筆沖帳模式：點擊「確認沖帳」前的輸入驗證錯誤，與確認彈窗開關
  const [singleActionError, setSingleActionError] = useState('');
  const [singleConfirmOpen, setSingleConfirmOpen] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState<{ matchedCount: number; matchedAmount: number } | null>(null);
  // 目前展開中的交易 uuid（就地展開看大約資訊，一次僅展開一列）
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);

  // 銀行帳戶：確認沖帳時實際入帳／出帳的目標帳戶
  const [accounts, setAccounts] = useState<BankAccountDto[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState('');
  const [bankAccountUuid, setBankAccountUuid] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // 沖帳執行結果（settle/summary 回應正規化後，僅匯總沖帳使用）：成功後開結果 modal 顯示摘要、沖前/沖後餘額與各原單明細
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
  // 對帳中心資料查詢區間，預設近一個月；套用新區間時會清空兩側快取觸發重新拉取（見 handleApplyDateRange）
  const [dateRange, setDateRange] = useState(defaultDateRange);
  // 「不限日期」：勾選後略過 dateFrom/dateTo，一次撈出全部未結清交易（仍受後端限制，僅能查今年與去年）
  const [unlimitedDate, setUnlimitedDate] = useState(false);

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
      label: ALL_GROUP_LABEL,
      count: availableCandidates.length,
      amount: availableCandidates.reduce((sum, c) => sum + c.amount, 0),
    };
    return [allGroup, ...buildReconGroups(availableCandidates, groupOptions)];
  }, [availableCandidates, groupOptions]);

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

  // 目前選定群組是否對應一個真實銷售管道／廠商 uuid（含使用者自建同名「其他」的情況）；匯總沖帳的預覽拆帳與確認沖帳皆需要明確的 uuid
  const isKnownChannel = groupOptions.some(o => o.uuid === selectedGroupKey);
  const canSettle = isKnownChannel;

  // 單筆沖帳模式：目前選取欄要顯示在「全部管道」與「其他」也能操作，這是三模式改版新增的沖帳路徑（之前完全沒有）
  const showStatusColumn = mode === 'single' ? true : !isAllGroup;
  const selectedUuids = useMemo(() => {
    if (mode === 'multi') return selectedMultiUuids;
    return new Set(selectedUuid ? [selectedUuid] : []);
  }, [mode, selectedMultiUuids, selectedUuid]);
  const selectedRow: ReconTxnRef | null = useMemo(() => {
    if (!selectedUuid) return null;
    return sections.flatMap(s => s.rows).find(r => r.uuid === selectedUuid) ?? null;
  }, [sections, selectedUuid]);

  // 使用餘額為對帳單/沖帳金額下方的固定減項（見 ReconPoolPanel），從實際存入/付出金額中扣除
  const depositAmount = statementAmount + feeAmount + otherDeductions.reduce((sum, r) => sum + r.amount, 0) - balanceUsed;
  // 差額判斷須以逐筆拆帳狀態（settlementStatus）為準，不能只比較 settleAmount 與 totalBeforeRemaining——
  // 該管道／廠商若已有非零的既有餘額（balanceBefore），後端會自動將其併入本次結算，
  // 即使 settleAmount 剛好等於 totalBeforeRemaining 仍可能造成超沖/少沖（實測驗證過），此時仍須讓使用者透過 A/B/C 選擇處理方式
  const hasDiff = !!previewResult && previewResult.allocations.some(a => a.settlementStatus !== 0);
  const diffAmount = previewResult ? Math.abs(previewResult.appliedSettleAmount - previewResult.totalBeforeRemaining) : 0;

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
    setSingleActionError('');
    setSingleConfirmOpen(false);
    setSubmittedInfo(null);
    setExpandedUuid(null);
    setSettleResultOpen(false);
    setSelectedUuid(null);
    setSelectedMultiUuids(new Set());
  };

  const handleSideChange = (next: ReconSide) => {
    setSide(next);
    setSelectedGroupKey(ALL_GROUP_KEY);
    resetInputs();
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
    setSingleActionError('');
    setSubmittedInfo(null);
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

  // 單筆沖帳模式：換一筆交易（或清除選取）時金額歸零，避免延用上一筆的金額（含使用餘額，因該筆交易換了，先前輸入的使用餘額不應延用）
  const clearSingleSelection = () => {
    setSelectedUuid(null);
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setBalanceUsed(0);
    setSingleActionError('');
    setSubmitError('');
  };
  // 多筆沖帳模式：清除全部已勾選交易與試算結果；金額與使用餘額是使用者對整批交易的輸入，維持不歸零
  const clearMultiSelection = () => {
    setSelectedMultiUuids(new Set());
    clearComputedState();
  };
  // 切換勾選：single 為單選（再點一次已勾選的列即取消，並重置金額與使用餘額）；multi 為複選（累加/移除 uuid，
  // 保留使用者已輸入的金額與使用餘額，僅清除試算結果，因為使用者通常會先勾好多筆再統一輸入對帳單金額）
  const handleToggleSelect = (uuid: string) => {
    if (mode === 'multi') {
      setSelectedMultiUuids(prev => {
        const next = new Set(prev);
        if (next.has(uuid)) next.delete(uuid);
        else next.add(uuid);
        return next;
      });
      clearComputedState();
      return;
    }
    if (selectedUuid === uuid) {
      clearSingleSelection();
      return;
    }
    setSelectedUuid(uuid);
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setBalanceUsed(0);
    setSingleActionError('');
    setSubmitError('');
  };
  // 使用餘額（本次抵銷）欄位變更：與手續費／額外金額同樣視為影響試算結果的輸入，變更後清除舊試算結果
  const handleBalanceUsedChange = (value: number) => {
    setBalanceUsed(value);
    clearComputedState();
  };

  // 金額輸入共用驗證：對帳單金額（或沖帳金額）需大於 0、實際存入/付出不可為負、額外金額須填完整、使用餘額不可超過目前餘額、需選收/付款日
  const validateAmountInputs = (): string => {
    if (statementAmount <= 0) return `請先輸入${mode === 'single' ? '沖帳' : '對帳單'}金額`;
    if (depositAmount < 0) return `實際${side === 'payable' ? '付出' : '存入'}金額不可為負，請確認手續費、使用餘額與額外金額`;
    if (otherDeductions.some(r => !r.subject?.id || !r.name.trim() || r.amount === 0)) return '請完整填寫額外金額的科目、名稱與金額';
    if (selectedGroup?.balance !== undefined && balanceUsed > selectedGroup.balance) return '使用餘額不可超過目前餘額';
    if (!paymentDate) return side === 'payable' ? '請先選擇付款日' : '請先選擇收款日';
    return '';
  };

  // 匯總／多筆沖帳：預覽拆帳（isBalance 固定帶 false，僅作試算用途）：成功後若有差額立即彈出三選一提示，無差額則等待使用者按「確認沖帳」
  // 匯總沖帳不帶 ledgerUuids／isDefault（等同 isDefault=true，由後端自動拆帳）；多筆沖帳明確帶入使用者勾選的 ledgerUuids 與 isDefault=false
  const handlePreview = async () => {
    if (!selectedGroupKey || !isKnownChannel) return;
    if (mode === 'multi' && selectedMultiUuids.size === 0) return;
    const err = validateAmountInputs();
    if (err) {
      setPreviewError(err);
      return;
    }
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const result = await previewSettle({
        side,
        groupUuid: selectedGroupKey,
        ledgerUuids: mode === 'multi' ? Array.from(selectedMultiUuids) : [],
        isDefault: mode !== 'multi',
        settleAmount: statementAmount,
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

  // 執行沖帳成功後的共用收尾：清空快取候選清單觸發重新拉取（含最新餘額），並開啟結果彈窗（匯總／多筆沖帳共用）
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
    setSelectedMultiUuids(new Set());
    setSubmittedInfo({ matchedCount: result.allocations.length, matchedAmount: result.appliedSettleAmount });
    setSettleResult(result);
    setSettleResultOpen(true);
  };

  const requireSubmitReady = (): boolean => {
    if (!canSettle || !selectedGroupKey) return false;
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

  // 完全平衡（無超沖少沖）時的直接送出：isBalance 送 false 對結果無影響，沿用原始輸入的存入/付出金額
  const handleConfirmNoDiff = async () => {
    if (!requireSubmitReady() || !previewResult) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const result = await submitSettle({
        side,
        ledgerUuids: mode === 'multi' ? Array.from(selectedMultiUuids) : previewResult.allocations.map(a => a.ledgerUuid),
        settleAmount: statementAmount,
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

  // A：回去檢查，純關閉提示，不呼叫任何 API，讓使用者調整輸入後重新預覽
  const handleChooseBack = () => {
    setSurplusOpen(false);
  };

  // B：留在餘額上，帶下次沖帳使用——isBalance=true 下「已結清」的原單分佈與 isBalance=false 不同（見檔案頂端說明），
  // 故重新預覽一次，僅為取得正確的 ledgerUuids 子集合（isBalance=true 時未結清的最後一筆會被排除）；
  // 多筆沖帳須沿用原本勾選的 ledgerUuids／isDefault=false，避免重新預覽時擴大到整個管道／廠商的待沖交易
  const handleChooseKeepOnBalance = async () => {
    if (!requireSubmitReady() || !selectedGroupKey) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const rePreview = await previewSettle({
        side,
        groupUuid: selectedGroupKey,
        ledgerUuids: mode === 'multi' ? Array.from(selectedMultiUuids) : [],
        isDefault: mode !== 'multi',
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        balanceUsed,
        isBalance: true,
        feeAmount,
        otherDeductions,
      });
      // isBalance=true 時，後端只會沖能「完整結清」的原單——沖不滿的最後一筆會直接排除在 ledgerAllocations 外
      // （不勾選、不異動），差額改記入餘額；rePreview 僅用於取得正確的 ledgerUuids 子集合。
      // settleAmount／實際存入(付出)金額一律沿用使用者原始輸入的對帳單金額與 depositAmount
      // （＝settleAmount − balanceUsed − 手續費 − 額外金額），不可用 rePreview 的
      // appliedSettleAmount／actualAmount 取代（實測驗證過會被後端拒絕）。
      const result = await submitSettle({
        side,
        ledgerUuids: mode === 'multi' ? Array.from(selectedMultiUuids) : rePreview.allocations.map(a => a.ledgerUuid),
        settleAmount: statementAmount,
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
        ledgerUuids: mode === 'multi' ? Array.from(selectedMultiUuids) : previewResult.allocations.map(a => a.ledgerUuid),
        settleAmount: statementAmount,
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
    if (!canSettle || !previewResult) return;
    setSubmitError('');
    setConfirmSummaryOpen(true);
  };

  // 單筆沖帳：點擊「確認沖帳」先驗證輸入，通過才開確認彈窗；實際送出在 handleConfirmSingleSettle
  const handleOpenSingleConfirm = () => {
    if (!selectedRow) return;
    const err = validateAmountInputs();
    if (err) {
      setSingleActionError(err);
      return;
    }
    if (!bankAccountUuid) {
      setSingleActionError('請先選擇銀行帳戶');
      return;
    }
    setSingleActionError('');
    setSubmitError('');
    setSingleConfirmOpen(true);
  };

  // 單筆沖帳：走手動沖帳 API（reconMethod=0），允許超沖少沖；成功後清空快取觸發重新拉取，並以橫幅顯示結果
  // （不開結果 modal——手動沖帳 API 回應與 ReconSettleResult 形狀不同，橫幅已足夠）
  const handleConfirmSingleSettle = async () => {
    if (!selectedRow) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      await submitSingleSettle({
        side,
        ledgerUuid: selectedRow.uuid,
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        balanceUsed,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        feeAmount,
        otherDeductions,
      });
      if (side === 'receivable') setReceivableData(null);
      else setPayableData(null);
      setSubmittedInfo({ matchedCount: 1, matchedAmount: statementAmount });
      setStatementAmount(0);
      setFeeAmount(0);
      setOtherDeductions([]);
      setBalanceUsed(0);
      setSelectedUuid(null);
      setSingleConfirmOpen(false);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  const actionLabel =
    mode === 'single' ? (submitLoading ? '沖帳中…' : '確認沖帳') : previewLoading ? '預覽拆帳中…' : '預覽拆帳';
  const actionDisabled =
    mode === 'single'
      ? submitLoading || !selectedRow || statementAmount <= 0
      : mode === 'multi'
        ? previewLoading || statementAmount <= 0 || selectedMultiUuids.size === 0
        : previewLoading || statementAmount <= 0;
  const actionError = mode === 'single' ? singleActionError : previewError;
  // 多筆沖帳一律以 canSettle（已選定明確管道／廠商）決定是否顯示，不隨勾選筆數增減掛載／卸載——
  // 否則勾選第一筆交易時這塊區域才出現，會把下方交易清單往下推，使接續快速勾選的第二、三筆點擊座標對不準（實測會漏勾）
  const showActionArea = mode === 'single' ? !!selectedRow : canSettle;

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">沖帳中心</h1>
          <p className="mt-1 text-sm text-neutral-mid">單筆、多筆或依銷售管道／廠商匯總，完成應收應付沖帳</p>
        </div>

        <div className="mb-5 w-full nav:w-56">
          <SegmentedControl options={SIDE_OPTIONS} value={side} onChange={handleSideChange} size="md" />
        </div>

        <div className="mb-5 flex flex-col gap-2">
          <PeriodFilterBar
            dateFrom={dateRange.dateFrom}
            dateTo={dateRange.dateTo}
            defaultDateFrom={defaultDateRange().dateFrom}
            defaultDateTo={defaultDateRange().dateTo}
            onApply={handleApplyDateRange}
            disabled={unlimitedDate}
          />
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-neutral-dark">
            <Checkbox checked={unlimitedDate} onChange={handleToggleUnlimitedDate} aria-label="不限日期，顯示全部未結清交易" />
            不限日期，顯示全部未結清交易
          </label>
        </div>

        {dataLoading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">
            載入{side === 'receivable' ? '銷售管道與應收帳款' : '廠商與應付帳款'}中…
          </div>
        ) : dataError ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{dataError}</div>
        ) : (
          <ResizableSplitPane
            defaultLeftWidth={224}
            minLeftWidth={180}
            maxLeftWidth={420}
            left={<ReconGroupSidebar groups={groups} selectedKey={selectedGroupKey} onSelect={handleSelectGroup} />}
          >
            {!selectedGroupKey ? (
              <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">
                請從左側選擇{side === 'receivable' ? '銷售管道' : '廠商'}
              </div>
            ) : (
              <div className={cn('flex flex-col gap-4', mode === 'summary' && !isAllGroup ? 'pb-20' : 'pb-4')}>
                {submittedInfo && (
                  <div className="rounded-md border border-semantic-success/30 bg-semantic-success-muted p-3 text-sm text-semantic-success-dark">
                    已沖銷 {submittedInfo.matchedCount} 筆交易，共 {fmtCurrency(submittedInfo.matchedAmount)}。
                  </div>
                )}

                {mode !== 'single' && isAllGroup && (
                  <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                    「全部管道」為唯讀總覽，{mode === 'multi' ? '多筆' : '匯總'}沖帳需先於左側選擇單一銷售管道／廠商；若要沖銷單一交易，可改用上方「單筆沖帳」
                  </div>
                )}

                {mode !== 'single' && !isAllGroup && !canSettle && (
                  <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                    此分類無對應{side === 'receivable' ? '銷售管道' : '廠商'}，暫不支援{mode === 'multi' ? '多筆' : '匯總'}沖帳，可改用單筆沖帳，或於左側切換至實際{side === 'receivable' ? '管道' : '廠商'}
                  </div>
                )}

                <ReconPoolPanel
                  mode={mode}
                  onModeChange={handleModeChange}
                  side={side}
                  selectedRow={mode === 'single' ? selectedRow : null}
                  selectedCount={selectedMultiUuids.size}
                  onClearSelection={mode === 'multi' ? clearMultiSelection : clearSingleSelection}
                  balanceLabel={selectedGroupLabel}
                  balance={selectedGroup?.balance}
                  balanceUsed={balanceUsed}
                  onBalanceUsedChange={handleBalanceUsedChange}
                  amountLabel={mode === 'single' ? '沖帳金額' : '對帳單金額'}
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
                  actionError={actionError}
                  onAction={mode === 'single' ? handleOpenSingleConfirm : handlePreview}
                  accounts={accounts}
                  accountsLoading={accountsLoading}
                  accountsError={accountsError}
                  bankAccountUuid={bankAccountUuid}
                  onBankAccountChange={setBankAccountUuid}
                />

                <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
                  <p className="mb-3 text-sm font-semibold text-neutral-dark">
                    {isAllGroup ? '全部交易' : side === 'payable' ? '待付帳款' : '待收帳款'}
                  </p>
                  {mode !== 'single' && !isAllGroup && <ReconPoolSummary side={side} statementAmount={statementAmount} previewResult={previewResult} />}
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
                  />
                </div>
              </div>
            )}
          </ResizableSplitPane>
        )}
      </div>

      {mode !== 'single' && selectedGroupKey && !isAllGroup && previewResult && (
        <div className="sticky bottom-0 z-10 border-t border-neutral-blue-gray/30 bg-white px-4 py-3 nav:px-7">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-1 nav:flex-row nav:items-center nav:justify-between">
            <div className="flex flex-col gap-0.5">
              <div className="text-sm text-neutral-dark">
                本次沖帳 <span className="font-semibold">{mode === 'multi' ? selectedMultiUuids.size : previewResult.affectedCount}</span> 筆 · 合計{' '}
                <span className="font-mono font-semibold tabular-nums">{fmtCurrency(previewResult.appliedSettleAmount)}</span>
                {hasDiff && (
                  <>
                    {' '}
                    · 差額 <span className="font-mono font-semibold tabular-nums text-semantic-error">{fmtCurrency(diffAmount)}</span>
                  </>
                )}
              </div>
              {hasDiff && <p className="text-xs text-neutral-mid">本次沖帳有差額，請選擇處理方式</p>}
            </div>
            {hasDiff ? (
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

      {mode !== 'single' && previewResult && !hasDiff && (
        <ReconConfirmSummaryModal
          open={confirmSummaryOpen}
          groupLabel={selectedGroupLabel}
          side={side}
          result={previewResult}
          submitting={submitLoading}
          submitError={submitError}
          onCancel={() => setConfirmSummaryOpen(false)}
          onConfirm={handleConfirmNoDiff}
        />
      )}

      {mode !== 'single' && previewResult && (
        <ReconSurplusModal
          open={surplusOpen}
          side={side}
          groupLabel={selectedGroupLabel}
          settleAmount={previewResult.settleAmount}
          totalBeforeRemaining={previewResult.totalBeforeRemaining}
          diff={diffAmount}
          submitting={submitLoading}
          submitError={submitError}
          onBack={handleChooseBack}
          onKeepOnBalance={handleChooseKeepOnBalance}
          onSettleToLast={handleChooseSettleToLast}
        />
      )}

      {mode !== 'single' && (
        <ReconSettleResultModal open={settleResultOpen} side={side} groupLabel={selectedGroupLabel} result={settleResult} onClose={() => setSettleResultOpen(false)} />
      )}

      {mode === 'single' && selectedRow && (
        <ReconSingleConfirmModal
          open={singleConfirmOpen}
          side={side}
          row={selectedRow}
          settleAmount={statementAmount}
          actualAmount={depositAmount}
          submitting={submitLoading}
          submitError={submitError}
          onCancel={() => setSingleConfirmOpen(false)}
          onConfirm={handleConfirmSingleSettle}
        />
      )}
    </div>
  );
}
