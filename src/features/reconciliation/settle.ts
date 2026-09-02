/**
 * 匯總沖帳預覽／執行 API 的 side-dispatch 封裝：銷項（paymentChannelUuid／depositAmount）與
 * 進項（counterpartyUuid／paymentAmount）欄位不同，這裡統一轉換為共用的 ReconSettleResult 形狀，
 * 讓 ReconciliationView 與下游元件不需要再依 side 分別處理型別（見 ./types.ts 的 ReconSettleResult）。
 *
 * 符號約定：UI 側手續費與額外金額以「帶號」輸入（扣減項預設為負），API 欄位語意為「正的扣減金額」，
 * 因此本模組於送出 API 前統一對 feeAmount 與 otherDeductions[].amount 做反號。UI 狀態不動。
 */
import { previewSettlePayable, previewSettleReceivable, settlePayable, settlePayableSummary, settleReceivable, settleReceivableSummary } from '@/api/ledger';
import type { SettleChannel, SettleEcommercePlatformFee, SettleLedgerAllocation, SettleSummaryFee, SettleSummaryOtherDeduction } from '@/api/types';
import type { ReconOtherDeductionRow } from './components/ReconPoolPanel';
import type { ReconSettleResult, ReconSide } from './types';

/** 應收側 ecommercePlatformFee 物件：UI 帶號（負）輸入，API 欄位語意為正的金額，故反號；僅應收 API 支援此欄位 */
function toEcommercePlatformFee(platformFeeAmount: number): SettleEcommercePlatformFee {
  return { feeAmount: -platformFeeAmount };
}

function toOtherDeductions(rows: ReconOtherDeductionRow[]): SettleSummaryOtherDeduction[] | undefined {
  if (rows.length === 0) return undefined;
  // UI 帶號（負）→ API 正值（扣減金額語意），此處反號
  return rows.map(r => ({
    name: r.name,
    amount: -r.amount,
    officialAccountingSubjectId: r.subject!.id!,
    companyAccountingSubjectUuid: r.subject!.companyAccountingSubjectUuid,
  }));
}

interface PreviewParams {
  side: ReconSide;
  /** 銷項為 paymentChannelUuid；進項為 counterpartyUuid */
  groupUuid: string;
  /** 要預覽的原單 uuid 列表（多筆沖帳使用者勾選的交易）；省略時等同 []，須搭配 isDefault=true（匯總沖帳） */
  ledgerUuids?: string[];
  /** 使用預設預覽嗎：省略時預設 true（匯總沖帳，由後端自動拆帳）；多筆沖帳須明確傳 false */
  isDefault?: boolean;
  settleAmount: number;
  /** 銷項為 depositAmount（實際存入）；進項為 paymentAmount（實際付出） */
  actualAmount: number;
  feeAmount: number;
  otherDeductions: ReconOtherDeductionRow[];
  /** 電商平台扣款金額（UI 帶號輸入，恆為負或 0），僅應收 API 會用到；應付一律忽略 */
  platformFeeAmount: number;
}

/**
 * 沖帳預覽拆帳：依 side 呼叫對應 API，回應正規化為 ReconSettleResult。
 * 匯總沖帳（summary）不傳 ledgerUuids／isDefault，預設 isDefault=true、ledgerUuids=[]，
 * 由後端依 transaction_date 由舊到新自動拆帳；多筆沖帳（multi）須明確傳入使用者勾選的
 * ledgerUuids 與 isDefault=false，僅針對勾選的原單試算（見 api.md settle/preview）。
 */
export async function previewSettle(params: PreviewParams): Promise<ReconSettleResult> {
  const allocations: SettleSummaryFee = { feeAmount: -params.feeAmount };
  const otherDeductions = toOtherDeductions(params.otherDeductions);
  const isDefault = params.isDefault ?? true;
  const ledgerUuids = params.ledgerUuids ?? [];

  if (params.side === 'receivable') {
    const res = await previewSettleReceivable({
      paymentChannelUuid: params.groupUuid,
      isDefault,
      ledgerUuids,
      settleAmount: params.settleAmount,
      depositAmount: params.actualAmount,
      balanceUsed: 0,
      allocations,
      otherDeductions,
      ecommercePlatformFee: toEcommercePlatformFee(params.platformFeeAmount),
    });
    return {
      settleAmount: res.settleAmount,
      appliedSettleAmount: res.appliedSettleAmount,
      actualAmount: res.actualDepositAmount,
      balanceBefore: res.balanceBefore,
      balanceAfter: res.balanceAfter,
      affectedCount: res.affectedCount,
      totalBeforeRemaining: res.totalBeforeRemaining,
      allocations: res.ledgerAllocations,
    };
  }

  const res = await previewSettlePayable({
    counterpartyUuid: params.groupUuid,
    isDefault,
    ledgerUuids,
    settleAmount: params.settleAmount,
    paymentAmount: params.actualAmount,
    balanceUsed: 0,
    allocations,
    otherDeductions,
  });
  return {
    settleAmount: res.settleAmount,
    appliedSettleAmount: res.appliedSettleAmount,
    actualAmount: res.actualPaymentAmount,
    balanceBefore: res.balanceBefore,
    balanceAfter: res.balanceAfter,
    affectedCount: res.affectedCount,
    totalBeforeRemaining: res.totalBeforeRemaining,
    allocations: res.ledgerAllocations,
  };
}

interface SummaryParams {
  side: ReconSide;
  ledgerUuids: string[];
  settleAmount: number;
  actualAmount: number;
  /** YYYYMMDD */
  paymentDate: string;
  /** 收付款管道（見 targets.ts 的 buildSettleChannels） */
  channels: SettleChannel[];
  feeAmount: number;
  otherDeductions: ReconOtherDeductionRow[];
  /** 電商平台扣款金額（UI 帶號輸入，恆為負或 0），僅應收 API 會用到；應付一律忽略 */
  platformFeeAmount: number;
}

