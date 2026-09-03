'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { fmtCurrency } from '@/lib/utils';
import { useState } from 'react';
import { useLock } from '../../components/LockContext';
import FileListSection from '../../components/FileListSection';
import MockFilePreviewModal from '../../components/MockFilePreviewModal';
import PaymentProofDialog from '../../components/PaymentProofDialog';
import { createMockFile, type MockFile } from '../../components/mockFile';
import { getPayrollMonthDocs, updatePayrollMonthDocs } from '../mockStore';
import type { PayrollItem } from '../types';
import HealthInsuranceConfirmDialog from './HealthInsuranceConfirmDialog';
import TaxWithholdingConfirmDialog from './TaxWithholdingConfirmDialog';

interface SalaryPdfManagerProps {
  year: number;
  month: number;
  items: PayrollItem[];
}

const DECLARE_LABEL: Record<'not_declared' | 'partial' | 'all', string> = {
  not_declared: '全部申報',
  partial: '部分申報',
  all: '已申報',
};

export default function SalaryPdfManager({ year, month, items }: SalaryPdfManagerProps) {
  const { isLocked } = useLock();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);
  void tick;

  const docs = getPayrollMonthDocs(year, month);
  const totalWithholding = items.reduce((sum, i) => sum + i.withholding, 0);
  const totalNhi = items.reduce((sum, i) => sum + i.secondHealthInsuranceFee, 0);

  const [taxConfirmOpen, setTaxConfirmOpen] = useState(false);
  const [nhiConfirmOpen, setNhiConfirmOpen] = useState(false);
  const [taxProofOpen, setTaxProofOpen] = useState(false);
  const [nhiProofOpen, setNhiProofOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<MockFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'withholdingFiles' | 'nhiFiles'; file: MockFile } | null>(null);

  const handleGenerateWithholding = () => {
    const file = createMockFile(`${year - 1911}年${month}月 薪資扣繳稅額繳款書`, [
      { label: '納入人數', value: `${items.filter(i => i.withholding > 0).length} 人` },
      { label: '扣繳稅額總計', value: fmtCurrency(totalWithholding) },
    ]);
    updatePayrollMonthDocs(year, month, { withholdingFiles: [...docs.withholdingFiles, file] });
    refresh();
  };

  const handleGenerateNhi = () => {
    const file = createMockFile(`${year - 1911}年${month}月 二代健保繳款書`, [
      { label: '納入人數', value: `${items.filter(i => i.secondHealthInsuranceFee > 0).length} 人` },
      { label: '二代健保金額總計', value: fmtCurrency(totalNhi) },
    ]);
    updatePayrollMonthDocs(year, month, { nhiFiles: [...docs.nhiFiles, file] });
    refresh();
  };

  const handleDeleteFile = () => {
    if (!deleteTarget) return;
    const { kind, file } = deleteTarget;
    updatePayrollMonthDocs(year, month, { [kind]: docs[kind].filter(f => f.id !== file.id) });
    refresh();
  };

  const declareState: 'not_declared' | 'partial' | 'all' = docs.nhiDeclared ? 'all' : 'not_declared';

  return (
    <div className="mt-5 flex flex-col gap-5">
      {/* 扣繳繳款書 */}
      <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
        <div className="mb-4 flex flex-col gap-3 nav:flex-row nav:items-center nav:justify-between">
          <h3 className="text-lg font-semibold text-neutral-dark">扣繳繳款書</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => setTaxConfirmOpen(true)}
              disabled={isLocked || totalWithholding === 0 || docs.withholdingFiles.length > 0 || docs.withholdingPaid}
              title={
                totalWithholding === 0
                  ? '本月無需扣繳，無需產生繳款書'
                  : docs.withholdingFiles.length > 0
                    ? '繳款書已存在，如需重新產生請先刪除'
                    : docs.withholdingPaid
                      ? '已繳納，無需產生繳款書'
                      : undefined
              }
            >
              產生扣繳繳款書
            </Button>
            <Button
              size="sm"
              variant={docs.withholdingPaid ? 'primary' : 'outline'}
              disabled={docs.withholdingPaid || isLocked}
              onClick={() => setTaxProofOpen(true)}
            >
              {totalWithholding === 0 ? '繳款狀態 - 不需繳納' : docs.withholdingPaid ? '繳款狀態 - 已繳納' : '繳款狀態 - 未繳納'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <FileListSection
            title="扣繳繳款書"
            files={docs.withholdingFiles}
            emptyText={docs.withholdingProofFiles.length > 0 ? '您已繳款完畢！' : '尚未產生扣繳繳款書'}
            onView={setPreviewFile}
            onDelete={file => setDeleteTarget({ kind: 'withholdingFiles', file })}
          />
          <FileListSection
            title="扣繳繳款證明"
            files={docs.withholdingProofFiles}
            emptyText="尚未上傳繳款證明"
            onView={setPreviewFile}
          />
        </div>
      </div>

      {/* 二代健保繳款書 */}
      <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
        <div className="mb-4 flex flex-col gap-3 nav:flex-row nav:items-center nav:justify-between">
          <h3 className="text-lg font-semibold text-neutral-dark">二代健保繳款書</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => setNhiConfirmOpen(true)}
              disabled={isLocked || totalNhi === 0 || docs.nhiFiles.length > 0 || docs.nhiPaid}
              title={
                totalNhi === 0
                  ? '本月無需繳納二代健保，無需產生繳款書'
                  : docs.nhiFiles.length > 0
                    ? '繳款書已存在，如需重新產生請先刪除'
                    : docs.nhiPaid
                      ? '已繳納，無需產生繳款書'
                      : undefined
              }
            >
              產生二代健保繳款書
            </Button>
            <Button
              size="sm"
              variant={docs.nhiPaid ? 'primary' : 'outline'}
              disabled={docs.nhiPaid || isLocked}
              onClick={() => setNhiProofOpen(true)}
            >
              {totalNhi === 0 ? '繳款狀態 - 不需繳納' : docs.nhiPaid ? '繳款狀態 - 已繳納' : '繳款狀態 - 未繳納'}
            </Button>
            {docs.nhiPaid && (
              <Button
                size="sm"
                variant={docs.nhiDeclared ? 'primary' : 'outline'}
                disabled={docs.nhiDeclared || isLocked}
                onClick={() => {
                  updatePayrollMonthDocs(year, month, { nhiDeclared: true });
                  refresh();
                }}
              >
                {DECLARE_LABEL[declareState]}
              </Button>
            )}
          </div>
        </div>

        {docs.nhiDeclared && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-brand-blue/20 bg-brand-blue/5 px-3 py-2 text-xs text-brand-blue">
            <Badge tone="info">已申報</Badge>
            二代健保申報已送出，如需查詢狀態請至健保署二代健保申報狀態查詢頁面。
          </div>
        )}

        <div className="flex flex-col gap-4">
          <FileListSection
            title="二代健保繳款書"
            files={docs.nhiFiles}
            emptyText={docs.nhiProofFiles.length > 0 ? '您已繳款完畢！' : '尚未產生二代健保繳款書'}
            onView={setPreviewFile}
            onDelete={file => setDeleteTarget({ kind: 'nhiFiles', file })}
          />
          <FileListSection title="二代健保繳款證明" files={docs.nhiProofFiles} emptyText="尚未上傳繳款證明" onView={setPreviewFile} />
        </div>
      </div>

      <TaxWithholdingConfirmDialog open={taxConfirmOpen} onClose={() => setTaxConfirmOpen(false)} onConfirm={handleGenerateWithholding} items={items} />
      <HealthInsuranceConfirmDialog open={nhiConfirmOpen} onClose={() => setNhiConfirmOpen(false)} onConfirm={handleGenerateNhi} items={items} />

      <PaymentProofDialog
        open={taxProofOpen}
        onClose={() => setTaxProofOpen(false)}
        title="扣繳繳稅證明上傳"
        onConfirm={(date, fileName) => {
          const file = createMockFile(fileName, [{ label: '繳款日期', value: date.toLocaleDateString('zh-TW') }]);
          updatePayrollMonthDocs(year, month, { withholdingPaid: true, withholdingProofFiles: [...docs.withholdingProofFiles, file] });
          refresh();
        }}
      />
      <PaymentProofDialog
        open={nhiProofOpen}
        onClose={() => setNhiProofOpen(false)}
        title="二代健保繳費證明上傳"
        onConfirm={(date, fileName) => {
          const file = createMockFile(fileName, [{ label: '繳款日期', value: date.toLocaleDateString('zh-TW') }]);
          updatePayrollMonthDocs(year, month, { nhiPaid: true, nhiProofFiles: [...docs.nhiProofFiles, file] });
          refresh();
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
