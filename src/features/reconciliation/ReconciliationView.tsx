'use client';

import { listChannelRules } from '@/api/channelRules';
import { listVendors } from '@/api/vendors';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { mapPayableItemsToRows, mapReceivableItemsToRows } from '@/features/ledger/data';
import { cn, fmtCurrency } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import ReconConfirmSummaryModal from './components/ReconConfirmSummaryModal';
import ReconGroupSidebar from './components/ReconGroupSidebar';
import ReconPoolPanel from './components/ReconPoolPanel';
import ReconSurplusModal from './components/ReconSurplusModal';
import ReconTxnDetailModal from './components/ReconTxnDetailModal';
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
import { addCarryOver, addReconRecord, consumeCarryOver, setReassignedGroup, useCarryOver, useReassignMap, useReconRecords } from './reconStore';
import type { ReconRecord, ReconSide, ReconTxnRef } from './types';

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
 * 可沖銷總額（pool）= 對帳單金額 + 手續費 + 上次結餘；勾選金額不可超過 pool（少沖時該筆停用），
 * 沖帳完畢後若仍有餘額（多沖），詢問使用者要回去檢查還是將餘額留到下次沖帳使用。
 */
export default function ReconciliationView() {
  const [side, setSide] = useState<ReconSide>('receivable');
  // 預設顯示「全部管道」唯讀總覽，讓使用者一進頁面就能看到完整交易清單，不需先手動點選
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(ALL_GROUP_KEY);
  const [statementAmount, setStatementAmount] = useState(0);
  const [feeAmount, setFeeAmount] = useState(0);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [confirmSummaryOpen, setConfirmSummaryOpen] = useState(false);
  const [surplusModalOpen, setSurplusModalOpen] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState<{ matchedCount: number; matchedAmount: number; carryOverOut: number } | null>(null);
  const [detailRow, setDetailRow] = useState<ReconTxnRef | null>(null);

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

  // 排除先前已沖帳過的交易，避免同一筆交易被重複沖帳
  const pastRecords = useReconRecords(side);
  const reconciledUuids = useMemo(() => new Set(pastRecords.flatMap(r => r.matched.map(m => m.uuid))), [pastRecords]);
  const availableCandidates = useMemo(
    () => (sideData ? sideData.candidates.filter(c => !reconciledUuids.has(c.uuid)) : []),
    [sideData, reconciledUuids],
  );

  // 「其他」交易的手動歸類覆寫（純前端 mock，後端無對應 API）
  const reassignMap = useReassignMap(side);
  const groupOptions = sideData?.groupOptions ?? [];

  // 「全部管道」為唯讀總覽項，永遠列在最前面，不參與 buildReconGroups 的管道比對邏輯
  const groups = useMemo(() => {
    const allGroup = {
      key: ALL_GROUP_KEY,
      label: ALL_GROUP_LABEL,
      count: availableCandidates.length,
      amount: availableCandidates.reduce((sum, c) => sum + c.amount, 0),
    };
    return [allGroup, ...buildReconGroups(availableCandidates, groupOptions, reassignMap)];
  }, [availableCandidates, groupOptions, reassignMap]);

  const catchAllKey = useMemo(() => resolveCatchAllKey(groupOptions), [groupOptions]);
  const isAllGroup = selectedGroupKey === ALL_GROUP_KEY;
  // 「其他」可能是前端合成桶，也可能是使用者自建、剛好同名的真實管道（見 resolveCatchAllKey），兩種情況都要拆 sub-section
  const isOtherGroup = !isAllGroup && (selectedGroupKey === OTHER_GROUP_KEY || selectedGroupKey === catchAllKey);

  const groupRows = useMemo(
    () => getGroupRows(availableCandidates, isAllGroup ? null : selectedGroupKey, groupOptions, reassignMap),
    [availableCandidates, isAllGroup, selectedGroupKey, groupOptions, reassignMap],
  );
  const allRows = useMemo(() => getAllRows(availableCandidates, reassignMap), [availableCandidates, reassignMap]);
  const sections = useMemo(() => {
    if (!selectedGroupKey) return [];
    if (isAllGroup) return [{ key: ALL_GROUP_KEY, label: '', rows: allRows }];
    if (isOtherGroup) {
      const blankLabel = side === 'receivable' ? '未設定管道' : '未設定廠商';
      return getOtherSubGroups(availableCandidates, groupOptions, sideData?.nameByUuid ?? new Map(), reassignMap, blankLabel);
    }
    return [{ key: selectedGroupKey, label: '', rows: groupRows }];
  }, [selectedGroupKey, isAllGroup, isOtherGroup, allRows, side, availableCandidates, groupOptions, sideData, reassignMap, groupRows]);

  const carryOverIn = useCarryOver(side, selectedGroupKey);
  const selectedGroupLabel = groups.find(g => g.key === selectedGroupKey)?.label ?? '';

  const pool = statementAmount + feeAmount + carryOverIn;
  const matched = useMemo(() => groupRows.filter(r => checkedIds.has(r.uuid)).reduce((sum, r) => sum + r.amount, 0), [groupRows, checkedIds]);
  const remaining = pool - matched;
  // 未勾選且金額超過目前剩餘可沖銷金額的交易，勾選後會使沖銷金額超過本次可沖銷總額，故停用
  const disabledIds = useMemo(
    () => new Set(groupRows.filter(r => !checkedIds.has(r.uuid) && r.amount > remaining).map(r => r.uuid)),
    [groupRows, checkedIds, remaining],
  );
  const canConfirm = checkedIds.size > 0;

  const resetInputs = () => {
    setStatementAmount(0);
    setFeeAmount(0);
    setCheckedIds(new Set());
    setConfirmSummaryOpen(false);
    setSurplusModalOpen(false);
    setSubmittedInfo(null);
    setDetailRow(null);
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

  const handleReassign = (uuid: string, groupUuid: string) => {
    setReassignedGroup(side, uuid, groupUuid);
    setCheckedIds(prev => {
      if (!prev.has(uuid)) return prev;
      const next = new Set(prev);
      next.delete(uuid);
      return next;
    });
  };

  // 對帳單金額／手續費變更後，若已勾選金額超過新的可沖銷總額，清空勾選避免沖銷超過本次可沖銷總額
  const handleStatementChange = (value: number) => {
    setStatementAmount(value);
    if (matched > value + feeAmount + carryOverIn) setCheckedIds(new Set());
    setSubmittedInfo(null);
  };
  const handleFeeChange = (value: number) => {
    setFeeAmount(value);
    if (matched > statementAmount + value + carryOverIn) setCheckedIds(new Set());
    setSubmittedInfo(null);
  };

  const submitRecord = (carryOverOut: number) => {
    if (!selectedGroupKey) return;
    const matchedRows = groupRows.filter(r => checkedIds.has(r.uuid));
    const unmatchedRows = groupRows.filter(r => !checkedIds.has(r.uuid));
    const record: ReconRecord = {
      id: `RR-${selectedGroupKey}-${Date.now()}`,
      side,
      groupLabel: selectedGroupLabel,
      statementAmount,
      feeAmount,
      carryOverIn,
      matched: matchedRows,
      matchedAmount: matched,
      surplus: remaining,
      carryOverOut,
      unmatched: unmatchedRows,
    };
    // 先清掉本次已帶入使用的上次結餘，若本次仍有多沖餘額才重新寫入，避免新舊結餘重複疊加
    consumeCarryOver(side, selectedGroupKey);
    if (carryOverOut > 0) addCarryOver(side, selectedGroupKey, carryOverOut);
    addReconRecord(record);
    setStatementAmount(0);
    setFeeAmount(0);
    setCheckedIds(new Set());
    setSurplusModalOpen(false);
    setSubmittedInfo({ matchedCount: matchedRows.length, matchedAmount: matched, carryOverOut });
  };

  const handleOpenConfirmSummary = () => {
    if (!canConfirm) return;
    setConfirmSummaryOpen(true);
  };

  // 摘要覆核確認送出後，才依是否有餘額決定直接送出或彈出多餘額提示
  const handleConfirmFromSummary = () => {
    setConfirmSummaryOpen(false);
    if (remaining > 0) {
      setSurplusModalOpen(true);
      return;
    }
    submitRecord(0);
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 py-7 nav:px-7">
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
                      已沖銷 {submittedInfo.matchedCount} 筆交易，共 {fmtCurrency(submittedInfo.matchedAmount)}
                      {submittedInfo.carryOverOut > 0 && `，餘額 ${fmtCurrency(submittedInfo.carryOverOut)} 已留待下次沖帳使用`}。
                    </div>
                  )}

                  {!isAllGroup && (
                    <ReconPoolPanel
                      statementAmount={statementAmount}
                      feeAmount={feeAmount}
                      onStatementChange={handleStatementChange}
                      onFeeChange={handleFeeChange}
                      carryOverIn={carryOverIn}
                      pool={pool}
                      matched={matched}
                      remaining={remaining}
                    />
                  )}

                  <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
                    <p className="mb-3 text-sm font-semibold text-neutral-dark">{isAllGroup ? '全部交易' : '待沖帳款'}</p>
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
                      channelOptions={groupOptions}
                      channelNameByUuid={sideData?.nameByUuid ?? new Map()}
                      onChannelChange={handleReassign}
                      onRowClick={setDetailRow}
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
          <div className="mx-auto flex max-w-[1200px] flex-col gap-3 nav:flex-row nav:items-center nav:justify-between">
            <div className="text-sm text-neutral-dark">
              已勾選 <span className="font-semibold">{checkedIds.size}</span> 筆 · 合計{' '}
              <span className="font-mono font-semibold tabular-nums">{fmtCurrency(matched)}</span> · 差額{' '}
              <span className={cn('font-mono font-semibold tabular-nums', remaining === 0 && matched > 0 ? 'text-semantic-success' : 'text-neutral-dark')}>
                {fmtCurrency(remaining)}
              </span>
            </div>
            <Button variant="primary" onClick={handleOpenConfirmSummary} disabled={!canConfirm}>
              確認沖帳
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
        onCancel={() => setConfirmSummaryOpen(false)}
        onConfirm={handleConfirmFromSummary}
      />

      <ReconSurplusModal
        open={surplusModalOpen}
        groupLabel={selectedGroupLabel}
        pool={pool}
        matched={matched}
        surplus={remaining}
        onBack={() => setSurplusModalOpen(false)}
        onCarryOver={() => submitRecord(remaining)}
      />

      <ReconTxnDetailModal open={!!detailRow} row={detailRow} side={side} onClose={() => setDetailRow(null)} />
    </div>
  );
}
