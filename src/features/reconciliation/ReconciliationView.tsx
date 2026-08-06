'use client';

import { listBankAccounts } from '@/api/bankAccounts';
import { listChannelRules } from '@/api/channelRules';
import { previewSettleReceivable, settleReceivableSummary } from '@/api/ledger';
import type { BankAccountDto, SettleReceivableSummaryResult } from '@/api/types';
import { listVendors } from '@/api/vendors';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { mapPayableItemsToRows, mapReceivableItemsToRows } from '@/features/ledger/data';
import { cn, fmtCurrency } from '@/lib/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import type { ReconSide } from './types';

const SIDE_OPTIONS: { value: ReconSide; label: string }[] = [
  { value: 'receivable', label: '銷項' },
  { value: 'payable', label: '進項' },
];

interface SideData {
  candidates: ReturnType<typeof receivableRowsToCandidates>;
  groupOptions: ReconGroupOption[];
  nameByUuid: Map<string, string>;
}

/**
 * 匯總沖帳頁：選擇銷售管道／廠商後，逐筆勾選待沖帳款進行沖銷。
 * 銷售管道與廠商清單取自真實 API（/ael/payment/channelRules、/ael/vendors），
 * 候選交易亦取自真實 API（/ael/ledger/receivables/filter、/ael/ledger/payables/filter），
 * 分組比對一律依 uuid（paymentChannelUuid／counterpartyUuid）而非名稱字串，避免同名不同管道/廠商誤判。
 * 對帳單金額為本次「總金額」，手續費與額外金額皆為從中扣除的減項，扣完即為實際存入金額；
 * 可沖銷總額（pool）= 對帳單金額，勾選金額不可超過 pool（少沖時該筆停用）。
 * 目前僅銷項且選到有明確 paymentChannelUuid 的真實管道時，「確認沖帳」才會真正呼叫後端執行；
 * 其餘情況（進項、「其他」／「全部管道」）尚無對應後端 API，確認沖帳鈕停用並顯示原因。
 * 銷項可先呼叫預覽拆帳 API（/ael/ledger/reconciliation/receivables/settle/preview，settleAmount 為對帳單金額、
 * depositAmount 為扣除手續費與額外金額後的實際存入金額），後端依交易日期由舊到新試算各原單分配結果，
 * 前端把結果對應回下方逐筆勾選清單並自動勾選已結清（closed）的原單，使用者仍可再次手動調整勾選；
 * 有預覽結果時不再套用本地「超出剩餘即停用」護欄。
 * 確認沖帳呼叫 /ael/ledger/reconciliation/receivables/settle/summary 真正執行後，清空已快取的候選清單並
 * 重新向後端拉取，讓已沖帳交易（remainingAmount 歸零）自然從候選清單消失，不再靠前端自行記錄比對。
 */
