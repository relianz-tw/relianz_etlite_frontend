'use client';

import type { BankAccountDto } from '@/api/types';
import AccountSelector from '@/features/bank-accounts/components/AccountSelector';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import OtherDeductionsEditor, { type OtherDeductionRow } from '@/components/ui/OtherDeductionsEditor';
import DatePicker from '@/components/ui/DatePicker';
import TabBar from '@/components/ui/TabBar';
import { cn, fmtCurrency } from '@/lib/utils';
import { Minus, X } from 'lucide-react';
import type { ReconMode, ReconSide, ReconTxnRef } from '../types';

/** 額外金額單列：對應預覽 API 的 otherDeductions 項目，沿用共用元件的型別 */
export type ReconOtherDeductionRow = OtherDeductionRow;

const MODE_OPTIONS: { value: ReconMode; label: string; disabled?: boolean; hint?: string }[] = [
  { value: 'single', label: '單筆沖帳' },
  { value: 'multi', label: '多筆沖帳' },
  { value: 'summary', label: '匯總沖帳' },
];

const MODE_DESCRIPTION: Record<ReconMode, string> = {
  single: '從下方清單勾選一筆交易，輸入金額後沖帳；沖帳後可於交易明細頁編輯金額。',
  multi: '勾選多筆交易後輸入金額，僅針對勾選的交易試算並沖帳。',
  summary: '輸入對帳單金額，交由系統依日期由舊到新自動拆帳。',
};

interface ReconPoolPanelProps {
  mode: ReconMode;
  onModeChange: (mode: ReconMode) => void;
  side: ReconSide;

  /** 單筆沖帳模式下目前勾選的交易；未勾選為 null */
  selectedRow: ReconTxnRef | null;
  /** 多筆沖帳模式下目前已勾選的交易筆數；未使用多筆沖帳的呼叫端可省略，預設 0 */
  selectedCount?: number;
  onClearSelection: () => void;

  /** 該群組名稱與當前餘額；「全部管道」或前端合成的「其他」無對應實體時 balance 為 undefined，「使用餘額」整塊不顯示 */
  balanceLabel: string;
  balance?: number;
  /**
   * 本次沖帳使用的餘額（元），為對帳單/沖帳金額下方的固定減項，會一併帶入預覽/執行 API 的 balanceUsed 參數，
   * 並從實際存入/付出金額中扣除。有傳入 onBalanceUsedChange 時此欄位可編輯，由使用者決定要用多少餘額；
   * 省略 onBalanceUsedChange 時維持唯讀顯示，供尚未串接的呼叫端相容。
   */
  balanceUsed: number;
  onBalanceUsedChange?: (value: number) => void;

  /** 金額欄位標題：匯總沖帳為「對帳單金額」，單筆沖帳為「沖帳金額」 */
  amountLabel: string;
  statementAmount: number;
  feeAmount: number;
  onStatementChange: (value: number) => void;
  onFeeChange: (value: number) => void;
  /** 額外金額（otherDeductions）：可無限新增，與手續費同樣可正可負，從對帳單/沖帳金額中加總計入 */
  otherDeductions: ReconOtherDeductionRow[];
  onAddOtherDeduction: () => void;
  onRemoveOtherDeduction: (id: string) => void;
  onChangeOtherDeduction: (id: string, patch: Partial<Omit<ReconOtherDeductionRow, 'id'>>) => void;
  /** 付款／收款日：沖帳執行 API 必填欄位 */
  paymentDate: Date | undefined;
  onPaymentDateChange: (date: Date | undefined) => void;

  /** 是否顯示收款日／銀行帳戶／主要動作按鈕：匯總沖帳需選到明確管道/廠商；單筆沖帳需先勾選一筆交易 */
  showActionArea: boolean;
  actionLabel: string;
  actionDisabled: boolean;
  actionError: string;
  onAction: () => void;

  /** 銀行帳戶：確認沖帳時實際執行入帳／出帳的目標帳戶（bankAccountUuid） */
  accounts: BankAccountDto[];
  accountsLoading: boolean;
  accountsError: string;
  bankAccountUuid: string;
  onBankAccountChange: (uuid: string) => void;
}

/**
 * 沖帳作業卡片：頂部以 TabBar 切換單筆／多筆／匯總三種操作模式，模式差異僅反映在上半部（已選交易、
 * 主要動作文案），下半部的金額輸入與計算邏輯三種模式共用同一份 UI。
 * 金額欄位一律為「總金額」；手續費與每筆額外金額皆可正可負（預設負值，即減項）、使用餘額為固定減項（僅正值，
 * 下方小字顯示目前餘額），加總後即為實際存入/付出金額（對應 API 的 depositAmount／paymentAmount）。
 */
