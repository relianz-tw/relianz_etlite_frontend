'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { Download } from 'lucide-react';
import { useState } from 'react';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

interface ExportSelectedDialogProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  selectedAmount: string;
  onExport: (format: ExportFormat) => void;
}

/** 「匯出所選交易」對話框：針對表格/卡片中已勾選的交易產生匯出檔（目前為介面 stub，尚未接上實際產檔邏輯） */
export default function ExportSelectedDialog({ open, onClose, selectedCount, selectedAmount, onExport }: ExportSelectedDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');

  if (!open) return null;

  const handleExport = () => {
    if (selectedCount === 0) return;
    onExport(format);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="匯出所選交易" widthClassName="max-w-[380px]">
      <div className="rounded-md bg-surface-off-white px-4 py-3 text-sm text-neutral-mid">
        已選 <span className="font-semibold text-neutral-dark">{selectedCount}</span> 筆 ·{' '}
        <span className="font-mono font-semibold tabular-nums text-neutral-dark">{selectedAmount}</span>
      </div>

      <div className="mt-4">
        <span className="mb-1.5 block text-sm font-semibold text-neutral-dark">匯出格式</span>
        <SegmentedControl options={FORMAT_OPTIONS} value={format} onChange={setFormat} size="md" />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="danger" onClick={onClose}>
          取消
        </Button>
        <Button variant="primary" icon={Download} onClick={handleExport} disabled={selectedCount === 0}>
          匯出
        </Button>
      </div>
    </Modal>
  );
}
