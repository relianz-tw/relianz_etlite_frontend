'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { fmtCurrency } from '@/lib/utils';
import { useState } from 'react';
import FileListSection from '../../components/FileListSection';
import { useLock } from '../../components/LockContext';
import MockFilePreviewModal from '../../components/MockFilePreviewModal';
import PaymentProofDialog from '../../components/PaymentProofDialog';
import { createMockFile, type MockFile } from '../../components/mockFile';
import { nhiDeclareStatusText } from '../data';
import { cycleNhiDeclareStatusFor, updateWithholdingRecord } from '../mockStore';
import type { WithholdingRecord } from '../types';

interface WithholdingPdfManagerProps {
  record: WithholdingRecord;
  onChange: () => void;
}

/** 各類扣繳的扣繳繳款書／二代健保繳款書管理，比照原版 WithholdingPdfManager／HealthInsurancePdfManager 精簡而成 */
export default function WithholdingPdfManager({ record, onChange }: WithholdingPdfManagerProps) {
  const { isLocked } = useLock();
  const [taxProofOpen, setTaxProofOpen] = useState(false);
  const [nhiProofOpen, setNhiProofOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<MockFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'withholdingFiles' | 'nhiFiles'; file: MockFile } | null>(null);

  const handleGenerateWithholding = () => {
    const file = createMockFile(`${record.recipientName} 扣繳繳款書`, [
      { label: '所得人', value: record.recipientName },
      { label: '扣繳稅額', value: fmtCurrency(record.withholdingAmount) },
    ]);
    updateWithholdingRecord(record.uuid, { withholdingFiles: [...record.withholdingFiles, file] });
    onChange();
  };

  const handleGenerateNhi = () => {
    const file = createMockFile(`${record.recipientName} 二代健保繳款書`, [
      { label: '所得人', value: record.recipientName },
      { label: '二代健保金額', value: fmtCurrency(record.nhiAmount) },
    ]);
    updateWithholdingRecord(record.uuid, { nhiFiles: [...record.nhiFiles, file] });
    onChange();
  };

  const handleDeleteFile = () => {
    if (!deleteTarget) return;
    updateWithholdingRecord(record.uuid, { [deleteTarget.kind]: record[deleteTarget.kind].filter(f => f.id !== deleteTarget.file.id) });
    onChange();
  };

  const handleDeclare = () => {
    if (!record.isNhiDeclared) {
      updateWithholdingRecord(record.uuid, { isNhiDeclared: true, nhiDeclareStatus: 1 });
    } else {
      updateWithholdingRecord(record.uuid, { nhiDeclareStatus: cycleNhiDeclareStatusFor(record.nhiDeclareStatus) });
    }
    onChange();
  };

  return (
    <div className="flex flex-col gap-5">
      {record.withholdingAmount > 0 && (
        <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
          <div className="mb-4 flex flex-col gap-3 nav:flex-row nav:items-center nav:justify-between">
            <h3 className="text-lg font-semibold text-neutral-dark">扣繳繳款書</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleGenerateWithholding}
                disabled={isLocked || record.withholdingFiles.length > 0 || record.withholdingPaid}
                title={record.withholdingFiles.length > 0 ? '繳款書已存在，如需重新產生請先刪除' : record.withholdingPaid ? '已繳納，無需產生繳款書' : undefined}
              >
                產生扣繳繳款書
              </Button>
              <Button size="sm" variant={record.withholdingPaid ? 'primary' : 'outline'} disabled={record.withholdingPaid || isLocked} onClick={() => setTaxProofOpen(true)}>
                {record.withholdingPaid ? '繳款狀態 - 已繳納' : '繳款狀態 - 未繳納'}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <FileListSection
              title="扣繳繳款書"
              files={record.withholdingFiles}
              emptyText={record.withholdingProofFiles.length > 0 ? '您已繳款完畢！' : '尚未產生扣繳繳款書'}
              onView={setPreviewFile}
              onDelete={file => setDeleteTarget({ kind: 'withholdingFiles', file })}
            />
            <FileListSection title="扣繳繳款證明" files={record.withholdingProofFiles} emptyText="尚未上傳繳款證明" onView={setPreviewFile} />
          </div>
        </div>
      )}

      {record.nhiAmount > 0 && (
        <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
          <div className="mb-4 flex flex-col gap-3 nav:flex-row nav:items-center nav:justify-between">
            <h3 className="text-lg font-semibold text-neutral-dark">二代健保繳款書</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleGenerateNhi}
                disabled={isLocked || record.nhiFiles.length > 0 || record.nhiPaid}
                title={record.nhiFiles.length > 0 ? '繳款書已存在，如需重新產生請先刪除' : record.nhiPaid ? '已繳納，無需產生繳款書' : undefined}
              >
                產生二代健保繳款書
              </Button>
              <Button size="sm" variant={record.nhiPaid ? 'primary' : 'outline'} disabled={record.nhiPaid || isLocked} onClick={() => setNhiProofOpen(true)}>
                {record.nhiPaid ? '繳款狀態 - 已繳納' : '繳款狀態 - 未繳納'}
              </Button>
              {record.nhiPaid && (
                <Button size="sm" variant={record.isNhiDeclared ? 'primary' : 'outline'} onClick={handleDeclare} disabled={isLocked}>
                  {record.isNhiDeclared ? nhiDeclareStatusText(record.nhiDeclareStatus) : '申報'}
                </Button>
              )}
            </div>
          </div>

          {record.isNhiDeclared && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-brand-blue/20 bg-brand-blue/5 px-3 py-2 text-xs text-brand-blue">
              <Badge tone="info">{nhiDeclareStatusText(record.nhiDeclareStatus)}</Badge>
              二代健保申報已送出，如需查詢狀態或取消申報，請使用健保署二代健保申報狀態查詢頁面。
            </div>
          )}

          <div className="flex flex-col gap-4">
            <FileListSection
              title="二代健保繳款書"
              files={record.nhiFiles}
              emptyText={record.nhiProofFiles.length > 0 ? '您已繳款完畢！' : '尚未產生二代健保繳款書'}
              onView={setPreviewFile}
              onDelete={file => setDeleteTarget({ kind: 'nhiFiles', file })}
            />
            <FileListSection title="二代健保繳款證明" files={record.nhiProofFiles} emptyText="尚未上傳繳款證明" onView={setPreviewFile} />
          </div>
        </div>
      )}

      <PaymentProofDialog
        open={taxProofOpen}
        onClose={() => setTaxProofOpen(false)}
        title="扣繳繳稅證明上傳"
        onConfirm={(date, fileName) => {
          const file = createMockFile(fileName, [{ label: '繳款日期', value: date.toLocaleDateString('zh-TW') }]);
          updateWithholdingRecord(record.uuid, { withholdingPaid: true, withholdingProofFiles: [...record.withholdingProofFiles, file] });
          onChange();
        }}
      />
      <PaymentProofDialog
        open={nhiProofOpen}
        onClose={() => setNhiProofOpen(false)}
        title="二代健保繳費證明上傳"
        onConfirm={(date, fileName) => {
          const file = createMockFile(fileName, [{ label: '繳款日期', value: date.toLocaleDateString('zh-TW') }]);
          updateWithholdingRecord(record.uuid, { nhiPaid: true, nhiProofFiles: [...record.nhiProofFiles, file] });
          onChange();
        }}
      />

      <MockFilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteFile}
        title="確定要刪除此繳款書嗎？"
        message="此動作無法復原。"
      />
    </div>
  );
}
