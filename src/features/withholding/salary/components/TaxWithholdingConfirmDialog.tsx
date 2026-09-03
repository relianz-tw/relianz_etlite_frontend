'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency } from '@/lib/utils';
import type { PayrollItem } from '../types';

interface TaxWithholdingConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: PayrollItem[];
}

/** 製作扣繳稅額繳款書前的確認彈窗：列出納入計算的員工與總額，簡化自原版的分組明細 */
export default function TaxWithholdingConfirmDialog({ open, onClose, onConfirm, items }: TaxWithholdingConfirmDialogProps) {
  if (!open) return null;

  const included = items.filter(i => i.withholding > 0);
  const excluded = items.filter(i => i.withholding === 0);
  const total = included.reduce((sum, i) => sum + i.withholding, 0);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="製作扣繳稅額繳款書" widthClassName="max-w-[520px]">
      <div className="flex flex-col gap-4 text-sm">
        <ul className="list-disc space-y-1 rounded-md bg-surface-cream p-3 pl-8 text-xs text-neutral-mid">
          <li>員工薪資所得扣繳稅款，請於發薪日後次月 10 日前至銀行或四大超商完成繳納。</li>
          <li>若單筆固定薪資或獎金未超過扣繳起點，則不會納入本次計算。</li>
        </ul>

        <div>
          <p className="mb-1 font-semibold text-neutral-dark">共 {included.length} 人納入繳款書</p>
          <div className="flex flex-wrap gap-1.5">
            {included.map(i => (
              <span key={i.employeeId} className="rounded-sm bg-brand-blue/10 px-2 py-0.5 text-xs text-brand-blue">
                {i.name}
              </span>
            ))}
          </div>
        </div>

        {excluded.length > 0 && (
          <div>
            <p className="mb-1 text-xs text-neutral-mid">以下人員未達扣繳門檻，不納入計算：</p>
            <div className="flex flex-wrap gap-1.5">
              {excluded.map(i => (
                <span key={i.employeeId} className="rounded-sm bg-surface-cream px-2 py-0.5 text-xs text-neutral-mid line-through">
                  {i.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-neutral-blue-gray/20 pt-3">
          <span className="text-neutral-mid">扣繳稅額總計</span>
          <span className="font-mono text-lg font-semibold text-neutral-dark">{fmtCurrency(total)}</span>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button onClick={handleConfirm}>我已知道，請幫我產出繳款書</Button>
      </div>
    </Modal>
  );
}
