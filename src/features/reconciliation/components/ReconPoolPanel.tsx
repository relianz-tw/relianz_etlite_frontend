'use client';

import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import OtherDeductionsEditor, { type OtherDeductionRow } from '@/components/ui/OtherDeductionsEditor';
import DatePicker from '@/components/ui/DatePicker';
import StepNumber from '@/components/ui/StepNumber';
import { cn, fmtCurrency } from '@/lib/utils';
import { X } from 'lucide-react';
import type { ReconAllocationRow, ReconTarget } from '../targets';
import type { ReconMode, ReconSide, ReconTxnRef } from '../types';
import ReconTargetAllocation from './ReconTargetAllocation';

/** 額外金額單列：對應預覽 API 的 otherDeductions 項目，沿用共用元件的型別 */
export type ReconOtherDeductionRow = OtherDeductionRow;

interface ReconPoolPanelProps {
  mode: ReconMode;
  side: ReconSide;
  panelTitle: string;
  /** 標題列前顯示的操作順序編號（見 DESIGN.md「Step Number Badge」）；hideHeader 時不顯示 */
  stepNumber?: number;

  /** 逐筆沖帳模式下已勾選的交易筆數；0 筆顯示提示，1 筆顯示 singleSelectedRow 的明細，多筆顯示筆數與金額 */
  selectedCount: number;
  /** 恰好勾選 1 筆時的該筆交易；用於顯示日期／編號／待收金額 */
  singleSelectedRow?: ReconTxnRef | null;
  /** 已勾選交易的待收(付)金額加總，供多筆勾選時顯示「已選 N 筆 · $X」 */
  selectedAmount?: number;
  onClearSelection: () => void;

  /** 該群組名稱與當前餘額；「全部管道」或前端合成的「其他」無對應實體時 balance 為 undefined，「使用餘額」整塊不顯示 */
  balanceLabel: string;
  balance?: number;
  /**
   * 本次沖帳使用的餘額（元），為對帳單/沖帳金額下方的固定加項，會一併帶入預覽/執行 API 的 balanceUsed 參數，
   * 並計入沖帳金額用以沖抵帳款；不是實際入帳/出帳的錢，不影響實際存入/付出金額。有傳入 onBalanceUsedChange
   * 時此欄位可編輯，由使用者決定要用多少餘額；省略 onBalanceUsedChange 時維持唯讀顯示，供尚未串接的呼叫端相容。
   */
  balanceUsed: number;
  onBalanceUsedChange?: (value: number) => void;

  /** 金額欄位標題：匯總沖帳為「對帳單金額」，逐筆沖帳為「沖帳金額」 */
  amountLabel: string;
  statementAmount: number;
  feeAmount: number;
  onStatementChange: (value: number) => void;
  onFeeChange: (value: number) => void;
  /** 逐筆沖帳尚未勾選任何交易時停用金額欄位，避免送出跟勾選狀態不一致的金額 */
  amountDisabled?: boolean;
  /** 額外金額（otherDeductions）：可無限新增，與手續費同樣可正可負，從對帳單/沖帳金額中加總計入 */
  otherDeductions: ReconOtherDeductionRow[];
  onAddOtherDeduction: () => void;
  onRemoveOtherDeduction: (id: string) => void;
  onChangeOtherDeduction: (id: string, patch: Partial<Omit<ReconOtherDeductionRow, 'id'>>) => void;
  /** 付款／收款日：沖帳執行 API 必填欄位 */
  paymentDate: Date | undefined;
  onPaymentDateChange: (date: Date | undefined) => void;

  /** 是否顯示收款日／銀行帳戶／主要動作按鈕：匯總沖帳需選到明確管道/廠商；逐筆沖帳需先勾選至少一筆交易 */
  showActionArea: boolean;
  actionLabel: string;
  actionDisabled: boolean;
  actionError: string;
  /** 動作按鈕停用時的補充提示（如多筆勾選但尚未選定明確管道／廠商），非錯誤但需要提醒 */
  actionHint?: string;
  onAction: () => void;

  /** 沖帳對象分配：主對象（確認沖帳時實際入帳／出帳的目標）＋可選的分出列，見 ReconTargetAllocation */
  targetOptions: ReconTarget[];
  targetsLoading: boolean;
  targetsError: string;
  primaryTargetKey: string;
  onPrimaryTargetChange: (key: string) => void;
  allocationRows: ReconAllocationRow[];
  onAddAllocationRow: () => void;
  onRemoveAllocationRow: (id: string) => void;
  onChangeAllocationRow: (id: string, patch: Partial<Omit<ReconAllocationRow, 'id'>>) => void;

