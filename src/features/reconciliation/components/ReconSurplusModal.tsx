'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency } from '@/lib/utils';

interface ReconSurplusModalProps {
  open: boolean;
  groupLabel: string;
  pool: number;
  matched: number;
  surplus: number;
  onBack: () => void;
  onCarryOver: () => void;
}

/**
 * 沖帳金額有餘額且無法完整匹配時的提示：詢問使用者要回去檢查，或將餘額留到下次同管道／廠商沖帳使用。
 */
export default function ReconSurplusModal({ open, groupLabel, pool, matched, surplus, onBack, onCarryOver }: ReconSurplusModalProps) {
  if (!open) return null;

  return (
    <Modal open onClose={onBack} title="沖帳金額有餘額" widthClassName="max-w-[460px]">
      <p className="text-sm leading-relaxed text-neutral-dark">
        本次「{groupLabel}」沖帳金額 <span className="font-mono font-semibold tabular-nums">{fmtCurrency(pool)}</span> 元，待沖帳金額{' '}
        <span className="font-mono font-semibold tabular-nums">{fmtCurrency(matched)}</span> 元，仍有{' '}
        <span className="font-mono font-semibold tabular-nums text-semantic-error">{fmtCurrency(surplus)}</span> 元尚未沖入，請問希望：
      </p>
      <div className="mt-6 flex flex-col gap-3 nav:flex-row nav:justify-end">
        <Button variant="outline" onClick={onBack}>
          回去檢查
        </Button>
        <Button variant="primary" onClick={onCarryOver}>
          留在餘額上帶下次沖帳使用
        </Button>
      </div>
    </Modal>
  );
}
