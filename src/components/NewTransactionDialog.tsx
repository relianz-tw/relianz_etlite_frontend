'use client';

import Modal from '@/components/ui/Modal';
import { FileText, PenLine, Upload } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ImportInvoiceDialog from './ImportInvoiceDialog';

interface NewTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  /** 手開發票的目的地，帳簿頁會帶入 side 與返回參數 */
  manualHref?: string;
}

type Step = 'choose' | 'import';

interface ChoiceOption {
  icon: LucideIcon;
  title: string;
  description: string;
  onSelect: () => void;
}

export default function NewTransactionDialog({ open, onClose, manualHref = '/ledger/new' }: NewTransactionDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('choose');

  // 每次開啟 dialog 都從選擇步驟開始
  useEffect(() => {
    if (open) setStep('choose');
  }, [open]);

  const goTo = (href: string) => {
    router.push(href);
    onClose();
  };

  const options: ChoiceOption[] = [
    {
      icon: PenLine,
      title: '手開發票',
      description: '手動填寫發票內容建立交易',
      onSelect: () => goTo(manualHref),
    },
    {
      icon: FileText,
      title: '電子發票',
      description: '開立電子發票並自動記帳',
      onSelect: () => goTo('/einvoice'),
    },
    {
      icon: Upload,
      title: '匯入電子發票',
      description: '上傳財政部平台下載的檔案',
      onSelect: () => setStep('import'),
    },
  ];

  if (step === 'import') {
    return <ImportInvoiceDialog open={open} onClose={onClose} />;
  }

  return (
    <Modal open={open} onClose={onClose} title="新增交易" widthClassName="max-w-[480px]">
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
