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
import { cycleNhiDeclareStatus, updateLaborLocalExtras } from '../localExtras';
import type { LaborRecord } from '../types';

interface LaborPdfManagerProps {
  record: LaborRecord;
  onChange: () => void;
}

/**
 * 勞報單的扣繳繳款書／二代健保繳款書管理，比照原版 WithholdingPdfManager／HealthInsurancePdfManager 精簡而成。
 * 後端尚無繳款書產生／繳款狀態／二代健保申報 API，暫以前端記憶體模擬（見 localExtras.ts），重新整理頁面會重置。
 */
export default function LaborPdfManager({ record, onChange }: LaborPdfManagerProps) {
  const { isLocked } = useLock();
  const [taxProofOpen, setTaxProofOpen] = useState(false);
  const [nhiProofOpen, setNhiProofOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<MockFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'withholdingFiles' | 'nhiFiles'; file: MockFile } | null>(null);

  const handleGenerateWithholding = () => {
    const file = createMockFile(`${record.name} 扣繳繳款書`, [
      { label: '所得人', value: record.name },
      { label: '扣繳稅額', value: fmtCurrency(record.withholdingTax) },
    ]);
    updateLaborLocalExtras(record.uuid, { withholdingFiles: [...record.withholdingFiles, file] });
    onChange();
  };

  const handleGenerateNhi = () => {
    const file = createMockFile(`${record.name} 二代健保繳款書`, [
      { label: '所得人', value: record.name },
      { label: '二代健保金額', value: fmtCurrency(record.secondHealthInsuranceFee) },
    ]);
    updateLaborLocalExtras(record.uuid, { nhiFiles: [...record.nhiFiles, file] });
    onChange();
  };

  const handleDeleteFile = () => {
    if (!deleteTarget) return;
    updateLaborLocalExtras(record.uuid, { [deleteTarget.kind]: record[deleteTarget.kind].filter(f => f.id !== deleteTarget.file.id) });
    onChange();
  };

  const handleDeclare = () => {
    if (!record.isNhiDeclared) {
      updateLaborLocalExtras(record.uuid, { isNhiDeclared: true, nhiDeclareStatus: 1 });
    } else {
      updateLaborLocalExtras(record.uuid, { nhiDeclareStatus: cycleNhiDeclareStatus(record.nhiDeclareStatus) });
    }
    onChange();
  };

  return (
    <div className="flex flex-col gap-5">
      {record.withholdingTax > 0 && (
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

      {record.secondHealthInsuranceFee > 0 && (
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
          updateLaborLocalExtras(record.uuid, { withholdingPaid: true, withholdingProofFiles: [...record.withholdingProofFiles, file] });
          onChange();
        }}
      />
      <PaymentProofDialog
        open={nhiProofOpen}
        onClose={() => setNhiProofOpen(false)}
        title="二代健保繳費證明上傳"
        onConfirm={(date, fileName) => {
          const file = createMockFile(fileName, [{ label: '繳款日期', value: date.toLocaleDateString('zh-TW') }]);
          updateLaborLocalExtras(record.uuid, { nhiPaid: true, nhiProofFiles: [...record.nhiProofFiles, file] });
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