  /** 放進 BottomSheet 時，Sheet 本身已有標題，面板內不需要再顯示一次標題列，省略時預設顯示 */
  hideHeader?: boolean;
}

/**
 * 沖帳金額面板：置於右欄（約 340px 寬），與左側交易清單同時在首屏出現，操作順序由左至右——
 * 先在清單勾選交易，再到本面板確認/輸入金額，不需上下捲動切換（見 ReconciliationView 版面說明）。
 * 逐筆沖帳／匯總沖帳共用同一份 UI，差異僅在標頭是否顯示已選筆數與已選交易區塊（逐筆沖帳才顯示）。
 * 金額欄位一律為「總金額」；手續費與每筆額外金額皆可正可負（預設負值，即減項），兩者與沖帳金額加總即為實際
 * 存入/付出金額（對應 API 的 depositAmount／paymentAmount）。使用餘額（僅正值，下方小字顯示目前餘額）不計入
 * 這個加總——它不是實際入帳/出帳的錢，只計入沖帳金額本身（見 ReconciliationView 的 settleAmount）。
 * 欄位固定上下堆疊（label 在上、輸入框在下 w-full）：本卡片寬度固定在 340px 左右的窄欄，不隨桌機斷點跟著
 * 加寬，若沿用左右並排寫法會被擠壓變形。
 */