export default function ReconciliationView() {
  const [side, setSide] = useState<ReconSide>('receivable');
  // 預設顯示「全部管道」唯讀總覽，讓使用者一進頁面就能看到完整交易清單，不需先手動點選
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(ALL_GROUP_KEY);
  const [statementAmount, setStatementAmount] = useState(0);
  const [feeAmount, setFeeAmount] = useState(0);
  // 額外金額（otherDeductions）：僅銷項預覽拆帳使用，id 以遞增計數器產生（不可用 Date.now()/Math.random()）
  const [otherDeductions, setOtherDeductions] = useState<ReconOtherDeductionRow[]>([]);
  const otherDeductionIdRef = useRef(0);
  // 是否已成功呼叫過預覽拆帳；僅用於放寬下方逐筆勾選的本地護欄，不保留完整回應內容
  const [hasPreviewResult, setHasPreviewResult] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [confirmSummaryOpen, setConfirmSummaryOpen] = useState(false);
  const [surplusModalOpen, setSurplusModalOpen] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState<{ matchedCount: number; matchedAmount: number } | null>(null);
  // 目前展開中的交易 uuid（就地展開看大約資訊，一次僅展開一列）
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);

  // 存入銀行帳戶：僅銷項確認沖帳時需要，載入啟用中帳戶並預設收款帳戶
  const [accounts, setAccounts] = useState<BankAccountDto[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState('');
  const [bankAccountUuid, setBankAccountUuid] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // 沖帳執行結果（settle/summary 回應）：成功後開結果 modal 顯示摘要與各原單明細
  const [settleResult, setSettleResult] = useState<SettleReceivableSummaryResult | null>(null);
  const [settleResultOpen, setSettleResultOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listBankAccounts()
      .then(list => {
        if (cancelled) return;
        const active = list.filter(a => a.isActive);
        setAccounts(active);
        const defaultAccount = active.find(a => a.isDefaultReceivingAccount) ?? active[0];
        if (defaultAccount) setBankAccountUuid(defaultAccount.uuid);
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

  const [receivableData, setReceivableData] = useState<SideData | null>(null);
  const [payableData, setPayableData] = useState<SideData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  // 依 side 惰性載入並快取：切換回已載入過的一側不重新打 API
  useEffect(() => {
    if (side === 'receivable' ? receivableData !== null : payableData !== null) return;
    let cancelled = false;
    setDataLoading(true);
    setDataError('');
    const task =
      side === 'receivable'
        ? Promise.all([listChannelRules(), fetchAllReceivables()]).then(([channelList, items]) => {
            const groupOptions = channelList.filter(c => c.isActive).map(c => ({ uuid: c.uuid, name: c.channelName }));
            const nameByUuid = new Map(channelList.map(c => [c.uuid, c.channelName]));
            const candidates = receivableRowsToCandidates(mapReceivableItemsToRows(items));
            if (!cancelled) setReceivableData({ candidates, groupOptions, nameByUuid });
          })
        : Promise.all([listVendors(), fetchAllPayables()]).then(async ([vendorList, items]) => {
            const groupOptions = vendorList.filter(v => v.isActive).map(v => ({ uuid: v.uuid, name: v.name }));
            const nameByUuid = new Map(vendorList.map(v => [v.uuid, v.name]));
            const candidates = payableRowsToCandidates(await mapPayableItemsToRows(items));
            if (!cancelled) setPayableData({ candidates, groupOptions, nameByUuid });
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

  const otherDeductionsTotal = useMemo(() => otherDeductions.reduce((sum, r) => sum + r.amount, 0), [otherDeductions]);
  // 可沖銷總額：對帳單金額本身即為總金額，手續費／額外金額是從中扣除的減項（見 ReconPoolPanel）
  const pool = statementAmount;
  const matched = useMemo(() => groupRows.filter(r => checkedIds.has(r.uuid)).reduce((sum, r) => sum + r.amount, 0), [groupRows, checkedIds]);
  const remaining = pool - matched;
  // 未勾選且金額超過目前剩餘可沖銷金額的交易，勾選後會使沖銷金額超過本次可沖銷總額，故停用；
  // 已有預覽拆帳結果時，分配方式改由後端決定，不再套用此前端護欄
  const disabledIds = useMemo(
    () => (hasPreviewResult ? new Set<string>() : new Set(groupRows.filter(r => !checkedIds.has(r.uuid) && r.amount > remaining).map(r => r.uuid))),
    [groupRows, checkedIds, remaining, hasPreviewResult],
  );
  // 目前選定群組是否對應一個真實銷售管道／廠商 uuid（含使用者自建同名「其他」的情況），預覽拆帳與確認沖帳皆需要明確的 paymentChannelUuid
  const isKnownChannel = groupOptions.some(o => o.uuid === selectedGroupKey);
  // 目前僅銷項且選到真實管道時，後端才有對應的 settle/summary API 可執行沖帳
  const canSettle = side === 'receivable' && isKnownChannel;
  const canConfirm = canSettle && checkedIds.size > 0;

  const resetInputs = () => {
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setHasPreviewResult(false);
    setPreviewError('');
    setSubmitError('');
    setCheckedIds(new Set());
    setConfirmSummaryOpen(false);
    setSurplusModalOpen(false);
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

  const handleToggle = (uuid: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
    setSubmittedInfo(null);
  };

  // 對帳單金額變更後，若已勾選金額超過新的可沖銷總額，清空勾選避免沖銷超過本次可沖銷總額；
  // 手續費／額外金額不影響可沖銷總額（純減項，見 ReconPoolPanel），故不清空勾選，但仍會使先前的預覽拆帳結果失真
  const handleStatementChange = (value: number) => {
    setStatementAmount(value);
    if (matched > value) setCheckedIds(new Set());
    setHasPreviewResult(false);
    setPreviewError('');
    setSubmittedInfo(null);
  };
  const handleFeeChange = (value: number) => {
    setFeeAmount(value);
    setHasPreviewResult(false);
    setPreviewError('');
    setSubmittedInfo(null);
  };

  const handleAddOtherDeduction = () => {
    otherDeductionIdRef.current += 1;
    setOtherDeductions(prev => [...prev, { id: `OD-${otherDeductionIdRef.current}`, subject: null, name: '', amount: 0 }]);
    setHasPreviewResult(false);
    setPreviewError('');
  };
  const handleRemoveOtherDeduction = (id: string) => {
    setOtherDeductions(prev => prev.filter(r => r.id !== id));
    setHasPreviewResult(false);
    setPreviewError('');
  };
  const handleChangeOtherDeduction = (id: string, patch: Partial<Omit<ReconOtherDeductionRow, 'id'>>) => {
    setOtherDeductions(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
    setHasPreviewResult(false);
    setPreviewError('');
  };

  // 呼叫預覽拆帳 API（僅銷項）：settleAmount 為對帳單金額本身，depositAmount 為扣除手續費與額外金額後的實際存入金額，
  // 成功後將拆帳結果對應回原候選列，並自動勾選已結清（closed）的原單
  const handlePreview = async () => {
    if (side !== 'receivable' || !selectedGroupKey || !isKnownChannel) return;
    if (statementAmount <= 0) {
      setPreviewError('請先輸入對帳單金額');
      return;
    }
    const depositAmount = statementAmount - feeAmount - otherDeductionsTotal;
    if (depositAmount < 0) {
      setPreviewError('手續費與額外金額總和不可超過對帳單金額');
      return;
    }
    if (otherDeductions.some(r => !r.subject?.id || !r.name.trim() || r.amount <= 0)) {
      setPreviewError('請完整填寫額外金額的科目、名稱與金額');
      return;
    }
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const res = await previewSettleReceivable({
        allocations: { name: '手續費', feeAmount },
        depositAmount,
        // 使用者未新增任何額外金額時不傳此參數
        ...(otherDeductions.length > 0
          ? { otherDeductions: otherDeductions.map(r => ({ name: r.name, amount: r.amount, officialAccountingSubjectId: r.subject!.id! })) }
          : {}),
        paymentChannelUuid: selectedGroupKey,
        settleAmount: statementAmount,
      });
      setHasPreviewResult(true);
      setCheckedIds(new Set(res.ledgerAllocations.filter(a => a.closed).map(a => a.ledgerUuid)));
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : '操作失敗');
    } finally {
      setPreviewLoading(false);
    }
  };

  // 回傳是否成功，讓呼叫端（confirm summary／surplus modal）決定是否關閉當前彈窗；
  // 失敗時維持彈窗開啟並顯示 submitError，避免使用者看不到錯誤原因
  const submitRecord = async (): Promise<boolean> => {
    if (!canSettle || !selectedGroupKey) return false;
    if (!bankAccountUuid) {
      setSubmitError('請先選擇存入銀行帳戶');
      return false;
    }
    const matchedCount = checkedIds.size;
    setSubmitLoading(true);
    setSubmitError('');
    let summaryResult: SettleReceivableSummaryResult;
    try {
      summaryResult = await settleReceivableSummary({ ledgerUuids: Array.from(checkedIds), bankAccountUuid });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '操作失敗');
      setSubmitLoading(false);
      return false;
    }
    setSubmitLoading(false);

    // 真正沖帳成功後，已沖帳的原單 remainingAmount 會歸零，清空快取的候選清單並重新向後端拉取，
    // 讓候選清單自然反映最新狀態，不再靠前端自行記錄「已沖帳」清單來排除
    setReceivableData(null);
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setHasPreviewResult(false);
    setPreviewError('');
    setCheckedIds(new Set());
    setSurplusModalOpen(false);
    setSubmittedInfo({ matchedCount, matchedAmount: matched });
    setSettleResult(summaryResult);
    setSettleResultOpen(true);
    return true;
  };

  const handleOpenConfirmSummary = () => {
    if (!canConfirm) return;
    setSubmitError('');
    setConfirmSummaryOpen(true);
  };

  // 摘要覆核確認送出後，才依是否有餘額決定直接送出或彈出多餘額提示；
  // 送出中維持彈窗開啟以顯示 submitting／submitError，失敗時也不關閉，讓使用者可重試
  const handleConfirmFromSummary = async () => {
    if (remaining > 0) {
      setConfirmSummaryOpen(false);
      setSurplusModalOpen(true);
      return;
    }
    const ok = await submitRecord();
    if (ok) setConfirmSummaryOpen(false);
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">匯總沖帳</h1>
          <p className="mt-1 text-sm text-neutral-mid">依銷售管道或廠商，將對帳單金額與待沖帳款逐筆核對沖銷</p>
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
            <ReconGroupSidebar groups={groups} selectedKey={selectedGroupKey} onSelect={handleSelectGroup} />

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

                  {!isAllGroup && (
                    <ReconPoolPanel
                      statementAmount={statementAmount}
                      feeAmount={feeAmount}
                      onStatementChange={handleStatementChange}
                      onFeeChange={handleFeeChange}
                      otherDeductions={otherDeductions}
                      onAddOtherDeduction={handleAddOtherDeduction}
                      onRemoveOtherDeduction={handleRemoveOtherDeduction}
                      onChangeOtherDeduction={handleChangeOtherDeduction}
                      showPreview={side === 'receivable' && isKnownChannel}
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
                    {!isAllGroup && <ReconPoolSummary pool={pool} matched={matched} remaining={remaining} />}
                    <ReconTxnList
                      side={side}
                      sections={sections}
                      showSectionHeaders={isOtherGroup}
                      selectable={!isAllGroup}
                      checkedIds={checkedIds}
                      disabledIds={disabledIds}
                      onToggle={handleToggle}
                      emptyMessage={isAllGroup ? '目前沒有交易' : '此群組沒有待沖帳的交易'}
                      pool={pool}
                      remaining={remaining}
                      channelNameByUuid={sideData?.nameByUuid ?? new Map()}
                      expandedUuid={expandedUuid}
                      onToggleExpand={uuid => setExpandedUuid(prev => (prev === uuid ? null : uuid))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedGroupKey && !isAllGroup && (
        <div className="sticky bottom-0 z-10 border-t border-neutral-blue-gray/30 bg-white px-4 py-3 nav:px-7">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-1 nav:flex-row nav:items-center nav:justify-between">
            <div className="flex flex-col gap-0.5">
              <div className="text-sm text-neutral-dark">
                已勾選 <span className="font-semibold">{checkedIds.size}</span> 筆 · 合計{' '}
                <span className="font-mono font-semibold tabular-nums">{fmtCurrency(matched)}</span> · 差額{' '}
                <span className={cn('font-mono font-semibold tabular-nums', remaining === 0 && matched > 0 ? 'text-semantic-success' : 'text-neutral-dark')}>
                  {fmtCurrency(remaining)}
                </span>
              </div>
              {!canSettle && (
                <p className="text-xs text-neutral-mid">
                  {side === 'payable' ? '進項確認沖帳尚未串接後端 API，敬請期待' : '此分類無對應銷售管道，暫不支援確認沖帳，請於左側切換至實際管道'}
                </p>
              )}
            </div>
            <Button variant="primary" onClick={handleOpenConfirmSummary} disabled={!canConfirm || submitLoading}>
              {submitLoading ? '沖帳中…' : '確認沖帳'}
            </Button>
          </div>
        </div>
      )}

      <ReconConfirmSummaryModal
        open={confirmSummaryOpen}
        groupLabel={selectedGroupLabel}
        side={side}
        matchedCount={checkedIds.size}
        matchedAmount={matched}
        pool={pool}
        remaining={remaining}
        submitting={submitLoading}
        submitError={submitError}
        onCancel={() => setConfirmSummaryOpen(false)}
        onConfirm={handleConfirmFromSummary}
      />

      <ReconSurplusModal
        open={surplusModalOpen}
        groupLabel={selectedGroupLabel}
        pool={pool}
        matched={matched}
        surplus={remaining}
        submitting={submitLoading}
        submitError={submitError}
        onBack={() => setSurplusModalOpen(false)}
        onConfirmAnyway={() => submitRecord()}
      />

      <ReconSettleResultModal open={settleResultOpen} result={settleResult} onClose={() => setSettleResultOpen(false)} />
    </div>
  );
}
