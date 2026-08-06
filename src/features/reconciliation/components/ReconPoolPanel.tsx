'use client';

import type { BankAccountDto } from '@/api/types';
import AccountSelector from '@/features/bank-accounts/components/AccountSelector';
import SubjectSelect, { type SubjectOption } from '@/components/ui/SubjectSelect';
import MoneyInput from '@/components/ui/MoneyInput';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import { cn, fmtCurrency } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

/** 額外金額單列：對應預覽 API 的 otherDeductions 項目，subject 未選時視為尚未填完整 */
export interface ReconOtherDeductionRow {
  id: string;
  subject: SubjectOption | null;
  name: string;
  amount: number;
}

interface ReconPoolPanelProps {
  statementAmount: number;
  feeAmount: number;
  onStatementChange: (value: number) => void;
  onFeeChange: (value: number) => void;
  /** 額外金額（otherDeductions）：可無限新增，與手續費同為從對帳單金額中扣除的減項 */
  otherDeductions: ReconOtherDeductionRow[];
  onAddOtherDeduction: () => void;
  onRemoveOtherDeduction: (id: string) => void;
  onChangeOtherDeduction: (id: string, patch: Partial<Omit<ReconOtherDeductionRow, 'id'>>) => void;
  /** 是否顯示「預覽拆帳」動作與存入銀行帳戶選擇；目前僅銷項且選到有明確 paymentChannelUuid 的真實管道時開放 */
  showPreview: boolean;
  previewLoading: boolean;
  previewError: string;
  onPreview: () => void;
  /** 存入銀行帳戶：確認沖帳時實際執行入帳的目標帳戶（bankAccountUuid） */
  accounts: BankAccountDto[];
  accountsLoading: boolean;
  accountsError: string;
  bankAccountUuid: string;
  onBankAccountChange: (uuid: string) => void;
}

/**
 * 對帳單金額為本次「總金額」；手續費與額外金額皆為從中扣除的減項，扣完後即為實際存入金額
 * （對應預覽 API 的 depositAmount）。銷項可在此直接呼叫「預覽拆帳」，結果會回填至下方逐筆勾選清單，
 * 故合併在同一卡片內，動作與其依據的金額輸入相鄰。
 */
export default function ReconPoolPanel({
  statementAmount,
  feeAmount,
  onStatementChange,
  onFeeChange,
  otherDeductions,
  onAddOtherDeduction,
  onRemoveOtherDeduction,
  onChangeOtherDeduction,
  showPreview,
  previewLoading,
  previewError,
  onPreview,
  accounts,
  accountsLoading,
  accountsError,
  bankAccountUuid,
  onBankAccountChange,
}: ReconPoolPanelProps) {
  const otherDeductionsTotal = otherDeductions.reduce((sum, r) => sum + r.amount, 0);
  const depositAmount = statementAmount - feeAmount - otherDeductionsTotal;
  const isDepositNegative = depositAmount < 0;

  return (
    <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-neutral-dark">對帳單金額</label>
        <MoneyInput widthClassName="w-36" value={statementAmount} onChange={onStatementChange} />
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-neutral-dark">手續費</span>
          <div className="flex items-center gap-2">
            <span className="text-lg text-neutral-mid">−</span>
            <MoneyInput widthClassName="w-36" value={feeAmount} onChange={onFeeChange} />
          </div>
        </div>

        {otherDeductions.map(row => (
          <div key={row.id} className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="min-w-0 flex-1 nav:w-56 nav:flex-none">
                <SubjectSelect value={row.subject} onChange={s => onChangeOtherDeduction(row.id, { subject: s })} placeholder="請選擇科目" />
              </div>
              <TextInput
                widthClassName="w-28"
                value={row.name}
                onChange={e => onChangeOtherDeduction(row.id, { name: e.target.value })}
                placeholder="項目名稱"
              />
              <button
                type="button"
                onClick={() => onRemoveOtherDeduction(row.id)}
                aria-label="移除此項"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-neutral-mid transition-colors hover:bg-surface-cream hover:text-semantic-error"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-lg text-neutral-mid">−</span>
              <MoneyInput widthClassName="w-32" value={row.amount} onChange={value => onChangeOtherDeduction(row.id, { amount: value })} />
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" icon={Plus} onClick={onAddOtherDeduction} className="self-end">
          新增額外金額
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-neutral-blue-gray/20 pt-3 text-sm">
        <span className="font-semibold text-neutral-dark">實際存入金額</span>
        <span className={cn('font-mono text-base font-semibold tabular-nums', isDepositNegative ? 'text-semantic-error' : 'text-neutral-dark')}>
          {fmtCurrency(depositAmount)}
        </span>
      </div>
      {isDepositNegative && <p className="mt-1 text-right text-xs text-semantic-error">手續費與額外金額總和不可超過對帳單金額</p>}

      {showPreview && (
        <div className="mt-4 border-t border-neutral-blue-gray/20 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-neutral-dark">存入銀行帳戶</span>
            {accountsLoading ? (
              <p className="text-xs text-neutral-mid">載入中…</p>
            ) : accountsError ? (
              <p className="text-xs text-semantic-error">{accountsError}</p>
            ) : accounts.length === 0 ? (
              <p className="text-xs text-semantic-error">尚無啟用中的銀行帳戶，請先於設定新增銀行帳戶</p>
            ) : (
              <div className="w-56">
                <AccountSelector accounts={accounts} value={bankAccountUuid} onChange={onBankAccountChange} />
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col items-end">
            <Button variant="primary" onClick={onPreview} disabled={previewLoading || statementAmount <= 0}>
              {previewLoading ? '預覽拆帳中…' : '預覽拆帳'}
            </Button>
            {previewError && <p className="mt-2 text-sm text-semantic-error">{previewError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
