/**
 * 匯總沖帳預覽／執行 API 的 side-dispatch 封裝：銷項（paymentChannelUuid／depositAmount）與
 * 進項（counterpartyUuid／paymentAmount）欄位不同，這裡統一轉換為共用的 ReconSettleResult 形狀，
 * 讓 ReconciliationView 與下游元件不需要再依 side 分別處理型別（見 ./types.ts 的 ReconSettleResult）。
 */
import { previewSettlePayable, previewSettleReceivable, settlePayableSummary, settleReceivableSummary } from '@/api/ledger';
import type { SettleSummaryFee, SettleSummaryOtherDeduction } from '@/api/types';
import type { ReconOtherDeductionRow } from './components/ReconPoolPanel';
import type { ReconSettleResult, ReconSide } from './types';

function toOtherDeductions(rows: ReconOtherDeductionRow[]): SettleSummaryOtherDeduction[] | undefined {
  if (rows.length === 0) return undefined;
  return rows.map(r => ({ name: r.name, amount: r.amount, officialAccountingSubjectId: r.subject!.id! }));
}

interface PreviewParams {
  side: ReconSide;
  /** 銷項為 paymentChannelUuid；進項為 counterpartyUuid */
  groupUuid: string;
  settleAmount: number;
  /** 銷項為 depositAmount（實際存入）；進項為 paymentAmount（實際付出） */
  actualAmount: number;
  isBalance: boolean;
  feeAmount: number;
  otherDeductions: ReconOtherDeductionRow[];
}

/** 匯總沖帳預覽拆帳：依 side 呼叫對應 API，回應正規化為 ReconSettleResult */
export async function previewSettle(params: PreviewParams): Promise<ReconSettleResult> {
  const allocations: SettleSummaryFee = { name: '匯總手續費', feeAmount: params.feeAmount };
  const otherDeductions = toOtherDeductions(params.otherDeductions);

  if (params.side === 'receivable') {
    const res = await previewSettleReceivable({
      paymentChannelUuid: params.groupUuid,
      settleAmount: params.settleAmount,
      depositAmount: params.actualAmount,
      isBalance: params.isBalance,
      allocations,
      otherDeductions,
    });
    return {
      settleAmount: res.settleAmount,
      appliedSettleAmount: res.appliedSettleAmount,
      actualAmount: res.actualDepositAmount,
      balanceBefore: res.balanceBefore,
      balanceAfter: res.balanceAfter,
      isBalance: res.isBalance,
      affectedCount: res.affectedCount,
      totalBeforeRemaining: res.totalBeforeRemaining,
      allocations: res.ledgerAllocations,
    };
  }

  const res = await previewSettlePayable({
    counterpartyUuid: params.groupUuid,
    settleAmount: params.settleAmount,
    paymentAmount: params.actualAmount,
    isBalance: params.isBalance,
    allocations,
    otherDeductions,
  });
  return {
    settleAmount: res.settleAmount,
    appliedSettleAmount: res.appliedSettleAmount,
    actualAmount: res.actualPaymentAmount,
    balanceBefore: res.balanceBefore,
    balanceAfter: res.balanceAfter,
    isBalance: res.isBalance,
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
  bankAccountUuid: string;
  isBalance: boolean;
  feeAmount: number;
  otherDeductions: ReconOtherDeductionRow[];
}

/** 匯總沖帳真正執行：依 side 呼叫對應 API，回應正規化為 ReconSettleResult */
export async function submitSettle(params: SummaryParams): Promise<ReconSettleResult> {
  const allocations: SettleSummaryFee = { name: '匯總手續費', feeAmount: params.feeAmount };
  const otherDeductions = toOtherDeductions(params.otherDeductions);

  if (params.side === 'receivable') {
    const res = await settleReceivableSummary({
      ledgerUuids: params.ledgerUuids,
      settleAmount: params.settleAmount,
      depositAmount: params.actualAmount,
      paymentDate: params.paymentDate,
      bankAccountUuid: params.bankAccountUuid,
      isBalance: params.isBalance,
      allocations,
      otherDeductions,
    });
    return {
      settleAmount: res.settleAmount,
      appliedSettleAmount: res.appliedSettleAmount,
      actualAmount: res.actualDepositAmount,
      balanceBefore: res.balanceBefore,
      balanceAfter: res.balanceAfter,
      isBalance: res.isBalance,
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
    bankAccountUuid: params.bankAccountUuid,
    isBalance: params.isBalance,
    allocations,
    otherDeductions,
  });
  return {
    settleAmount: res.settleAmount,
    appliedSettleAmount: res.appliedSettleAmount,
    actualAmount: res.actualPaymentAmount,
    balanceBefore: res.balanceBefore,
    balanceAfter: res.balanceAfter,
    isBalance: res.isBalance,
    affectedCount: res.affectedCount,
    totalBeforeRemaining: res.totalBeforeRemaining,
    allocations: res.ledgerAllocations,
    settlementOrderCode: res.settlementOrderCode,
    paymentDate: res.paymentDate,
  };
}
