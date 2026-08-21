'use client';

import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import { cn, fmtCurrency } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import type { ReconAllocationRow, ReconTarget } from '../targets';
import { computeAllocation, formatTargetBalance, isTargetTaken } from '../targets';
import type { ReconSide } from '../types';
import ReconTargetSelect from './ReconTargetSelect';

interface ReconTargetAllocationProps {
  side: ReconSide;
  /** 待分配總額，即 ReconPoolPanel 算出的實際存入／付出金額（depositAmount） */
  depositAmount: number;
  options: ReconTarget[];
  optionsLoading: boolean;
  optionsError: string;
  primaryTargetKey: string;
  onPrimaryTargetChange: (key: string) => void;
  rows: ReconAllocationRow[];
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onChangeRow: (id: string, patch: Partial<Omit<ReconAllocationRow, 'id'>>) => void;
  disabled?: boolean;
}

/**
 * 沖帳對象分配：主對象自動補足未分配金額，其餘分出列逐筆填對象與金額（見設計稿「1c 主帳戶自動補足」）。
 * 取代原本 ReconPoolPanel 內單一銀行帳戶下拉的區塊，位置與該區塊完全相同（收款日之後、確認沖帳按鈕之前）。
 * 分出列可選銀行帳戶或固定會計科目（現金／股東往來等，見 targets.ts），每個對象至多被選一次。
 */
export default function ReconTargetAllocation({
  side,
  depositAmount,
  options,
  optionsLoading,
  optionsError,
  primaryTargetKey,
  onPrimaryTargetChange,
  rows,
  onAddRow,
  onRemoveRow,
  onChangeRow,
  disabled = false,
}: ReconTargetAllocationProps) {
  const accountLabel = side === 'payable' ? '付款銀行帳戶' : '存入銀行帳戶';
  const methodLabel = side === 'payable' ? '付款方式' : '收款方式';
  const directionLabel = side === 'payable' ? '付款' : '收款';
  const primaryTarget = options.find(o => o.key === primaryTargetKey);
  const { primaryAmount } = computeAllocation(depositAmount, rows);
  const isOverAllocated = primaryAmount < 0;
  // 新增一列時是否還有可選對象：全部固定科目與帳戶皆已被主對象或既有分出列佔用時停用「加入對象」
  const hasSelectableTarget = options.some(o => !isTargetTaken(o.key, primaryTargetKey, rows));

  if (optionsLoading) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-neutral-dark">{accountLabel}</span>
        <p className="text-xs text-neutral-mid">載入中…</p>
      </div>
    );
  }
  if (optionsError) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-neutral-dark">{accountLabel}</span>
        <p className="text-xs text-semantic-error">{optionsError}</p>
      </div>
    );
  }
  if (options.length === 0) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-neutral-dark">{accountLabel}</span>
        <p className="text-xs text-semantic-error">尚無啟用中的銀行帳戶，請先於設定新增銀行帳戶</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-neutral-dark">{methodLabel}</span>
        <span className="text-xs text-neutral-mid">
          實際{directionLabel}金額 {fmtCurrency(depositAmount)}
        </span>
      </div>

      {/* 主對象：未分配的金額自動存入此對象，金額為算出值、不可直接編輯 */}
      <div className="flex flex-col gap-2 rounded-lg border-[1.5px] border-brand-blue/40 bg-brand-blue/5 p-3">
        <ReconTargetSelect
          options={options}
          value={primaryTargetKey}
          onChange={onPrimaryTargetChange}
          takenKeys={new Set(rows.map(r => r.targetKey).filter(Boolean))}
          disabled={disabled}
        />
        {primaryTarget && (
          <p className="text-xs text-neutral-mid">
            {primaryTarget.subLabel} · 餘額 {formatTargetBalance(primaryTarget.balance)}
          </p>
        )}
        <div className="flex items-center justify-end gap-2 border-t border-brand-blue/20 pt-2">
          <span className={cn('shrink-0 font-mono text-base font-semibold tabular-nums', isOverAllocated ? 'text-semantic-error' : 'text-neutral-dark')}>
            {fmtCurrency(primaryAmount)}
          </span>
        </div>
      </div>

      {/* 分出列：可新增多列，各自選對象與填金額（恆為正值） */}
      {rows.map(row => {
        const otherKeys = rows.filter(r => r.id !== row.id).map(r => r.targetKey);
        const takenKeys = new Set([primaryTargetKey, ...otherKeys].filter(Boolean));
        return (
          <div key={row.id} className="flex flex-col gap-2 rounded-lg border border-neutral-blue-gray/30 bg-white p-3">
            <ReconTargetSelect
              options={options}
              value={row.targetKey}
              onChange={key => onChangeRow(row.id, { targetKey: key })}
              takenKeys={takenKeys}
              disabled={disabled}
              placeholder="請選擇分出對象"
            />
            <MoneyInput value={row.amount} onChange={value => onChangeRow(row.id, { amount: value })} disabled={disabled} />
            <button
              type="button"
              onClick={() => onRemoveRow(row.id)}
              disabled={disabled}
              aria-label="移除此分出對象"
              className="flex min-h-11 items-center justify-end gap-1 self-end text-xs text-neutral-mid transition-colors hover:text-semantic-error disabled:cursor-not-allowed disabled:opacity-50 nav:min-h-0"
            >
              <Trash2 size={13} />
              移除
            </button>
          </div>
        );
      })}

      <Button variant="outline" size="sm" icon={Plus} onClick={onAddRow} disabled={disabled || !hasSelectableTarget} className="w-full justify-center">
        新增{methodLabel}
      </Button>

      {rows.length > 0 && (
        <div className="flex items-baseline justify-end gap-2 border-t border-neutral-blue-gray/20 pt-3">
          <span className="shrink-0 font-mono text-base font-semibold tabular-nums text-neutral-dark">{fmtCurrency(depositAmount)}</span>
        </div>
      )}
      {isOverAllocated && <p className="text-xs text-semantic-error">已分配金額超過實際{directionLabel}金額，請調整</p>}
    </div>
  );
}
