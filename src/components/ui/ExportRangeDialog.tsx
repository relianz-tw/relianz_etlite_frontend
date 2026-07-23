'use client';

import Button from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import Modal from '@/components/ui/Modal';
import { Download, X } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

interface ExportRangeDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (start: Date, end: Date) => void;
}

export default function ExportRangeDialog({ open, onClose, onExport }: ExportRangeDialogProps) {
  const [range, setRange] = useState<DateRange | undefined>();

  if (!open) return null;

  const handleExport = () => {
    if (!range?.from || !range?.to) return;
    onExport(range.from, range.to);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="選擇匯出資料期間" widthClassName="max-w-[380px]">
      <div className="rounded-md border border-neutral-blue-gray/30">
        <div className="flex items-center justify-between border-b border-neutral-blue-gray/30 px-4 py-3">
          <span className="text-sm font-semibold text-neutral-dark">請選擇交易期間</span>
          <button type="button" onClick={() => setRange(undefined)} aria-label="清除選取" className="text-neutral-mid hover:text-neutral-dark">
            <X size={16} />
          </button>
        </div>
        <Calendar mode="range" selected={range} onSelect={setRange} />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="danger" onClick={onClose}>
          取消
        </Button>
        <Button variant="primary" icon={Download} onClick={handleExport} disabled={!range?.from || !range?.to}>
          匯出
        </Button>
      </div>
    </Modal>
  );
}