export default function ReconPoolPanel({
  mode,
  side,
  panelTitle,
  stepNumber,
  selectedCount,
  singleSelectedRow,
  selectedAmount = 0,
  onClearSelection,
  balanceLabel,
  balance,
  balanceUsed,
  onBalanceUsedChange,
  amountLabel,
  statementAmount,
  feeAmount,
  onStatementChange,
  onFeeChange,
  amountDisabled = false,
  otherDeductions,
  onAddOtherDeduction,
  onRemoveOtherDeduction,
  onChangeOtherDeduction,
  paymentDate,
  onPaymentDateChange,
  showActionArea,
  actionLabel,
  actionDisabled,
  actionError,
  actionHint,
  onAction,
  targetOptions,
  targetsLoading,
  targetsError,
  primaryTargetKey,
  onPrimaryTargetChange,
  allocationRows,
  onAddAllocationRow,
  onRemoveAllocationRow,
  onChangeAllocationRow,
  hideHeader = false,
}: ReconPoolPanelProps) {
  const otherDeductionsTotal = otherDeductions.reduce((sum, r) => sum + r.amount, 0);
  // 使用餘額不是實際入帳/出帳的錢，不計入實際存入/付出金額，只計入沖帳金額（見 ReconciliationView 的 settleAmount）
  const depositAmount = statementAmount + feeAmount + otherDeductionsTotal;
  const isDepositNegative = depositAmount < 0;
  const dateLabel = side === 'payable' ? '付款日' : '收款日';
  const balanceKindLabel = side === 'payable' ? '進項支出餘額' : '銷項收入餘額';

  return (
    <div className="rounded-lg border-[1.5px] border-brand-blue bg-white p-4">
      {!hideHeader && (
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[15px] font-semibold text-neutral-dark">
            {stepNumber !== undefined && <StepNumber value={stepNumber} />}
            {panelTitle}
          </span>
          {mode === 'perTxn' && selectedCount > 0 && (
            <span className="shrink-0 text-xs font-medium text-neutral-mid">
              {selectedCount} 筆 · {fmtCurrency(selectedAmount)}
            </span>
          )}
        </div>
      )}

      {mode === 'perTxn' && (
        <div className="mt-3 border-t border-neutral-blue-gray/20 pt-3">
          {/* 勾選前後固定使用同一個帶底色的框（不切換成純文字），避免勾選第一筆時框高度變化，
              把下方交易清單往下推，導致使用者接續快速勾選第二、三筆時點擊座標對不準（實測會漏勾）。 */}
          <div className="flex items-center justify-between gap-2 rounded-md bg-surface-cream p-3 text-sm">
            {selectedCount === 0 && <span className="text-neutral-mid">請從左側清單勾選要沖帳的交易</span>}
            {selectedCount === 1 && singleSelectedRow && (
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-dark">
                  {singleSelectedRow.date} · {singleSelectedRow.orderCode}
                </p>
                <p className="text-xs text-neutral-mid">
                  {side === 'payable' ? '待付' : '待收'} {fmtCurrency(singleSelectedRow.remainingAmount ?? singleSelectedRow.amount)}
                </p>
              </div>
            )}
            {selectedCount > 1 && (
              <span className="font-medium text-neutral-dark">
                已選 {selectedCount} 筆 · {fmtCurrency(selectedAmount)}
              </span>
            )}
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={onClearSelection}
                aria-label="清除已選交易"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-mid transition-colors hover:bg-surface-cream hover:text-semantic-error"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-1.5 border-t border-neutral-blue-gray/20 pt-3">
        <label className="text-sm text-neutral-dark">{amountLabel}</label>
        <MoneyInput value={statementAmount} onChange={onStatementChange} disabled={amountDisabled} />
        {amountDisabled ? (
          <p className="text-xs text-neutral-mid">請先於左側清單勾選交易</p>
        ) : (
          mode === 'perTxn' &&
          selectedCount > 0 && <p className="text-xs text-neutral-mid">已自動帶入所選{side === 'payable' ? '待付' : '待收'}總額，可修改</p>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {balance !== undefined && (
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-neutral-dark">使用餘額</span>
              {/* 餘額本身恆為正值，此欄位一律以正值輸入／顯示；是否為加項已由下方說明文字交代，不額外加正號視覺提示 */}
              <MoneyInput value={balanceUsed} onChange={onBalanceUsedChange} readOnly={!onBalanceUsedChange} />
            </div>
            <p className="text-right text-xs text-neutral-mid">
              目前 {balanceLabel} {balanceKindLabel} {fmtCurrency(balance)}
              {onBalanceUsedChange && balance > 0 && (
                <>
                  {' '}
                  ·{' '}
                  <button type="button" onClick={() => onBalanceUsedChange(balance)} className="font-semibold text-brand-blue hover:underline">
                    全額帶入
                  </button>
                </>
              )}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-neutral-dark">手續費</span>
          <MoneyInput value={feeAmount} onChange={onFeeChange} allowSign negativeByDefault disabled={amountDisabled} />
        </div>

        <OtherDeductionsEditor
          rows={otherDeductions}
          onAdd={onAddOtherDeduction}
          onRemove={onRemoveOtherDeduction}
          onChange={onChangeOtherDeduction}
          allowSign
          disabled={amountDisabled}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-neutral-blue-gray/20 pt-3 text-sm">
        <span className="font-semibold text-neutral-dark">{side === 'payable' ? '實際付出金額' : '實際存入金額'}</span>
        <span className={cn('font-mono text-base font-semibold tabular-nums', isDepositNegative ? 'text-semantic-error' : 'text-neutral-dark')}>
          {fmtCurrency(depositAmount)}
        </span>
      </div>
      {isDepositNegative && <p className="mt-1 text-right text-xs text-semantic-error">實際{side === 'payable' ? '付出' : '存入'}金額不可為負，請確認手續費與額外金額</p>}

      {showActionArea && (
        <div className="mt-4 flex flex-col gap-3 border-t border-neutral-blue-gray/20 pt-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-neutral-dark">{dateLabel}</span>
            <DatePicker value={paymentDate} onChange={onPaymentDateChange} />
          </div>

          <ReconTargetAllocation
            side={side}
            depositAmount={depositAmount}
            options={targetOptions}
            optionsLoading={targetsLoading}
            optionsError={targetsError}
            primaryTargetKey={primaryTargetKey}
            onPrimaryTargetChange={onPrimaryTargetChange}
            rows={allocationRows}
            onAddRow={onAddAllocationRow}
            onRemoveRow={onRemoveAllocationRow}
            onChangeRow={onChangeAllocationRow}
            disabled={isDepositNegative}
          />

          <div className="flex flex-col items-stretch">
            <Button variant="primary" onClick={onAction} disabled={actionDisabled} className="w-full justify-center">
              {actionLabel}
            </Button>
            {actionHint && !actionError && <p className="mt-2 text-xs text-neutral-mid">{actionHint}</p>}
            {actionError && <p className="mt-2 text-sm text-semantic-error">{actionError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
