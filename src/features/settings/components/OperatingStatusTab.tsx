'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { CirclePlus } from 'lucide-react';
import { useState } from 'react';
import { CURRENT_OPERATING_STATUS, OPERATING_STATUS_RECORDS } from '../data';
import type { OperatingStatusRecord } from '../data';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import OperatingStatusDialog from './OperatingStatusDialog';

const STATUS_TONE: Record<OperatingStatusRecord['status'], 'success' | 'error' | 'info'> = {
  開業: 'success',
  停業: 'error',
  復業: 'info',
};
const STATUS_DOT: Record<OperatingStatusRecord['status'], string> = {
  開業: 'bg-semantic-success',
  停業: 'bg-semantic-error',
  復業: 'bg-brand-blue',
};

export default function OperatingStatusTab() {
  const [records, setRecords] = useState<OperatingStatusRecord[]>(OPERATING_STATUS_RECORDS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OperatingStatusRecord | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => {
    setEditingRecord(undefined);
    setDialogOpen(true);
  };
  const openEdit = (record: OperatingStatusRecord) => {
    setEditingRecord(record);
    setDialogOpen(true);
  };
  const handleSubmit = (data: Omit<OperatingStatusRecord, 'id'>) => {
    if (editingRecord) {
      setRecords(list => list.map(r => (r.id === editingRecord.id ? { ...editingRecord, ...data } : r)));
    } else {
      setRecords(list => [...list, { ...data, id: `o${list.length + 1}` }]);
    }
  };
  const handleDelete = () => {
    if (!deleteId) return;
    setRecords(list => list.filter(r => r.id !== deleteId));
  };

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-neutral-dark">營業狀態紀錄</h2>
          <Badge tone={STATUS_TONE[CURRENT_OPERATING_STATUS]} variant="solid">
            目前狀態：{CURRENT_OPERATING_STATUS}
          </Badge>
        </div>
        <Button size="sm" icon={CirclePlus} onClick={openNew}>
          新增停業紀錄
        </Button>
      </div>

      <div className="flex flex-col">
        {records.map((record, i) => (
          <div key={record.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[record.status]}`} />
              {i < records.length - 1 && <span className="w-px flex-1 bg-neutral-blue-gray/30" />}
            </div>
            <div className={`flex flex-1 flex-wrap items-start justify-between gap-3 ${i < records.length - 1 ? 'pb-6' : ''}`}>
              <div>
                <Badge tone={STATUS_TONE[record.status]} variant="solid" className="mb-2">
                  {record.status}
                </Badge>
                <p className="text-sm text-neutral-mid">
                  {record.startDate} ~ {record.endDate}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <button type="button" className="text-brand-blue" onClick={() => openEdit(record)}>
                  修正
                </button>
                <button type="button" className="text-semantic-error" onClick={() => setDeleteId(record.id)}>
                  刪除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <OperatingStatusDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit} initial={editingRecord} />
      <ConfirmDeleteDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="刪除營業狀態紀錄"
        message="確定要刪除此紀錄嗎？此動作無法復原。"
      />
    </div>
  );
}
