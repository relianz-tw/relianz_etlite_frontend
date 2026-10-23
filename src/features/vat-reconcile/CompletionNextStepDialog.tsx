'use client';

import Modal from '@/components/ui/Modal';
import { buildLedgerPeriodQuery, resolveLedgerBackHref } from '@/features/ledger/urlState';
import { formatInvoicePeriodLabel } from '@/lib/invoicePeriod';
import { BookOpen, CornerDownRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CompletionNextStepDialogProps {
  open: boolean;
  onClose: () => void;
  rocYear: number;
  phase: number;
}

interface NextStepOption {
  icon: LucideIcon;
  title: string;
  description: string;
  onSelect: () => void;
}

/**
 * 發票簿建立完成後詢問下一步。
 * 本彈窗只從任務中心開啟，「返回任務中心」等同留在原地，故只列返回帳簿與留在原地兩項。
 */
export default function CompletionNextStepDialog({ open, onClose, rocYear, phase }: CompletionNextStepDialogProps) {
  const router = useRouter();

  const options: NextStepOption[] = [
    {
      icon: BookOpen,
      title: '返回帳簿',
      description: `帳簿時間區間設為 ${formatInvoicePeriodLabel(rocYear, phase)}，接著補登交易`,
      onSelect: () => {
        router.push(resolveLedgerBackHref(buildLedgerPeriodQuery(rocYear, phase)));
        onClose();
      },
    },
    {
      icon: CornerDownRight,
      title: '留在任務中心',
      description: '繼續處理其他待完成項目',
      onSelect: onClose,
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="發票簿已建立，接下來要？" widthClassName="max-w-[480px]">
      <div className="flex flex-col gap-2">
        {options.map(({ icon: Icon, title, description, onSelect }) => (
          <button
            key={title}
            type="button"
            onClick={onSelect}
            className="flex w-full items-center gap-3 rounded-md border border-neutral-blue-gray/50 bg-white px-4 py-3 text-left transition-colors hover:border-brand-primary hover:bg-brand-blue/5"
          >
            <Icon size={20} className="shrink-0 text-brand-primary" />
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-neutral-dark">{title}</span>
              <span className="text-xs text-neutral-mid">{description}</span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
