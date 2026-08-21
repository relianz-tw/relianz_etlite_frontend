'use client';

import { listChannelRules } from '@/api/channelRules';
import { fetchReconciliationPayables, fetchReconciliationReceivables } from '@/api/ledger';
import type { SettleLedgerAllocation } from '@/api/types';
import { listVendors } from '@/api/vendors';
import BottomSheet from '@/components/ui/BottomSheet';
import ResizableSplitPane from '@/components/ui/ResizableSplitPane';
import SegmentedControl from '@/components/ui/SegmentedControl';
import StepNumber from '@/components/ui/StepNumber';
import TabBar from '@/components/ui/TabBar';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency } from '@/lib/utils';
import { subMonths } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import ReconConfirmSummaryModal from './components/ReconConfirmSummaryModal';
import ReconDateFilter from './components/ReconDateFilter';
import ReconGroupSidebar from './components/ReconGroupSidebar';
import ReconMobileActionBar from './components/ReconMobileActionBar';
import ReconPoolPanel, { type ReconOtherDeductionRow } from './components/ReconPoolPanel';
import ReconPoolSummary from './components/ReconPoolSummary';
import ReconSettleResultModal from './components/ReconSettleResultModal';
import ReconTxnList, { getSelectableUuids } from './components/ReconTxnList';
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
import { validateAllocationRows } from './targets';
import type { ReconAllocationInfo, ReconMode, ReconSettleResult, ReconSide, ReconTxnRef } from './types';
import { useReconTargets } from './useReconTargets';

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
 * 版面由上而下、由左而右對齊操作順序：頂部為橫向管道／廠商 chips（見 ReconGroupSidebar），下方左欄為交易
 * 清單、右欄為固定寬度（340px）的金額面板（見 ReconPoolPanel），三者同時在首屏出現，操作動線是
 * 「先在上方選管道 → 到左欄勾交易 → 到右欄填金額」，與閱讀方向一致；兩種模式步驟數不同（逐筆 3 步／
 * 匯總 2 步，匯總沖帳的交易清單是系統結果不算一個操作步驟），故各區塊標題另加 StepNumber 徽章明示順序
 * （見 @/components/ui/StepNumber、DESIGN.md「Step Number Badge」）。
 * 銷售管道與廠商清單取自真實 API（/ael/payment/channelRules、
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
 *   管道／廠商。
 * - summary（匯總沖帳）：沿用既有流程，沖帳對象與拆帳結果一律由後端 settle/preview API 決定
 *   （依 transaction_date 由舊到新分配），前端不由使用者手動勾選調整；下方交易清單改為純檢視，
 *   將預覽結果疊加顯示為圓形狀態（見 ReconTxnList）。僅有明確 uuid 的真實管道／廠商可使用。
 *
 * 兩種模式共用同一套「確認沖帳→結果」一段式流程（見 handleOpenConfirm）：按下主要按鈕「確認沖帳」，
 * 逐筆勾 1 筆改為本地試算（拆帳結果本來就是確定的），其餘打 settle/preview 取得逐筆拆帳明細，
 * 隨即顯示於 ReconConfirmSummaryModal（含每筆交易的沖前/沖後剩餘與狀態），使用者僅能取消或直接確認送出，
 * 沒有中途選項——超沖／少沖差額一律直接留在該筆原單（逐筆勾 1 筆）或沖入最後一筆交易（其餘情況）。
 * 執行成功後，清空已快取的候選清單並重新向後端拉取（含最新餘額），讓已沖帳交易與餘額變動自然反映。
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
  // 行動版（< nav 1000px）金額表單以 BottomSheet 疊在交易清單上；桌機版不使用，面板改常駐右欄（見下方雙掛載）
  const [sheetOpen, setSheetOpen] = useState(false);
  // 本次沖帳涉及原單的買受人／賣方與憑證號碼快照（見 ReconAllocationInfo 說明），確認彈窗與結果彈窗共用同一份，
  // 在 handleOpenConfirm 取得拆帳明細當下建立，避免沖帳完成後候選清單重抓、已結清交易消失導致欄位變成空白
  const [allocationInfoByUuid, setAllocationInfoByUuid] = useState<Map<string, ReconAllocationInfo>>(new Map());
  // 目前展開中的交易 uuid（就地展開看大約資訊，一次僅展開一列）
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);

  // 沖帳對象分配：主對象（確認沖帳時實際入帳／出帳的目標）＋可選的分出列，見 useReconTargets 說明
  const reconTargets = useReconTargets(side);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // 沖帳執行結果（正規化後統一形狀）：成功後開結果 modal 顯示摘要與各原單明細，逐筆／匯總沖帳共用
  const [settleResult, setSettleResult] = useState<ReconSettleResult | null>(null);
  const [settleResultOpen, setSettleResultOpen] = useState(false);

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

  // 依 ledgerUuid 從目前候選清單反查買受人／賣方與憑證號碼，供 handleOpenConfirm 建立確認彈窗的顯示快照
  // （見 allocationInfoByUuid 說明；沖帳 API 回應本身沒有這兩個欄位）
  const buildAllocationInfo = (ledgerUuids: string[]): Map<string, ReconAllocationInfo> => {
    const map = new Map<string, ReconAllocationInfo>();
    ledgerUuids.forEach(uuid => {
      const candidate = availableCandidates.find(c => c.uuid === uuid);
      if (candidate) map.set(uuid, { counterparty: candidate.counterparty, voucherNumber: candidate.voucherNumber });
    });
    return map;
  };

  const groupOptions = sideData?.groupOptions ?? [];

  // 「全部管道」為唯讀總覽項，永遠列在最前面，不參與 buildReconGroups 的管道比對邏輯
  const groups = useMemo(() => {
    const allGroup: ReconGroup = {
      key: ALL_GROUP_KEY,
      label: getAllGroupLabel(side),
      count: availableCandidates.length,
      amount: availableCandidates.reduce((sum, c) => sum + c.amount, 0),
    };
    return [allGroup, ...buildReconGroups(availableCandidates, groupOptions)];
  }, [availableCandidates, groupOptions, side]);

  const catchAllKey = useMemo(() => resolveCatchAllKey(groupOptions), [groupOptions]);
  const isAllGroup = selectedGroupKey === ALL_GROUP_KEY;
  // 「其他」可能是前端合成桶，也可能是使用者自建、剛好同名的真實管道（見 resolveCatchAllKey），兩種情況都要拆 sub-section
  const isOtherGroup = !isAllGroup && (selectedGroupKey === OTHER_GROUP_KEY || selectedGroupKey === catchAllKey);
  // 「全部管道」拿不到明確管道／廠商 uuid，多筆沖帳的 preview/summary API 送不出去，
  // 故逐筆沖帳在此群組下強制單選（事前擋掉而非按下去才失敗）；「其他」維持現況可勾多筆，按下去才提示
  const forceSingleSelect = mode === 'perTxn' && isAllGroup;

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
  // 逐筆沖帳清單卡標題列的「全選本管道」連結（見下方 return）：依目前 sections（該群組全部交易）計算可勾選 uuid
  const selectableUuids = useMemo(() => getSelectableUuids(sections), [sections]);
  const allSelectableSelected = selectableUuids.length > 0 && selectableUuids.every(uuid => selectedUuids.has(uuid));
  // 逐筆沖帳勾恰好 1 筆：走手動沖帳 API，本地試算拆帳結果，超沖／少沖差額一律直接留在該筆原單
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
  // 即使 settleAmount 剛好等於 totalBeforeRemaining 仍可能造成超沖/少沖（實測驗證過）；僅用於確認彈窗內提示，不影響是否可送出
  const hasDiff = !!previewResult && previewResult.allocations.some(a => a.settlementStatus !== 0);
  // 差額顯示須以「本次實際分配到的原單」沖前剩餘加總為準，不能用 previewResult.totalBeforeRemaining（該管道／廠商
  // 全部未沖交易的合計，含本次完全沒被觸及的其他原單）——否則差額會混入不相干的交易金額，讓使用者誤解沖帳結果
  const touchedRemaining = previewResult ? previewResult.allocations.reduce((sum, a) => sum + a.beforeRemaining, 0) : 0;
  const diffAmount = previewResult ? Math.abs(previewResult.appliedSettleAmount - touchedRemaining) : 0;

  // 逐筆沖帳每次變更勾選交易時，自動把已選交易金額加總帶入「沖帳金額」欄位，省去使用者手動核對加總；
  // 使用者仍可事後手動修改此欄位（如部分沖帳），僅在勾選狀態變動時才會重新覆蓋；取消勾選至 0 筆時歸零
  // （金額欄位本身也會同步停用，見 poolPanelBaseProps 的 amountDisabled），避免殘留跟目前勾選不一致的金額
  useEffect(() => {
    if (mode === 'perTxn') setStatementAmount(selectedUuids.size > 0 ? selectedAmount : 0);
  }, [mode, selectedUuids, selectedAmount]);

  const resetInputs = () => {
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setBalanceUsed(0);
    setPreviewResult(null);
    setPreviewError('');
    setSubmitError('');
    setConfirmSummaryOpen(false);
    setAllocationInfoByUuid(new Map());
    setExpandedUuid(null);
    setSettleResultOpen(false);
    setSelectedUuids(new Set());
    setSheetOpen(false);
    // 分出列比照 otherDeductions，屬本次沖帳輸入的一部分，切換群組／區間時一併清空；主對象維持不動
    // （側切換時另有 useReconTargets 內的 effect 重新套用預設帳戶）
    reconTargets.resetAllocationRows();
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
  // 切換單筆勾選狀態：一般情況複選；「全部管道」下逐筆沖帳強制單選，勾新的一筆會取代前一筆（見 forceSingleSelect）
  const handleToggleSelect = (uuid: string) => {
    setSelectedUuids(prev => {
      if (forceSingleSelect) return prev.has(uuid) ? new Set() : new Set([uuid]);
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

  // 金額輸入共用驗證：對帳單金額（或沖帳金額）需大於 0、實際存入/付出不可為負、額外金額須填完整、使用餘額不可超過目前餘額、
  // 需選收/付款日、分出對象需填完整且加總不可超過實際存入/付出金額
  const validateAmountInputs = (): string => {
    if (statementAmount <= 0) return `請先輸入${mode === 'perTxn' ? '沖帳' : '對帳單'}金額`;
    if (depositAmount < 0) return `實際${side === 'payable' ? '付出' : '存入'}金額不可為負，請確認手續費與額外金額`;
    if (otherDeductions.some(r => !r.subject?.id || !r.name.trim() || r.amount === 0)) return '請完整填寫額外金額的科目、名稱與金額';
    if (selectedGroup?.balance !== undefined && balanceUsed > selectedGroup.balance) return '使用餘額不可超過目前餘額';
    if (!paymentDate) return side === 'payable' ? '請先選擇付款日' : '請先選擇收款日';
    const allocationError = validateAllocationRows(depositAmount, reconTargets.allocationRows, side);
    if (allocationError) return allocationError;
    return '';
  };

  /**
   * 主要動作「確認沖帳」：取得本次沖帳的逐筆拆帳明細後直接開啟確認彈窗（見 ReconConfirmSummaryModal），
   * 彈窗內僅「取消」與「確認沖帳」兩個動作，沒有中途選項。匯總沖帳與逐筆沖帳勾多筆打後端 settle/preview
   * 取得明細；逐筆沖帳勾恰好 1 筆改為本地試算（該情境不需要也無法呼叫 preview API——preview API 必填
   * paymentChannelUuid／counterpartyUuid，但單筆沖帳允許在「全部管道」「其他」操作，拿不到明確 uuid；
   * 且單筆的拆帳結果本來就是確定的：沖前剩餘＝該列 remainingAmount，沖後剩餘＝相減，不需多打一支 API）。
   */
  const handleOpenConfirm = async () => {
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
        affectedCount: 1,
        totalBeforeRemaining: remaining,
        allocations: [allocation],
      });
      setAllocationInfoByUuid(buildAllocationInfo([row.uuid]));
      setSubmitError('');
      setConfirmSummaryOpen(true);
      setSheetOpen(false);
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
        feeAmount,
        otherDeductions,
      });
      setPreviewResult(result);
      setAllocationInfoByUuid(buildAllocationInfo(result.allocations.map(a => a.ledgerUuid)));
      setSubmitError('');
      setConfirmSummaryOpen(true);
      setSheetOpen(false);
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
    setSelectedUuids(new Set());
    setSettleResult(result);
    setSettleResultOpen(true);
  };

  // 沖帳 API 目前只有單一必填的 bankAccountUuid，尚未支援多對象分配（見 targets.ts 與計畫說明）；
  // 主對象若選銀行帳戶則解析出其 uuid，選會計科目則無值可送
  const primaryTarget = reconTargets.options.find(o => o.key === reconTargets.primaryTargetKey);
  const primaryBankAccountUuid = primaryTarget?.kind === 'bankAccount' ? (primaryTarget.bankAccountUuid ?? '') : '';

  const requireSubmitReady = (): boolean => {
    if (!selectedGroupKey) return false;
    // 逐筆沖帳勾 1 筆走手動沖帳 API，不需要明確管道／廠商 uuid（見 isSingleSelection 說明）
    if (!isSingleSelection && !canSettle) return false;
    if (!reconTargets.primaryTargetKey) {
      setSubmitError('請先選擇主對象');
      return false;
    }
    if (!primaryBankAccountUuid) {
      setSubmitError('沖帳對象目前僅支援銀行帳戶，請將主對象改選為銀行帳戶');
      return false;
    }
    if (reconTargets.allocationRows.length > 0) {
      setSubmitError('分配給多個對象的功能尚未開放（後端尚未支援多對象沖帳），請先移除分出的對象');
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
        bankAccountUuid: primaryBankAccountUuid,
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

  // 確認彈窗送出：勾多筆／匯總沖帳走 summary API，超沖／少沖差額一律直接沖入最後一筆交易，沿用使用者原始輸入的存入/付出金額
  const handleConfirmSummarySettle = async () => {
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
        bankAccountUuid: primaryBankAccountUuid,
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
  const handleConfirmSettle = () => (isSingleSelection ? handleConfirmSingleSettle() : handleConfirmSummarySettle());

  // 沖帳 API 目前只有單一必填的 bankAccountUuid，尚未支援多對象；有分出列，或主對象選了會計科目而非銀行帳戶時
  // 直接擋下「確認沖帳」並提示原因，而非讓使用者填完整份表單、看過預覽彈窗後才在送出當下失敗。
  // 後端支援多對象後，這段與 requireSubmitReady 對應的兩個檢查應一併移除。
  const allocationBlockedReason = reconTargets.allocationRows.length > 0
    ? '分配給多個對象的功能尚未開放（後端尚未支援多對象沖帳），請先移除分出的對象'
    : reconTargets.primaryTargetKey && !primaryBankAccountUuid
      ? '沖帳對象目前僅支援銀行帳戶，請將主對象改選為銀行帳戶'
      : '';

  const actionLabel = previewLoading ? '計算中…' : '確認沖帳';
  const actionDisabled =
    (mode === 'perTxn'
      ? previewLoading || statementAmount <= 0 || selectedUuids.size === 0 || (selectedUuids.size > 1 && !canSettle)
      : previewLoading || statementAmount <= 0) || allocationBlockedReason !== '';
  // 逐筆沖帳勾多筆但尚未選定明確管道／廠商時，提示原因而非讓使用者按下去才失敗；分配區塊的暫時性限制優先顯示
  const actionHint =
    allocationBlockedReason ||
    (mode === 'perTxn' && selectedUuids.size > 1 && !canSettle
      ? `多筆沖帳需先於上方選擇單一${side === 'receivable' ? '銷售管道' : '廠商'}才能送出`
      : undefined);
  // 逐筆沖帳一律以「已勾選至少 1 筆」決定是否顯示動作區，不隨管道是否明確增減掛載／卸載——
  // 否則勾選第一筆交易時這塊區域才出現，會把下方交易清單往下推，使接續快速勾選的第二、三筆點擊座標對不準（實測會漏勾）
  const showActionArea = mode === 'perTxn' ? selectedUuids.size > 0 : canSettle;

  // 金額面板 props 單一來源：逐筆沖帳桌機（固定於右欄）與行動版（BottomSheet 內）共用同一份表單，
  // 僅顯示位置不同，避免同一套欄位／驗證邏輯在兩處各維護一份（見 DESIGN.md「Bottom Sheet」與 ReconPoolPanel 的 hideHeader）。
  // 匯總沖帳桌機固定於右欄、行動版改在清單上方常駐顯示完整表單（見下方 nav:hidden 區塊，不使用 BottomSheet），
  // 兩處同樣共用這份 props，改任一邊都會同步
  const poolPanelBaseProps: Omit<ComponentProps<typeof ReconPoolPanel>, 'hideHeader'> = {
    mode,
    side,
    panelTitle: mode === 'perTxn' ? '沖帳金額' : '輸入入帳金額',
    // 操作順序編號：逐筆沖帳為第 3 步（1 選管道 → 2 選交易 → 3 輸入金額），匯總沖帳為第 2 步（交易清單為系統結果，不編號）
    stepNumber: mode === 'perTxn' ? 3 : 2,
    selectedCount: selectedUuids.size,
    singleSelectedRow,
    selectedAmount,
    onClearSelection: handleClearSelection,
    balanceLabel: selectedGroupLabel,
    balance: selectedGroup?.balance,
    balanceUsed,
    onBalanceUsedChange: handleBalanceUsedChange,
    amountLabel: mode === 'perTxn' ? '沖帳金額' : '對帳單金額',
    statementAmount,
    feeAmount,
    onStatementChange: handleStatementChange,
    onFeeChange: handleFeeChange,
    // 逐筆沖帳尚未勾選任何交易時停用金額欄位，避免送出跟勾選狀態不一致的金額
    amountDisabled: mode === 'perTxn' && selectedUuids.size === 0,
    otherDeductions,
    onAddOtherDeduction: handleAddOtherDeduction,
    onRemoveOtherDeduction: handleRemoveOtherDeduction,
    onChangeOtherDeduction: handleChangeOtherDeduction,
    paymentDate,
    onPaymentDateChange: date => {
      setPaymentDate(date);
      clearComputedState();
    },
    showActionArea,
    actionLabel,
    actionDisabled,
    actionError: previewError,
    actionHint,
    onAction: handleOpenConfirm,
    targetOptions: reconTargets.options,
    targetsLoading: reconTargets.loading,
    targetsError: reconTargets.error,
    primaryTargetKey: reconTargets.primaryTargetKey,
    onPrimaryTargetChange: reconTargets.setPrimaryTargetKey,
    allocationRows: reconTargets.allocationRows,
    onAddAllocationRow: reconTargets.addAllocationRow,
    onRemoveAllocationRow: reconTargets.removeAllocationRow,
    onChangeAllocationRow: reconTargets.changeAllocationRow,
  };

  // 行動版底部固定操作條摘要：逐筆沖帳顯示已選筆數／金額，匯總沖帳顯示手續費／實際存入(付出)金額；
  // 兩種模式按下按鈕都只是開啟 BottomSheet，真正送出仍是面板內既有的「確認沖帳」按鈕（見 handleOpenConfirm）
  const mobileSummaryLabel = mode === 'perTxn' ? `已選 ${selectedUuids.size} 筆` : `手續費 ${fmtCurrency(feeAmount)} · 實際${side === 'payable' ? '付出' : '存入'}`;
  const mobileSummaryValue = mode === 'perTxn' ? fmtCurrency(selectedAmount) : fmtCurrency(depositAmount);
  const mobileActionLabel = mode === 'perTxn' ? '確認金額' : `確認沖帳 · ${selectableUuids.length} 筆`;

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1440px] px-4 pt-4 pb-28 nav:px-7 nav:pt-7 nav:pb-7">
        <div className="mb-5 flex flex-col gap-3 nav:flex-row nav:items-end nav:justify-between">
          <div>
            <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">沖帳中心</h1>
            <p className="mt-1 text-sm text-neutral-mid">選擇交易後確認金額，完成應收應付沖帳</p>
          </div>
          <div className="w-full nav:w-56">
            <SegmentedControl options={SIDE_OPTIONS} value={side} onChange={handleSideChange} size="md" />
          </div>
        </div>

        {/* 日期篩選常駐置於逐筆／匯總沖帳分頁列右側（手機／桌機皆同一列），故容器一律 flex-row；
            極窄螢幕（< 340px）兩者加總可能超出可視寬度，容許 flex-wrap 換行而非硬擠成一排 */}
        <div className="mb-5 flex flex-row flex-wrap items-center justify-between gap-2 border-b border-neutral-blue-gray/30">
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
          <div className="flex flex-col gap-4">
            <ReconGroupSidebar side={side} groups={groups} selectedKey={selectedGroupKey} onSelect={handleSelectGroup} />

            <ResizableSplitPane
              panelSide="right"
              defaultPanelWidth={340}
              minPanelWidth={300}
              maxPanelWidth={420}
              panel={
                selectedGroupKey && (
                  <div className="hidden nav:sticky nav:top-7 nav:block">
                    <ReconPoolPanel {...poolPanelBaseProps} />
                  </div>
                )
              }
            >
              {!selectedGroupKey ? (
                <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">
                  請從上方選擇{side === 'receivable' ? '銷售管道' : '廠商'}
                </div>
              ) : (
                <div className="flex flex-col gap-4 pb-4">
                  {mode === 'perTxn' && isAllGroup && (
                    <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                      一次只能沖銷一筆；要一次沖銷多筆，請先於上方選擇單一{side === 'receivable' ? '銷售管道' : '廠商'}
                    </div>
                  )}
                  {mode === 'summary' && isAllGroup && (
                    <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                      請先於上方選擇單一{side === 'receivable' ? '銷售管道' : '廠商'}
                    </div>
                  )}
                  {mode === 'perTxn' && !isAllGroup && selectedUuids.size > 1 && !canSettle && (
                    <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                      此分類無對應{side === 'receivable' ? '銷售管道' : '廠商'}，暫不支援一次沖銷多筆，可改為只勾選一筆，或於上方切換至實際{side === 'receivable' ? '管道' : '廠商'}
                    </div>
                  )}
                  {mode === 'summary' && !isAllGroup && !canSettle && (
                    <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                      此分類無對應{side === 'receivable' ? '銷售管道' : '廠商'}，暫不支援匯總沖帳，可改用逐筆沖帳，或於上方切換至實際{side === 'receivable' ? '管道' : '廠商'}
                    </div>
                  )}

                  {/* 行動版：匯總沖帳把完整金額表單（含使用餘額／手續費／額外金額／收款日／銀行帳戶／確認沖帳）
                      移到清單上方常駐顯示，不再切成僅一顆入帳金額欄位＋另開 BottomSheet 兩處——兩處分別維護
                      同一份表單容易讓使用者以為只有一欄可填。與桌機右欄共用同一份 poolPanelBaseProps，
                      改任一邊都會同步；桌機僅顯示於右欄，此區塊 nav:hidden */}
                  {mode === 'summary' && (
                    <div className="nav:hidden">
                      <ReconPoolPanel {...poolPanelBaseProps} />
                    </div>
                  )}

                  <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-semibold text-neutral-dark">
                        {/* 選擇交易為逐筆沖帳操作順序第 2 步（1 選管道 → 2 選交易 → 3 輸入金額）；匯總沖帳的清單是系統結果，不編號 */}
                        {mode === 'perTxn' && <StepNumber value={2} />}
                        {isAllGroup ? '全部交易' : mode === 'perTxn' ? '選擇交易' : '系統勾選結果'}
                        <span className="font-normal text-neutral-mid">
                          {side === 'payable' ? '待付' : '待收'}帳款 · {selectedGroupLabel} · {selectableUuids.length} 筆
                        </span>
                      </p>
                      {mode === 'perTxn' && showStatusColumn && !forceSingleSelect && (
                        <button
                          type="button"
                          onClick={() => handleSelectAllToggle(selectableUuids)}
                          disabled={selectableUuids.length === 0}
                          className="shrink-0 text-xs font-semibold text-brand-blue hover:underline disabled:cursor-not-allowed disabled:text-neutral-blue-gray disabled:no-underline"
                        >
                          {allSelectableSelected ? '取消全選' : '全選本管道'}
                        </button>
                      )}
                    </div>
                    {/* 「對帳單金額」文案僅符合匯總沖帳（金額面板欄位標題是「沖帳金額」，見 amountLabel），故僅匯總沖帳顯示 */}
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
                    />
                  </div>
                </div>
              )}
            </ResizableSplitPane>
          </div>
        )}
      </div>

      {/* 行動版：底部固定操作條常駐顯示摘要，點擊開啟 BottomSheet 內的金額表單（見上方 poolPanelBaseProps）；
          僅逐筆沖帳使用——匯總沖帳的完整表單已常駐於清單上方（見上方 nav:hidden 區塊），不需要底部操作條
          與 BottomSheet 這組雙層入口。桌機不出現，金額面板已固定於右欄（nav:sticky） */}
      {mode === 'perTxn' && selectedGroupKey && showActionArea && (
        <ReconMobileActionBar
          summaryLabel={mobileSummaryLabel}
          summaryValue={mobileSummaryValue}
          actionLabel={mobileActionLabel}
          actionDisabled={actionDisabled}
          onAction={() => setSheetOpen(true)}
        />
      )}
      {mode === 'perTxn' && (
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={poolPanelBaseProps.panelTitle}>
          {selectedGroupKey && <ReconPoolPanel {...poolPanelBaseProps} hideHeader />}
        </BottomSheet>
      )}

      {previewResult && (
        <ReconConfirmSummaryModal
          open={confirmSummaryOpen}
          groupLabel={selectedGroupLabel}
          side={side}
          result={previewResult}
          hasDiff={hasDiff}
          diffAmount={diffAmount}
          isSingleSelection={isSingleSelection}
          allocationInfoByUuid={allocationInfoByUuid}
          submitting={submitLoading}
          submitError={submitError}
          onCancel={() => {
            setConfirmSummaryOpen(false);
            setPreviewResult(null);
          }}
          onConfirm={handleConfirmSettle}
        />
      )}

      <ReconSettleResultModal
        open={settleResultOpen}
        side={side}
        groupLabel={selectedGroupLabel}
        result={settleResult}
        allocationInfoByUuid={allocationInfoByUuid}
        onClose={() => setSettleResultOpen(false)}
      />
    </div>
  );
}
