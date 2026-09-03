'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency } from '@/lib/utils';
import type { PayrollItem } from '../types';

interface HealthInsuranceConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: PayrollItem[];
}

/** 製作二代健保繳款書前的確認彈窗：以員工是否有勞健保投保區分正職／兼職，簡化自原版明細表 */
export default function HealthInsuranceConfirmDialog({ open, onClose, onConfirm, items }: HealthInsuranceConfirmDialogProps) {
  if (!open) return null;

  const rows = items.filter(i => i.secondHealthInsuranceFee > 0);
  const total = rows.reduce((sum, i) => sum + i.secondHealthInsuranceFee, 0);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="製作二代健保繳款書" widthClassName="max-w-[520px]">
      <div className="flex flex-col gap-4 text-sm">
        <ul className="list-disc space-y-1 rounded-md bg-surface-cream p-3 pl-8 text-xs text-neutral-mid">
          <li>二代健保保費，請於發薪日後次月月底前至銀行或四大超商完成繳納。</li>
        </ul>

        <div className="overflow-hidden rounded-md border border-neutral-blue-gray/20">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-cream text-xs text-neutral-mid">
              <tr>
                <th className="px-3 py-2">姓名</th>
                <th className="px-3 py-2">身分證</th>
                <th className="px-3 py-2">類別</th>
                <th className="px-3 py-2 text-right">二代健保金額</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(i => (
                <tr key={i.employeeId} className="border-t border-neutral-blue-gray/20">
                  <td className="px-3 py-2">{i.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-neutral-mid">{i.idNumber}</td>
                  <td className="px-3 py-2">
                    <Badge tone={i.laborEmployeeAmount > 0 ? 'info' : 'neutral'}>{i.laborEmployeeAmount > 0 ? '正職' : '兼職'}</Badge>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{fmtCurrency(i.secondHealthInsuranceFee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-blue-gray/20 pt-3">
          <span className="text-neutral-mid">合計</span>
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