/**
 * 匯總／多筆沖帳真正執行：依 side 呼叫對應 API，回應正規化為 ReconSettleResult。
 * depositAmount／paymentAmount 帶實際存入/付出金額，即 statementAmount + 手續費 + 額外金額
 * （見 ReconciliationView 的 depositAmount 計算）。
 */
export async function submitSettle(params: SummaryParams): Promise<ReconSettleResult> {
  const allocations: SettleSummaryFee = { feeAmount: -params.feeAmount };
  const otherDeductions = toOtherDeductions(params.otherDeductions);

  if (params.side === 'receivable') {
    const res = await settleReceivableSummary({
      ledgerUuids: params.ledgerUuids,
      settleAmount: params.settleAmount,
      depositAmount: params.actualAmount,
      paymentDate: params.paymentDate,
      depositChannels: params.channels,
      balanceUsed: 0,
      allocations,
      otherDeductions,
      ecommercePlatformFee: toEcommercePlatformFee(params.platformFeeAmount),
    });
    return {
      settleAmount: res.settleAmount,
      appliedSettleAmount: res.appliedSettleAmount,
      actualAmount: res.actualDepositAmount,
      balanceBefore: res.balanceBefore,
      balanceAfter: res.balanceAfter,
      affectedCount: res.affectedCount,
      totalBeforeRemaining: res.totalBeforeRemaining,
      allocations: res.ledgerAllocations,
      settlementOrderCode: res.settlementOrderCode,
      paymentDate: res.paymentDate,
    };
  }

  const res = await settlePayableSummary({
    ledgerUuids: params.ledgerUuids,
    settleAmount: params.settleAmount,
    paymentAmount: params.actualAmount,
    paymentDate: params.paymentDate,
    paymentChannels: params.channels,
    balanceUsed: 0,
    allocations,
    otherDeductions,
  });
  return {
    settleAmount: res.settleAmount,
    appliedSettleAmount: res.appliedSettleAmount,
    actualAmount: res.actualPaymentAmount,
    balanceBefore: res.balanceBefore,
    balanceAfter: res.balanceAfter,
    affectedCount: res.affectedCount,
    totalBeforeRemaining: res.totalBeforeRemaining,
    allocations: res.ledgerAllocations,
    settlementOrderCode: res.settlementOrderCode,
    paymentDate: res.paymentDate,
  };
}

interface SingleSettleParams {
  side: ReconSide;
  ledgerUuid: string;
  settleAmount: number;
  /** 銷項為 depositAmount（實際存入）；進項為 paymentAmount（實際付出） */
  actualAmount: number;
  /** YYYYMMDD */
  paymentDate: string;
  /** 收付款管道（見 targets.ts 的 buildSettleChannels） */
  channels: SettleChannel[];
  feeAmount: number;
  otherDeductions: ReconOtherDeductionRow[];
  /** 電商平台扣款金額（UI 帶號輸入，恆為負或 0），僅應收 API 會用到；應付一律忽略 */
  platformFeeAmount: number;
}

/**
 * 逐筆沖帳勾 1 筆：走手動沖帳 API（settleReceivable／settlePayable，reconMethod=0），
 * 允許超沖少沖，事後可在交易明細頁編輯金額（見 SettlementEditDialog）。
 * payload 組法比照該對話框：allocations 為陣列，手續費為 0 時不放此項；otherDeductions 空陣列時送 undefined。
 * 回應正規化為 ReconSettleResult（單一 allocation），讓確認彈窗／結果彈窗能與多筆／匯總沖帳共用同一套元件——
 * 手動沖帳 API 沒有 balanceBefore／balanceAfter 的概念（不影響管道／廠商餘額），對應欄位留空。
 */
export async function submitSingleSettle(params: SingleSettleParams): Promise<ReconSettleResult> {
  const allocations: SettleSummaryFee[] = params.feeAmount !== 0 ? [{ feeAmount: -params.feeAmount }] : [];
  const otherDeductions = toOtherDeductions(params.otherDeductions);

  const res =
    params.side === 'receivable'
      ? await settleReceivable({
          ledgerUuid: params.ledgerUuid,
          paymentDate: params.paymentDate,
          depositChannels: params.channels,
          settleAmount: params.settleAmount,
          depositAmount: params.actualAmount,
          balanceUsed: 0,
          memo: '',
          allocations,
          otherDeductions,
          ecommercePlatformFee: toEcommercePlatformFee(params.platformFeeAmount),
        })
      : await settlePayable({
          ledgerUuid: params.ledgerUuid,
          paymentDate: params.paymentDate,
          paymentChannels: params.channels,
          settleAmount: params.settleAmount,
          paymentAmount: params.actualAmount,
          balanceUsed: 0,
          memo: '',
          allocations,
          otherDeductions,
        });

  const allocation: SettleLedgerAllocation = {
    ledgerUuid: params.ledgerUuid,
    orderCode: res.orderCode,
    beforeRemaining: res.beforeRemaining,
    settleAmount: res.settledAmount,
    afterRemaining: res.afterRemaining,
    settlementStatus: res.settlementStatus,
    closed: res.closed,
    settlementLedgerUuid: res.settlementLedgerUuid,
    relationUuid: res.relationUuid,
  };
  return {
    settleAmount: params.settleAmount,
    appliedSettleAmount: res.settledAmount,
    actualAmount: params.actualAmount,
    affectedCount: 1,
    totalBeforeRemaining: res.beforeRemaining,
    allocations: [allocation],
    paymentDate: res.paymentDate,
  };
}
