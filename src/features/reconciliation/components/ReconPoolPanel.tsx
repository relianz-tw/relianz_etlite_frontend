'use client';

import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import OtherDeductionsEditor, { type OtherDeductionRow } from '@/components/ui/OtherDeductionsEditor';
import DatePicker from '@/components/ui/DatePicker';
import SegmentedControl from '@/components/ui/SegmentedControl';
import StepNumber from '@/components/ui/StepNumber';
import { cn, fmtCurrency } from '@/lib/utils';
import { ArrowLeftRight } from 'lucide-react';
import { computeActualAmount } from '../settle';
import type { ReconAllocationRow, ReconTarget } from '../targets';
import type { ReconMode, ReconSide, ReconTxnRef } from '../types';
import ReconTargetAllocation from './ReconTargetAllocation';

/** 額外金額單列：對應預覽 API 的 otherDeductions 項目，沿用共用元件的型別 */
export type ReconOtherDeductionRow = OtherDeductionRow;

/** 「此單是否含折讓、退貨」切換選項：對應匯總沖帳預覽 API 的 includeAllowance */
const ALLOWANCE_OPTIONS = [
  { value: 'no', label: '不含' },
  { value: 'yes', label: '含' },
] as const;

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

  /** 金額欄位標題：匯總沖帳為「對帳單金額」，逐筆沖帳為「沖帳金額」 */
  amountLabel: string;
  statementAmount: number;
  /** 沖帳金額目前是否仍為系統依勾選交易自動帶入的值（尚未被使用者手動修改）；true 時輸入框顯示綠框＋閃電 */
  amountAutoFilled?: boolean;
  /** 此單是否含折讓、退貨（僅匯總沖帳顯示）：對應匯總沖帳預覽 API 的 includeAllowance */
  includeAllowance: boolean;
  onIncludeAllowanceChange: (value: boolean) => void;
  feeAmount: number;
  onStatementChange: (value: number) => void;
  onFeeChange: (value: number) => void;
  /** 逐筆沖帳尚未勾選任何交易時停用金額欄位，避免送出跟勾選狀態不一致的金額 */
  amountDisabled?: boolean;
  /** 額外金額（otherDeductions）：可無限新增，與銀行手續費同樣為減項，從對帳單/沖帳金額中加總計入 */
  otherDeductions: ReconOtherDeductionRow[];
  onAddOtherDeduction: () => void;
  onRemoveOtherDeduction: (id: string) => void;
  onChangeOtherDeduction: (id: string, patch: Partial<Omit<ReconOtherDeductionRow, 'id'>>) => void;

  /** 電商平台扣款：僅應收（side='receivable'）顯示；金額非 0 時強制須選滿等值的應付憑證才能送出（見 ReconciliationView 驗證） */
  platformFeeAmount: number;
  platformFeeVoucherCount: number;
  platformFeeVoucherTotal: number;
  onPlatformFeeAmountChange: (value: number) => void;
  onOpenVoucherPicker: () => void;
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
  /** 排列方式：'narrow'（預設，約 340px 窄欄，欄位上下堆疊，逐筆沖帳右欄／行動版 Bottom Sheet 使用）／
   *  'wide'（全寬多欄網格，匯總沖帳步驟 2 全寬卡使用，見 DESIGN.md「Recon Pool Panel — Wide Layout」） */
  layout?: 'narrow' | 'wide';
}

