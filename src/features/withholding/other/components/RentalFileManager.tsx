'use client';

import { deleteRentalFile, getWithholdingDetail, uploadRentalFile } from '@/api/withholding';
import type { RentalFileDto, RentalRecordDto } from '@/api/types';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import TextInput from '@/components/ui/TextInput';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { Paperclip } from 'lucide-react';
import { useState } from 'react';
import { useLock } from '../../components/LockContext';
import FileListSection from '../../components/FileListSection';

interface RentalFileManagerProps {
  withholdingSummaryUuid: string;
  files: RentalFileDto[];
}

/**
 * 租金附件管理（POST／DELETE /ael/withholding/rental/files），僅編輯（既有紀錄）時可用——
 * 新增流程尚未有 withholdingSummaryUuid，故附件上傳一律等資料建立後才在此處進行，
 * 見 RentalForm 的「附件上傳」SectionCard 於新增模式改顯示提示文字。
 * 上傳／刪除端點回應皆固定 data:null，不含新檔案資訊，故每次動作後改重新查詢單筆明細取得最新附件清單。
 */
export default function RentalFileManager({ withholdingSummaryUuid, files: initialFiles }: RentalFileManagerProps) {
  const { isLocked } = useLock();
  const [files, setFiles] = useState<RentalFileDto[]>(initialFiles);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<RentalFileDto | null>(null);

  const reloadFiles = async () => {
    const detail = (await getWithholdingDetail(withholdingSummaryUuid, '51')) as RentalRecordDto;
    setFiles(detail.files);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      await uploadRentalFile({ withholdingSummaryUuid, fileName: file.name, password: password.trim() || undefined, file });
      setPassword('');
      await reloadFiles();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, '上傳附件失敗'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError('');
    setBusy(true);
    try {
      await deleteRentalFile(deleteTarget.uuid);
      setDeleteTarget(null);
      await reloadFiles();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, '刪除附件失敗'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Paperclip size={18} className="text-brand-blue" />
        <h3 className="text-lg font-semibold text-neutral-dark">附件上傳</h3>
      </div>
      {error && <p className="mb-3 text-sm text-semantic-error">{error}</p>}
      <div className="flex flex-col gap-3">
        <FileListSection title="租賃附件" files={files} emptyText="尚未上傳附件" onDelete={file => setDeleteTarget(file)} />
        <div className="flex flex-col gap-2 nav:flex-row nav:items-center">
          <TextInput placeholder="PDF 密碼（若無可留空）" value={password} onChange={e => setPassword(e.target.value)} />
          <label className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-neutral-blue-gray/50 bg-white px-4 text-center text-xs text-neutral-mid hover:border-brand-blue nav:w-48">
            {busy ? '上傳中...' : '點擊上傳附件'}
            <input type="file" className="hidden" disabled={isLocked || busy} onChange={handleFileChange} />
          </label>
        </div>
      </div>

      <ConfirmDialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="確定要刪除此附件嗎？" message="此動作無法復原。" />
    </div>
  );
}
