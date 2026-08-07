'use client';

import { listBankAccounts } from '@/api/bankAccounts';
import { listChannelRules } from '@/api/channelRules';
import type { BankAccountDto, ChannelRuleDto, VendorDto } from '@/api/types';
import { listVendors } from '@/api/vendors';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { mapPayableItemsToRows, mapReceivableItemsToRows } from '@/features/ledger/data';
import { cn, fmtCurrency } from '@/lib/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReconBalanceEditModal from './components/ReconBalanceEditModal';
import ReconConfirmSummaryModal from './components/ReconConfirmSummaryModal';
import ReconGroupSidebar from './components/ReconGroupSidebar';
import ReconPoolPanel, { type ReconOtherDeductionRow } from './components/ReconPoolPanel';
import ReconPoolSummary from './components/ReconPoolSummary';
import ReconSettleResultModal from './components/ReconSettleResultModal';
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
  payableRowsToCandidates,
  receivableRowsToCandidates,
  resolveCatchAllKey,
} from './data';
import type { ReconGroupOption } from './data';
import { fetchAllPayables, fetchAllReceivables } from './fetchAll';
import { previewSettle, submitSettle } from './settle';
import type { ReconSettleResult, ReconSide } from './types';

const SIDE_OPTIONS: { value: ReconSide; label: string }[] = [
  { value: 'receivable', label: '銷項' },
  { value: 'payable', label: '進項' },
];

interface SideData {
  candidates: ReturnType<typeof receivableRowsToCandidates>;
  groupOptions: ReconGroupOption[];
  nameByUuid: Map<string, string>;
  /** 完整 DTO 清單，供餘額編輯彈窗帶出既有欄位（PATCH 為整批覆寫，非 partial patch）；銷項用 channelRules，進項用 vendors */
  channelRules: ChannelRuleDto[];
  vendors: VendorDto[];
}

/** Date → API 需要的西元 YYYYMMDD 字串（比照 features/ledger/transaction/data.ts 的 formatYmd） */
function toYyyymmdd(date: Date | undefined): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 匯總沖帳頁：選擇銷售管道／廠商後，輸入對帳單金額並預覽拆帳，確認沖帳對象與結果。
 * 銷售管道與廠商清單取自真實 API（/ael/payment/channelRules、/ael/vendors，含當前餘額 balance），
 * 候選交易亦取自真實 API（/ael/ledger/receivables/filter、/ael/ledger/payables/filter），
 * 分組比對一律依 uuid（paymentChannelUuid／counterpartyUuid）而非名稱字串，避免同名不同管道/廠商誤判。
 *
 * 沖帳對象與拆帳結果一律由後端 settle/preview API 決定（依 transaction_date 由舊到新分配），前端不再由
 * 使用者手動勾選調整；下方交易清單改為純檢視，將預覽結果疊加顯示為圓形狀態（見 ReconTxnList）。
 *
 * 預覽（isBalance 固定帶 false，僅作試算）成功後：
 * - 若對帳單金額與待沖總額完全相符（無超沖／少沖），開放「確認沖帳」直接送出（isBalance 送 false，無影響）。
 * - 若有差額，立即彈出三選一提示（見 ReconSurplusModal）：
 *   A 回去檢查：不呼叫任何 API，停留原畫面讓使用者確認金額／交易資料。
 *   B 留在餘額上，帶下次沖帳使用：以 isBalance=true 重新預覽一次取得正確的 closed 分佈，
 *     實際存入/付出金額（depositAmount／paymentAmount）改帶「實際沖完整那幾筆金額總和」
 *     （closed=true 各筆 settleAmount 加總，見 api.md 對 settle/summary 的說明），再呼叫執行 API。
 *   C 將金額沖入最後一筆交易：以 isBalance=false（沿用原本的預覽結果）呼叫執行 API，
 *     實際存入/付出金額沿用使用者原始輸入值。
 * 執行成功後，清空已快取的候選清單並重新向後端拉取（含最新餘額），讓已沖帳交易與餘額變動自然反映。
 */