/**
 * 沖帳金額面板：逐筆沖帳固定於右欄（約 340px 窄欄，layout="narrow"），與左側交易清單同時在首屏出現，
 * 操作順序由左至右——先在清單勾選交易，再到本面板確認/輸入金額；匯總沖帳改置於全寬步驟卡內
 * （layout="wide"，見 ReconciliationView 版面說明與 DESIGN.md「Recon Pool Panel — Wide Layout」）。
 * 逐筆沖帳／匯總沖帳共用同一份 UI 與驗證邏輯，差異僅在標頭是否顯示已選筆數（逐筆沖帳才顯示）與排列方式。
 * 金額欄位一律為「總金額」；銀行手續費與每筆額外金額預設為減項但可用 MoneyInput 的正負切換鈕改列為加項，
 * 電商平台扣款（僅應收）則固定鎖在負值（lockedSign，切換鈕整組淡化不可點）。三者與沖帳金額加總即為
 * 實際存入/付出金額（對應 API 的 depositAmount／paymentAmount，見 settle.ts computeActualAmount）。
 * narrow：欄位固定上下堆疊（label 在上、輸入框在下 w-full），寬度固定窄欄不隨桌機斷點加寬，
 * 若沿用左右並排寫法會被擠壓變形；wide：改為多欄網格排列，欄位本身（label／輸入框／handler）完全共用，
 * 僅外層容器改變排列方式，避免兩種排列各自維護一份表單日後走鐘。
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
  amountLabel,
  statementAmount,
  amountAutoFilled = false,
  includeAllowance,
  onIncludeAllowanceChange,
  feeAmount,
  onStatementChange,
  onFeeChange,
  amountDisabled = false,
  otherDeductions,
  onAddOtherDeduction,
  onRemoveOtherDeduction,
  onChangeOtherDeduction,
  platformFeeAmount,
  platformFeeVoucherCount,
  platformFeeVoucherTotal,
  onPlatformFeeAmountChange,
  onOpenVoucherPicker,
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
  layout = 'narrow',
}: ReconPoolPanelProps) {
  const wide = layout === 'wide';
  const otherDeductionsTotal = otherDeductions.reduce((sum, r) => sum + r.amount, 0);
  const depositAmount = computeActualAmount(statementAmount, feeAmount + platformFeeAmount + otherDeductionsTotal);
  // 反向沖帳：實際存入/付出金額為負，代表方向反了（如逐筆沖帳勾到退款/折讓性質的負值交易）——
  // 不視為錯誤擋下，整個面板翻面呈現（方向文字互換、金額一律顯示絕對值），見 DESIGN.md「Reversed Settlement Panel」
  const isReversed = depositAmount < 0;
  const effectiveSide: ReconSide = isReversed ? (side === 'payable' ? 'receivable' : 'payable') : side;
  const displayAmount = Math.abs(depositAmount);
  const dateLabel = effectiveSide === 'payable' ? '付款日' : '收款日';
  // 目前勾選交易本身加總即為負數（如全選退款/折讓性質交易）：這是預期中的正常狀態，不比照一般反向沖帳
  // 整塊套用色調造成過度警示，僅在下方金額列以紅字＋提示文案說明方向判斷（見 CLAUDE 需求）
  const isSelectedAmountNegative = mode === 'perTxn' && selectedCount > 0 && (selectedAmount ?? 0) < 0;
  const showReversedTint = isReversed && !isSelectedAmountNegative;
  const showNegativeSelectionHint = isReversed && isSelectedAmountNegative;

  // 以下欄位區塊（label／輸入框／handler）narrow／wide 兩種排列完全共用，僅外層容器排法不同（見上方檔案說明）
  const includeAllowanceBlock = mode === 'summary' && (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-neutral-dark">此對帳單是否含折讓、退貨</span>
      <SegmentedControl options={[...ALLOWANCE_OPTIONS]} value={includeAllowance ? 'yes' : 'no'} onChange={v => onIncludeAllowanceChange(v === 'yes')} />
    </div>
  );

  // 勾選加總本身為負：在沖帳金額欄位「之前」先說明方向判斷，避免使用者先看到一個負數自動帶入的
  // 沖帳金額卻不明所以，見 DESIGN.md「逐筆勾選加總本身為負」
  const negativeSelectionHintBlock = showNegativeSelectionHint && (
    <div className="flex items-start gap-2 rounded-md border border-brand-tan/40 bg-brand-tan/10 p-3">
      <ArrowLeftRight size={16} className="mt-0.5 shrink-0 text-semantic-warm-dark" />
      <div className="text-xs leading-relaxed text-semantic-warm-dark">
        <p className="text-sm font-semibold">本次沖帳已轉為「{effectiveSide === 'payable' ? '應付' : '應收'}」</p>
        <p className="mt-0.5">
          因勾選的項目均屬退款／折讓性質，加總金額為負，代表此筆本次並非
          {effectiveSide === 'payable' ? '收款' : '付款'}，而是需
          {effectiveSide === 'payable' ? '支付' : '向對方收取'} {fmtCurrency(displayAmount)}。
          下方{dateLabel}與{effectiveSide === 'payable' ? '付款' : '收款'}方式已依「
          {effectiveSide === 'payable' ? '應付' : '應收'}」切換，請確認後再送出。
        </p>
      </div>
    </div>
  );

  const amountBlock = (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-neutral-dark">{amountLabel}</label>
      <MoneyInput value={statementAmount} onChange={onStatementChange} disabled={amountDisabled} aiFilled={mode === 'perTxn' && amountAutoFilled} />
      {amountDisabled ? (
        <p className="text-xs text-neutral-mid">請先於左側清單勾選交易</p>
      ) : (
        mode === 'perTxn' &&
        selectedCount > 0 && <p className="text-xs text-neutral-mid">系統已自動帶入所有已勾選的沖帳交易總額，如有含退款會自動扣除</p>
      )}
    </div>
  );

  const dateBlock = (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-neutral-dark">{dateLabel}</span>
      <DatePicker value={paymentDate} onChange={onPaymentDateChange} />
    </div>
  );

  const feeBlock = (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-neutral-dark">銀行手續費</span>
      <MoneyInput value={feeAmount} onChange={onFeeChange} allowSign negativeByDefault disabled={amountDisabled} />
    </div>
  );

  const platformFeeBlock = side === 'receivable' && (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-neutral-dark">電商平台扣款</span>
      {/* 切換鈕仍鎖死不可點，僅顯示方向：平常鎖負（扣款）；「本次沖帳已轉為應付」時鎖正——
          此時金額本身仍是加重應付負擔的效果，交由 computeActualAmount 依沖帳金額方向計算，
          鎖正後輸入的數字改存正值，送出 API 前依原本慣例統一反號（見 settle.ts toEcommercePlatformFee） */}
      <MoneyInput
        value={platformFeeAmount}
        onChange={onPlatformFeeAmountChange}
        allowSign
        lockedSign={showNegativeSelectionHint ? 1 : -1}
        disabled={amountDisabled}
      />
      {platformFeeAmount !== 0 &&
        (platformFeeVoucherTotal === Math.abs(platformFeeAmount) ? (
          <p className="flex items-center justify-between text-xs text-semantic-success">
            <span>
              已選 {platformFeeVoucherCount} 筆憑證 · {fmtCurrency(platformFeeVoucherTotal)}
            </span>
            <button type="button" onClick={onOpenVoucherPicker} className="font-semibold text-brand-blue hover:underline">
              重新選擇
            </button>
          </p>
        ) : (
          <p className="flex items-center justify-between text-xs text-semantic-error">
            <span>
              {platformFeeVoucherCount > 0 ? '憑證金額不等值，' : '尚未選擇憑證，'}
              差額 {fmtCurrency(Math.abs(Math.abs(platformFeeAmount) - platformFeeVoucherTotal))}
            </span>
            <button type="button" onClick={onOpenVoucherPicker} className="font-semibold text-brand-blue hover:underline">
              選擇憑證
            </button>
          </p>
        ))}
    </div>
  );

  const otherDeductionsBlock = (
    <OtherDeductionsEditor
      rows={otherDeductions}
      onAdd={onAddOtherDeduction}
      onRemove={onRemoveOtherDeduction}
      onChange={onChangeOtherDeduction}
      disabled={amountDisabled}
      allowSign
    />
  );

  const targetAllocationBlock = (
    <ReconTargetAllocation
      side={effectiveSide}
      depositAmount={displayAmount}
      options={targetOptions}
      optionsLoading={targetsLoading}
      optionsError={targetsError}
      primaryTargetKey={primaryTargetKey}
      onPrimaryTargetChange={onPrimaryTargetChange}
      rows={allocationRows}
      onAddRow={onAddAllocationRow}
      onRemoveRow={onRemoveAllocationRow}
      onChangeRow={onChangeAllocationRow}
    />
  );

  const depositAmountLabel = (
    <span className="font-semibold text-neutral-dark">{effectiveSide === 'payable' ? '實際付出金額' : '實際存入金額'}</span>
  );
  const depositAmountValue = <span className="font-mono text-base font-semibold tabular-nums text-neutral-dark">{fmtCurrency(displayAmount)}</span>;

  const actionButtonBlock = (
    <div className={cn('flex flex-col', wide ? 'items-end' : 'items-stretch')}>
      <Button variant="primary" onClick={onAction} disabled={actionDisabled} className={wide ? 'w-auto' : 'w-full justify-center'}>
        {actionLabel}
      </Button>
      {actionHint && !actionError && <p className="mt-2 text-xs text-neutral-mid">{actionHint}</p>}
      {actionError && <p className="mt-2 text-sm text-semantic-error">{actionError}</p>}
    </div>
  );

  // 寬版欄位網格：列 1 三欄（含折讓／對帳單金額／收款日），showActionArea 為 false（尚未選定明確管道／廠商）
  // 時列 1 自然縮成兩欄（見 DESIGN.md「Recon Pool Panel — Wide Layout」）；列 2 應收兩欄、應付僅一欄
  const row1ColsClass = showActionArea ? 'min-[1300px]:grid-cols-3' : 'min-[1300px]:grid-cols-2';
  const row2ColsClass = side === 'receivable' ? 'min-[1300px]:grid-cols-2' : '';

  return (
    <div className={cn('rounded-lg border-[1.5px] p-4', showReversedTint ? 'border-brand-tan bg-brand-tan/5' : 'border-brand-blue bg-white')}>
      {!hideHeader && (
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[15px] font-semibold text-neutral-dark">
            {stepNumber !== undefined && <StepNumber value={stepNumber} />}
            {panelTitle}
          </span>
          {mode === 'perTxn' && selectedCount > 0 && (
            <span className="shrink-0 text-xs font-medium text-neutral-mid">
              {selectedCount} 筆 · {fmtCurrency(Math.abs(selectedAmount))}
            </span>
          )}
        </div>
      )}

      {mode === 'perTxn' && selectedCount === 0 && (
        <div className="mt-3 border-t border-neutral-blue-gray/20 pt-3">
          <div className="flex items-center justify-between gap-2 rounded-md bg-surface-cream p-3 text-sm">
            <span className="text-neutral-mid">請從左側清單勾選要沖帳的交易</span>
          </div>
        </div>
      )}

      {wide ? (
        <>
          <div className="mt-4 flex flex-col gap-3 border-t border-neutral-blue-gray/20 pt-3">
            {negativeSelectionHintBlock}
            <div className={cn('grid gap-4', row1ColsClass)}>
              {includeAllowanceBlock}
              {amountBlock}
              {showActionArea && dateBlock}
            </div>
          </div>

          <div className={cn('mt-3 grid gap-4', row2ColsClass)}>
            {feeBlock}
            {platformFeeBlock}
          </div>

          <div className="mt-3">{otherDeductionsBlock}</div>

          {showActionArea && <div className="mt-3">{targetAllocationBlock}</div>}

          <div className="mt-4 flex flex-col gap-3 border-t border-neutral-blue-gray/20 pt-3 min-[1300px]:flex-row min-[1300px]:items-end min-[1300px]:justify-between">
            <div className="flex items-center gap-2 text-sm">
              {depositAmountLabel}
              {depositAmountValue}
            </div>
            {showActionArea && actionButtonBlock}
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-3 border-t border-neutral-blue-gray/20 pt-3">
            {includeAllowanceBlock}
            {negativeSelectionHintBlock}
            {amountBlock}
          </div>

          <div className="mt-3 flex flex-col gap-3">
            {feeBlock}
            {platformFeeBlock}
            {otherDeductionsBlock}
          </div>

          <div className="mt-4 border-t border-neutral-blue-gray/20 pt-3 text-sm">
            <div className="flex items-center justify-between">
              {depositAmountLabel}
              {depositAmountValue}
            </div>
          </div>

          {showActionArea && (
            <div className="mt-4 flex flex-col gap-3 border-t border-neutral-blue-gray/20 pt-3">
              {dateBlock}
              {targetAllocationBlock}
              {actionButtonBlock}
            </div>
          )}
        </>
      )}
    </div>
  );
}
