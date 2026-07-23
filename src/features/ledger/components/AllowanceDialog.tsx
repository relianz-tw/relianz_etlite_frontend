'use client';

import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { fmtCurrency } from '@/lib/utils';
import { useState } from 'react';
import type { AllowanceRecord, SalesRow } from '../types';

interface AllowanceDialogProps {
  open: boolean;
  onClose: () => void;
  row: SalesRow | null;
  onSubmit: (rowId: string, record: AllowanceRecord) => void;
}

/** 帳簿列的民國年日期字串（如 "115/03/26"）→ JS Date，供 DatePicker 預設值使用 */
function parseRowDate(date: string): Date {
  const [year, month, day] = date.split('/').map(Number);
  return new Date((year || 0) + 1911, (month || 1) - 1, day || 1);
}

/** Date → 民國年日期字串（如 "115/03/26"），對齊列表資料的日期格式 */
function formatRocDate(date: Date): string {
  const year = date.getFullYear() - 1911;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export default function AllowanceDialog({ open, onClose, row, onSubmit }: AllowanceDialogProps) {
  if (!open || !row) return null;
  return <AllowanceDialogContent row={row} onClose={onClose} onSubmit={onSubmit} />;
}

/** row 切換時透過外層 open/row 判斷重新掛載，確保表單狀態每次以該筆交易的資料重新初始化 */
function AllowanceDialogContent({
  row,
  onClose,
  onSubmit,
}: {
  row: SalesRow;
  onClose: () => void;
  onSubmit: (rowId: string, record: AllowanceRecord) => void;
}) {
  const [date, setDate] = useState<Date | undefined>(parseRowDate(row.date));
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    onSubmit(row.id, {
      id: `ALW-${row.id}-${Date.now()}`,
      date: date ? formatRocDate(date) : row.date,
      amount,
      note,
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={`折讓 — ${row.id}`} widthClassName="max-w-[480px]">
      <div className="flex flex-col gap-4">
        <div>
          <span className="mb-2 block text-sm font-semibold text-neutral-dark">折讓歷史紀錄</span>
          {row.allowances.length === 0 ? (
            <div className="rounded-md bg-surface-cream p-4 text-center text-sm text-neutral-mid">尚無折讓紀錄</div>
          ) : (
            <div className="flex flex-col gap-2 rounded-md border border-neutral-blue-gray/30 p-3">
              {row.allowances.map(record => (
                <div key={record.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-mono text-neutral-mid">{record.date}</span>
                  <span className="flex-1 truncate text-neutral-dark">{record.note}</span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(record.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-neutral-blue-gray/20 pt-4">
          <span className="mb-3 block text-sm font-semibold text-neutral-dark">新增折讓</span>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">折讓日期</label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-neutral-dark">折讓金額</span>
              <MoneyInput widthClassName="w-36" value={amount} onChange={setAmount} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">說明</label>
              <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="請輸入折讓原因" rows={3} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="danger" onClick={onClose}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          新增折讓
        </Button>
      </div>
    </Modal>
  );
}
