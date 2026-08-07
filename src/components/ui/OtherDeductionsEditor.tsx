'use client';

import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import SubjectSelect, { type SubjectOption } from '@/components/ui/SubjectSelect';
import TextInput from '@/components/ui/TextInput';
import { Plus, Trash2 } from 'lucide-react';

/** 額外金額單列：對應沖帳 API 的 otherDeductions 項目，subject 未選時視為尚未填完整 */
export interface OtherDeductionRow {
  id: string;
  subject: SubjectOption | null;
  name: string;
  amount: number;
}

interface OtherDeductionsEditorProps {
  rows: OtherDeductionRow[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<Omit<OtherDeductionRow, 'id'>>) => void;
}

/**
 * 額外金額列表：科目 + 項目名稱 + 金額，可無限新增／移除，從對帳單金額（或交易金額）中扣除。
 * 供手動沖帳（ManualEntryDialog／SettlementEditDialog，容器較窄）與匯總沖帳（ReconPoolPanel，容器較寬）共用，
 * 故每列固定採二行版面（科目獨立一行、項目名稱＋金額＋刪除一行）並以卡片分隔，不隨容器寬度改變排列方式，
 * 避免窄容器下欄位擠壓換行、行與行之間欄位錯位而顯得凌亂。
 */
export default function OtherDeductionsEditor({ rows, onAdd, onRemove, onChange }: OtherDeductionsEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map(row => (
        <div key={row.id} className="flex flex-col gap-2 rounded-lg border border-neutral-blue-gray/30 bg-surface-cream/50 p-3">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <SubjectSelect value={row.subject} onChange={s => onChange(row.id, { subject: s })} placeholder="請選擇科目" />
            </div>
            <button
              type="button"
              onClick={() => onRemove(row.id)}
              aria-label="移除此項"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-neutral-mid transition-colors hover:bg-white hover:text-semantic-error"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <TextInput
              widthClassName="w-full"
              value={row.name}
              onChange={e => onChange(row.id, { name: e.target.value })}
              placeholder="項目名稱"
            />
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-lg text-neutral-mid">−</span>
              <MoneyInput widthClassName="w-28" value={row.amount} onChange={value => onChange(row.id, { amount: value })} />
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" icon={Plus} onClick={onAdd} className="self-end">
        新增額外金額
      </Button>
    </div>
  );
}
