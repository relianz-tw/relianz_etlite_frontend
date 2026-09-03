'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Upload, X } from 'lucide-react';
import { useState } from 'react';

interface LaborImportDialogProps {
  open: boolean;
  onClose: () => void;
  disabled?: boolean;
}

interface MockImportResult {
  successCount: number;
  failedCount: number;
  failedDetails: { row: number; name: string; reason: string }[];
}

/** 批次匯入勞報單彈窗：無 Excel 解析套件，選檔後回傳固定示意結果，供操作流程展示用 */
export default function LaborImportDialog({ open, onClose, disabled }: LaborImportDialogProps) {
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<MockImportResult | null>(null);

  if (!open) return null;

  const handleClose = () => {
    setFileName('');
    setResult(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleImport = () => {
    setImporting(true);
    // 無 Excel 解析套件，以固定示意結果模擬匯入流程
    setTimeout(() => {
      setResult({
        successCount: 2,
        failedCount: 1,
        failedDetails: [{ row: 3, name: '（範例）王小華', reason: '身分證字號格式錯誤' }],
      });
      setImporting(false);
    }, 600);
  };

  return (
    <Modal open onClose={handleClose} title="批次匯入勞報單" widthClassName="max-w-[480px]">
      {!result ? (
        <div className="flex flex-col gap-4">
          <p className="text-xs leading-relaxed text-neutral-mid">
            匯入檔案格式必須是 Excel (.xlsx) 檔案。同服務日期＋同給付日期＋同身分證字號＋同專案名稱只能一筆；系統匯入完畢後請記得複製簽署連結並提供給對方做簽署。
          </p>
          <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-neutral-blue-gray/50 bg-white text-center hover:border-brand-blue">
            <Upload size={22} className="text-neutral-mid" />
            <span className="text-sm text-neutral-mid">{fileName || '瀏覽檔案'}</span>
            <input type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} disabled={disabled} />
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button onClick={handleImport} disabled={!fileName || importing || disabled}>
              {importing ? '匯入檔案中，請稍候' : '確認匯入'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="font-semibold text-neutral-dark">匯入完成！</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-semantic-success/10 p-3 text-center">
              <p className="text-xs text-neutral-mid">成功筆數</p>
              <p className="text-xl font-semibold text-semantic-success">{result.successCount}</p>
            </div>
            <div className="rounded-md bg-semantic-error/10 p-3 text-center">
              <p className="text-xs text-neutral-mid">失敗筆數</p>
              <p className="text-xl font-semibold text-semantic-error">{result.failedCount}</p>
            </div>
          </div>
          {result.failedDetails.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm font-medium text-neutral-dark">失敗詳情：</p>
              <ul className="flex flex-col gap-1.5">
                {result.failedDetails.map(d => (
                  <li key={d.row} className="rounded-md bg-surface-cream p-2 text-xs">
                    <span className="mr-2 rounded-sm bg-semantic-error/10 px-1.5 py-0.5 text-semantic-error">第 {d.row} 列</span>
                    {d.name}：<span className="text-semantic-error">{d.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" icon={X} onClick={handleClose}>
              關閉
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