export default function ReconPoolPanel({
  mode,
  onModeChange,
  side,
  selectedRow,
  selectedCount = 0,
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
  onAction,
  accounts,
  accountsLoading,
  accountsError,
  bankAccountUuid,
  onBankAccountChange,
}: ReconPoolPanelProps) {
  const otherDeductionsTotal = otherDeductions.reduce((sum, r) => sum + r.amount, 0);
  const depositAmount = statementAmount + feeAmount + otherDeductionsTotal - balanceUsed;
  const isDepositNegative = depositAmount < 0;
  const accountLabel = side === 'payable' ? '付款銀行帳戶' : '存入銀行帳戶';
  const dateLabel = side === 'payable' ? '付款日' : '收款日';

  return (
    <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
      <TabBar options={MODE_OPTIONS} value={mode} onChange={onModeChange} />
      <p className="mt-2 text-xs text-neutral-mid">{MODE_DESCRIPTION[mode]}</p>

      {mode === 'single' && (
        <div className="mt-3 border-t border-neutral-blue-gray/20 pt-3">
          {selectedRow ? (
            <div className="flex items-center justify-between gap-2 rounded-md bg-surface-cream p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-dark">
                  {selectedRow.date} · {side === 'payable' ? selectedRow.summary || '—' : selectedRow.counterparty || '—'}
                </p>
                <p className="text-xs text-neutral-mid">待沖 {fmtCurrency(selectedRow.remainingAmount ?? selectedRow.amount)}</p>
              </div>
              <button
                type="button"
                onClick={onClearSelection}
                aria-label="清除已選交易"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-mid transition-colors hover:bg-white hover:text-semantic-error"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-neutral-mid">請從下方清單勾選一筆交易</p>
          )}
        </div>
      )}

      {mode === 'multi' && (
        <div className="mt-3 border-t border-neutral-blue-gray/20 pt-3">
          {selectedCount > 0 ? (
            <div className="flex items-center justify-between gap-2 rounded-md bg-surface-cream p-3 text-sm">
              <span className="font-medium text-neutral-dark">已選取 {selectedCount} 筆交易</span>
              <button
                type="button"
                onClick={onClearSelection}
                aria-label="清除所有已選交易"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-mid transition-colors hover:bg-white hover:text-semantic-error"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-neutral-mid">請從下方清單勾選要沖帳的交易（可複選）</p>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-blue-gray/20 pt-3">
        <label className="text-sm font-semibold text-neutral-dark">{amountLabel}</label>
        <MoneyInput widthClassName="w-40" value={statementAmount} onChange={onStatementChange} />
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-neutral-dark">手續費</span>
          <MoneyInput widthClassName="w-40" value={feeAmount} onChange={onFeeChange} allowSign negativeByDefault />
        </div>

        {balance !== undefined && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-neutral-dark">使用餘額</span>
              <div className="flex items-center gap-1.5">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-cream text-neutral-mid"
                  aria-hidden="true"
                >
                  <Minus size={14} />
                </div>
                <MoneyInput widthClassName="w-40" value={balanceUsed} onChange={onBalanceUsedChange} readOnly={!onBalanceUsedChange} />
              </div>
            </div>
            <p className="text-right text-xs text-neutral-mid">
              目前 {balanceLabel} 餘額 {fmtCurrency(balance)}
            </p>
          </div>
        )}

        <OtherDeductionsEditor rows={otherDeductions} onAdd={onAddOtherDeduction} onRemove={onRemoveOtherDeduction} onChange={onChangeOtherDeduction} allowSign />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-neutral-blue-gray/20 pt-3 text-sm">
        <span className="font-semibold text-neutral-dark">{side === 'payable' ? '實際付出金額' : '實際存入金額'}</span>
        <span className={cn('font-mono text-base font-semibold tabular-nums', isDepositNegative ? 'text-semantic-error' : 'text-neutral-dark')}>
          {fmtCurrency(depositAmount)}
        </span>
      </div>
      {isDepositNegative && <p className="mt-1 text-right text-xs text-semantic-error">實際{side === 'payable' ? '付出' : '存入'}金額不可為負，請確認手續費、使用餘額與額外金額</p>}

      {showActionArea && (
        <div className="mt-4 flex flex-col gap-3 border-t border-neutral-blue-gray/20 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-neutral-dark">{dateLabel}</span>
            <div className="w-40">
              <DatePicker value={paymentDate} onChange={onPaymentDateChange} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-neutral-dark">{accountLabel}</span>
            {accountsLoading ? (
              <p className="text-xs text-neutral-mid">載入中…</p>
            ) : accountsError ? (
              <p className="text-xs text-semantic-error">{accountsError}</p>
            ) : accounts.length === 0 ? (
              <p className="text-xs text-semantic-error">尚無啟用中的銀行帳戶，請先於設定新增銀行帳戶</p>
            ) : (
              <div className="w-80">
                <AccountSelector accounts={accounts} value={bankAccountUuid} onChange={onBankAccountChange} />
              </div>
            )}
          </div>

          <div className="flex flex-col items-end">
            <Button variant="primary" onClick={onAction} disabled={actionDisabled}>
              {actionLabel}
            </Button>
            {actionError && <p className="mt-2 text-sm text-semantic-error">{actionError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