export default function ReconciliationView() {
  const [side, setSide] = useState<ReconSide>('receivable');
  // 預設顯示「全部管道」唯讀總覽，讓使用者一進頁面就能看到完整交易清單，不需先手動點選
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(ALL_GROUP_KEY);
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
  const [submittedInfo, setSubmittedInfo] = useState<{ matchedCount: number; matchedAmount: number } | null>(null);
  // 目前展開中的交易 uuid（就地展開看大約資訊，一次僅展開一列）
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);
  // 編輯餘額彈窗：帶入目前選定要編輯的群組 uuid（null 代表關閉）
  const [balanceEditKey, setBalanceEditKey] = useState<string | null>(null);

  // 銀行帳戶：確認沖帳時實際入帳／出帳的目標帳戶
  const [accounts, setAccounts] = useState<BankAccountDto[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState('');
  const [bankAccountUuid, setBankAccountUuid] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // 沖帳執行結果（settle/summary 回應正規化後）：成功後開結果 modal 顯示摘要、沖前/沖後餘額與各原單明細
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
        if (!cancelled) setAccountsError(err instanceof Error ? err.message : '操作失敗');
      })
      .finally(() => {
        if (!cancelled) setAccountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 銷項預設收款帳戶、進項預設付款帳戶；side 切換時重新套用（呼應 handleSideChange 重置其餘輸入的行為）
  useEffect(() => {
    if (accounts.length === 0) return;
    const defaultAccount = side === 'payable' ? accounts.find(a => a.isDefaultPaymentAccount) : accounts.find(a => a.isDefaultReceivingAccount);
    setBankAccountUuid((defaultAccount ?? accounts[0]).uuid);
  }, [side, accounts]);

  const [receivableData, setReceivableData] = useState<SideData | null>(null);
  const [payableData, setPayableData] = useState<SideData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  // 依 side 惰性載入並快取：切換回已載入過的一側不重新打 API；執行沖帳成功後會清空快取觸發重新拉取
  useEffect(() => {
    if (side === 'receivable' ? receivableData !== null : payableData !== null) return;
    let cancelled = false;
    setDataLoading(true);
    setDataError('');
    const task =
      side === 'receivable'
        ? Promise.all([listChannelRules(), fetchAllReceivables()]).then(([channelList, items]) => {
            const activeChannels = channelList.filter(c => c.isActive);
            const groupOptions = activeChannels.map(c => ({ uuid: c.uuid, name: c.channelName, balance: c.balance }));
            const nameByUuid = new Map(channelList.map(c => [c.uuid, c.channelName]));
            const candidates = receivableRowsToCandidates(mapReceivableItemsToRows(items));
            if (!cancelled) setReceivableData({ candidates, groupOptions, nameByUuid, channelRules: channelList, vendors: [] });
          })
        : Promise.all([listVendors(), fetchAllPayables()]).then(async ([vendorList, items]) => {
            const activeVendors = vendorList.filter(v => v.isActive);
            const groupOptions = activeVendors.map(v => ({ uuid: v.uuid, name: v.name, balance: v.balance }));
            const nameByUuid = new Map(vendorList.map(v => [v.uuid, v.name]));
            const candidates = payableRowsToCandidates(await mapPayableItemsToRows(items));
            if (!cancelled) setPayableData({ candidates, groupOptions, nameByUuid, channelRules: [], vendors: vendorList });
          });
    task
      .catch(err => {
        if (!cancelled) setDataError(err instanceof Error ? err.message : '操作失敗');
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [side, receivableData, payableData]);

  const sideData = side === 'receivable' ? receivableData : payableData;
  const availableCandidates = sideData?.candidates ?? [];

  const groupOptions = sideData?.groupOptions ?? [];

  // 「全部管道」為唯讀總覽項，永遠列在最前面，不參與 buildReconGroups 的管道比對邏輯
  const groups = useMemo(() => {
    const allGroup = {
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

  const selectedGroupLabel = groups.find(g => g.key === selectedGroupKey)?.label ?? '';

  // 預覽結果依 ledgerUuid 疊加回交易清單顯示狀態圓圈，純檢視用途
  const allocationByUuid = useMemo(() => {
    const map = new Map(previewResult?.allocations.map(a => [a.ledgerUuid, a]) ?? []);
    return map;
  }, [previewResult]);

  // 目前選定群組是否對應一個真實銷售管道／廠商 uuid（含使用者自建同名「其他」的情況），預覽拆帳與確認沖帳皆需要明確的 uuid
  const isKnownChannel = groupOptions.some(o => o.uuid === selectedGroupKey);
  const canSettle = isKnownChannel;

  const depositAmount = statementAmount - feeAmount - otherDeductions.reduce((sum, r) => sum + r.amount, 0);
  // 差額判斷須以逐筆拆帳狀態（settlementStatus）為準，不能只比較 settleAmount 與 totalBeforeRemaining——
  // 該管道／廠商若已有非零的既有餘額（balanceBefore），後端會自動將其併入本次結算，
  // 即使 settleAmount 剛好等於 totalBeforeRemaining 仍可能造成超沖/少沖（實測驗證過），此時仍須讓使用者透過 A/B/C 選擇處理方式
  const hasDiff = !!previewResult && previewResult.allocations.some(a => a.settlementStatus !== 0);
  const diffAmount = previewResult ? Math.abs(previewResult.appliedSettleAmount - previewResult.totalBeforeRemaining) : 0;

  const resetInputs = () => {
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setPreviewResult(null);
    setPreviewError('');
    setSubmitError('');
    setConfirmSummaryOpen(false);
    setSurplusOpen(false);
    setSubmittedInfo(null);
    setExpandedUuid(null);
    setSettleResultOpen(false);
  };

  const handleSideChange = (next: ReconSide) => {
    setSide(next);
    setSelectedGroupKey(ALL_GROUP_KEY);
    resetInputs();
  };

  const handleSelectGroup = (key: string) => {
    setSelectedGroupKey(key);
    resetInputs();
  };

  const handleStatementChange = (value: number) => {
    setStatementAmount(value);
    setPreviewResult(null);
    setPreviewError('');
    setSubmittedInfo(null);
  };
  const handleFeeChange = (value: number) => {
    setFeeAmount(value);
    setPreviewResult(null);
    setPreviewError('');
  };

  const handleAddOtherDeduction = () => {
    otherDeductionIdRef.current += 1;
    setOtherDeductions(prev => [...prev, { id: `OD-${otherDeductionIdRef.current}`, subject: null, name: '', amount: 0 }]);
    setPreviewResult(null);
    setPreviewError('');
  };
  const handleRemoveOtherDeduction = (id: string) => {
    setOtherDeductions(prev => prev.filter(r => r.id !== id));
    setPreviewResult(null);
    setPreviewError('');
  };
  const handleChangeOtherDeduction = (id: string, patch: Partial<Omit<ReconOtherDeductionRow, 'id'>>) => {
    setOtherDeductions(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
    setPreviewResult(null);
    setPreviewError('');
  };

  // 預覽拆帳（isBalance 固定帶 false，僅作試算用途）：成功後若有差額立即彈出三選一提示，無差額則等待使用者按「確認沖帳」
  const handlePreview = async () => {
    if (!selectedGroupKey || !isKnownChannel) return;
    if (statementAmount <= 0) {
      setPreviewError('請先輸入對帳單金額');
      return;
    }
    if (depositAmount < 0) {
      setPreviewError('手續費與額外金額總和不可超過對帳單金額');
      return;
    }
    if (otherDeductions.some(r => !r.subject?.id || !r.name.trim() || r.amount <= 0)) {
      setPreviewError('請完整填寫額外金額的科目、名稱與金額');
      return;
    }
    if (!paymentDate) {
      setPreviewError(side === 'payable' ? '請先選擇付款日' : '請先選擇收款日');
      return;
    }
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const result = await previewSettle({
        side,
        groupUuid: selectedGroupKey,
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        isBalance: false,
        feeAmount,
        otherDeductions,
      });
      setPreviewResult(result);
      // 差額判斷邏輯同 hasDiff（見上方註解），須以逐筆拆帳狀態為準，不能只比較 settleAmount 與 totalBeforeRemaining
      if (result.allocations.some(a => a.settlementStatus !== 0)) setSurplusOpen(true);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : '操作失敗');
    } finally {
      setPreviewLoading(false);
    }
  };

  // 執行沖帳成功後的共用收尾：清空快取候選清單觸發重新拉取（含最新餘額），並開啟結果彈窗
  const finalizeSettle = (result: ReconSettleResult) => {
    if (side === 'receivable') setReceivableData(null);
    else setPayableData(null);
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setPreviewResult(null);
    setPreviewError('');
    setConfirmSummaryOpen(false);
    setSurplusOpen(false);
    setSubmittedInfo({ matchedCount: result.affectedCount, matchedAmount: result.appliedSettleAmount });
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
        ledgerUuids: previewResult.allocations.map(a => a.ledgerUuid),
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        isBalance: false,
        feeAmount,
        otherDeductions,
      });
      finalizeSettle(result);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '操作失敗');
    } finally {
      setSubmitLoading(false);
    }
  };

  // A：回去檢查，純關閉提示，不呼叫任何 API，讓使用者調整輸入後重新預覽
  const handleChooseBack = () => {
    setSurplusOpen(false);
  };

  // B：留在餘額上，帶下次沖帳使用——isBalance=true 下「已結清」的原單分佈與 isBalance=false 不同（見檔案頂端說明），
  // 故重新預覽一次取得正確結果，depositAmount／paymentAmount 改帶「實際沖完整那幾筆金額總和」
  const handleChooseKeepOnBalance = async () => {
    if (!requireSubmitReady() || !selectedGroupKey) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const rePreview = await previewSettle({
        side,
        groupUuid: selectedGroupKey,
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        isBalance: true,
        feeAmount,
        otherDeductions,
      });
      // isBalance=true 時，後端只會沖能「完整結清」的原單——沖不滿的最後一筆會直接排除在 ledgerAllocations 外
      // （不勾選、不異動），差額改記入餘額。故 settleAmount／實際存入(付出)金額都必須改用重新預覽後、
      // 已排除該筆的 appliedSettleAmount／actualAmount，不能沿用使用者原始輸入的對帳單金額。
      const result = await submitSettle({
        side,
        ledgerUuids: rePreview.allocations.map(a => a.ledgerUuid),
        settleAmount: rePreview.appliedSettleAmount,
        actualAmount: rePreview.actualAmount,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        isBalance: true,
        feeAmount,
        otherDeductions,
      });
      finalizeSettle(result);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '操作失敗');
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
        ledgerUuids: previewResult.allocations.map(a => a.ledgerUuid),
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        isBalance: false,
        feeAmount,
        otherDeductions,
      });
      finalizeSettle(result);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '操作失敗');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenConfirmSummary = () => {
    if (!canSettle || !previewResult) return;
    setSubmitError('');
    setConfirmSummaryOpen(true);
  };

  // 側邊欄「編輯餘額」：帶出完整 DTO（PATCH 為整批覆寫），成功後清空快取觸發重新拉取最新餘額
  const editingChannelRule = sideData?.channelRules.find(c => c.uuid === balanceEditKey);
  const editingVendor = sideData?.vendors.find(v => v.uuid === balanceEditKey);
  const handleBalanceSaved = () => {
    if (side === 'receivable') setReceivableData(null);
    else setPayableData(null);
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">匯總沖帳</h1>
          <p className="mt-1 text-sm text-neutral-mid">依銷售管道或廠商，將對帳單金額與待沖帳款預覽拆帳後沖銷</p>
        </div>

        <div className="mb-5 w-full nav:w-56">
          <SegmentedControl options={SIDE_OPTIONS} value={side} onChange={handleSideChange} size="md" />
        </div>

        {dataLoading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">
            載入{side === 'receivable' ? '銷售管道與應收帳款' : '廠商與應付帳款'}中…
          </div>
        ) : dataError ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{dataError}</div>
        ) : (
          <div className="flex flex-col gap-4 nav:flex-row nav:items-start nav:gap-6">
            <ReconGroupSidebar groups={groups} selectedKey={selectedGroupKey} onSelect={handleSelectGroup} onEditBalance={setBalanceEditKey} />

            <div className="min-w-0 flex-1 nav:max-w-[760px]">
              {!selectedGroupKey ? (
                <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">
                  請從左側選擇{side === 'receivable' ? '銷售管道' : '廠商'}
                </div>
              ) : (
                <div className={cn('flex flex-col gap-4', isAllGroup ? 'pb-4' : 'pb-20')}>
                  {submittedInfo && !isAllGroup && (
                    <div className="rounded-md border border-semantic-success/30 bg-semantic-success-muted p-3 text-sm text-semantic-success-dark">
                      已沖銷 {submittedInfo.matchedCount} 筆交易，共 {fmtCurrency(submittedInfo.matchedAmount)}。
                    </div>
                  )}

                  {!isAllGroup && !canSettle && (
                    <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                      此分類無對應{side === 'receivable' ? '銷售管道' : '廠商'}，暫不支援預覽拆帳，請於左側切換至實際{side === 'receivable' ? '管道' : '廠商'}
                    </div>
                  )}

                  {!isAllGroup && (
                    <ReconPoolPanel
                      side={side}
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
                        setPreviewResult(null);
                      }}
                      showPreview={canSettle}
                      previewLoading={previewLoading}
                      previewError={previewError}
                      onPreview={handlePreview}
                      accounts={accounts}
                      accountsLoading={accountsLoading}
                      accountsError={accountsError}
                      bankAccountUuid={bankAccountUuid}
                      onBankAccountChange={setBankAccountUuid}
                    />
                  )}

                  <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
                    <p className="mb-3 text-sm font-semibold text-neutral-dark">{isAllGroup ? '全部交易' : '待沖帳款'}</p>
                    {!isAllGroup && <ReconPoolSummary statementAmount={statementAmount} previewResult={previewResult} />}
                    <ReconTxnList
                      side={side}
                      sections={sections}
                      showSectionHeaders={isOtherGroup}
                      showStatusColumn={!isAllGroup}
                      emptyMessage={isAllGroup ? '目前沒有交易' : '此群組沒有待沖帳的交易'}
                      channelNameByUuid={sideData?.nameByUuid ?? new Map()}
                      expandedUuid={expandedUuid}
                      onToggleExpand={uuid => setExpandedUuid(prev => (prev === uuid ? null : uuid))}
                      allocationByUuid={allocationByUuid}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedGroupKey && !isAllGroup && previewResult && (
        <div className="sticky bottom-0 z-10 border-t border-neutral-blue-gray/30 bg-white px-4 py-3 nav:px-7">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-1 nav:flex-row nav:items-center nav:justify-between">
            <div className="flex flex-col gap-0.5">
              <div className="text-sm text-neutral-dark">
                本次沖帳 <span className="font-semibold">{previewResult.affectedCount}</span> 筆 · 合計{' '}
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

      {previewResult && !hasDiff && (
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

      {previewResult && (
        <ReconSurplusModal
          open={surplusOpen}
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

      <ReconSettleResultModal open={settleResultOpen} side={side} groupLabel={selectedGroupLabel} result={settleResult} onClose={() => setSettleResultOpen(false)} />

      <ReconBalanceEditModal
        open={!!balanceEditKey}
        side={side}
        channelRule={editingChannelRule}
        vendor={editingVendor}
        onClose={() => setBalanceEditKey(null)}
        onSaved={handleBalanceSaved}
      />
    </div>
  );
}
