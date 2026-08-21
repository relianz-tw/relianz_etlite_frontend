'use client';

import Button from '@/components/ui/Button';
import Label from '@/components/ui/Label';
import MoneyInput from '@/components/ui/MoneyInput';
import SubjectSelect, { type SubjectOption } from '@/components/ui/SubjectSelect';
import TextInput from '@/components/ui/TextInput';
import { cn } from '@/lib/utils';
import { Pencil, Plus, Trash2 } from 'lucide-react';

/** 額外金額單列：對應沖帳 API 的 otherDeductions 項目，subject 未選時視為尚未填完整。
 * confirmed 為 true 時該列改用收合顯示（見 OtherDeductionsEditor 說明）；新增時不帶此欄位視為 false（展開編輯）。 */
export interface OtherDeductionRow {
  id: string;
  subject: SubjectOption | null;
  name: string;
  amount: number;
  confirmed?: boolean;
}

interface OtherDeductionsEditorProps {
  rows: OtherDeductionRow[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<Omit<OtherDeductionRow, 'id'>>) => void;
  /** 開啟後每列金額改用 MoneyInput 的正負切換鈕，取代原本寫死的 − 字元；預設 false 維持原行為 */
  allowSign?: boolean;
  /** 停用整個編輯器（新增按鈕與既有列的科目／名稱／金額／編輯／刪除皆不可操作），用於呼叫端尚未滿足前置條件時 */
  disabled?: boolean;
}

/**
 * 額外金額列表：科目 + 項目名稱 + 金額，可無限新增／移除，從對帳單金額（或交易金額）中扣除。
 * 供手動沖帳（SettlementEditDialog，容器較窄）與匯總沖帳（ReconPoolPanel，容器較寬）共用，
 * 故每列固定採二行版面（科目獨立一行、項目名稱＋金額＋刪除一行）並以卡片分隔，不隨容器寬度改變排列方式，
 * 避免窄容器下欄位擠壓換行、行與行之間欄位錯位而顯得凌亂。
 * 新增的列預設展開為編輯卡片；科目／項目名稱／金額都填妥後按「確認」收合為單行顯示（label 在上、金額輸入框在下，
 * 與同容器內的「手續費」欄位同一種格式），收合後金額仍可直接編輯，另提供編輯（展開回卡片改科目／名稱）與刪除操作。
 */
export default function OtherDeductionsEditor({ rows, onAdd, onRemove, onChange, allowSign = false, disabled = false }: OtherDeductionsEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map(row => {
        const isIncomplete = !row.subject?.id || !row.name.trim() || row.amount === 0;
        if (row.confirmed) {
          return (
            <div key={row.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm text-neutral-dark" title={row.name}>
                  {row.name}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onChange(row.id, { confirmed: false })}
                    disabled={disabled}
                    aria-label="編輯此項"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-mid transition-colors hover:bg-surface-cream hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-neutral-mid"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    disabled={disabled}
                    aria-label="移除此項"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-mid transition-colors hover:bg-surface-cream hover:text-semantic-error disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-neutral-mid"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <MoneyInput value={row.amount} onChange={value => onChange(row.id, { amount: value })} allowSign={allowSign} negativeByDefault disabled={disabled} />
            </div>
          );
        }

        return (
          <div key={row.id} className="flex flex-col gap-2 rounded-lg border border-neutral-blue-gray/30 bg-surface-cream/50 p-3">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Label required>科目</Label>
                <SubjectSelect value={row.subject} onChange={s => onChange(row.id, { subject: s })} placeholder="請選擇科目" disabled={disabled} />
              </div>
              <button
                type="button"
                onClick={() => onRemove(row.id)}
                disabled={disabled}
                aria-label="移除此項"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-neutral-mid transition-colors hover:bg-white hover:text-semantic-error disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-neutral-mid"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-2 nav:flex-row nav:items-end">
              <div className="min-w-0 flex-1">
                <Label required>項目名稱</Label>
                <TextInput
                  widthClassName="w-full"
                  value={row.name}
                  onChange={e => onChange(row.id, { name: e.target.value })}
                  placeholder="項目名稱"
                  disabled={disabled}
                />
              </div>
              <div className="w-full shrink-0 nav:w-auto">
                <Label required>金額</Label>
                <div className="flex items-center gap-1.5">
                  {!allowSign && <span className="text-lg text-neutral-mid">−</span>}
                  <MoneyInput
                    widthClassName={cn('w-full', allowSign ? 'nav:w-36' : 'nav:w-28')}
                    value={row.amount}
                    onChange={value => onChange(row.id, { amount: value })}
                    allowSign={allowSign}
                    negativeByDefault
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={() => onChange(row.id, { confirmed: true })} disabled={isIncomplete || disabled}>
                確認
              </Button>
            </div>
          </div>
        );
      })}

      <Button variant="outline" size="sm" icon={Plus} onClick={onAdd} disabled={disabled} className="self-end">
        新增額外金額
      </Button>
    </div>
  );
}
