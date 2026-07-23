'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { FileCheck2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

interface ImportInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
}

const IMPORT_SOURCES = [
  { value: 'mof', label: '財政部電子發票整合服務平台' },
  { value: 'file', label: '上傳檔案' },
];

export default function ImportInvoiceDialog({ open, onClose }: ImportInvoiceDialogProps) {
  const [source, setSource] = useState(IMPORT_SOURCES[0].value);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleClose = () => {
    setFileName(null);
    setImporting(false);
    onClose();
  };

  const handleImport = () => {
    // 純前端模擬匯入流程，不接後端
    setImporting(true);
    setTimeout(handleClose, 600);
  };

  return (
    <Modal open={open} onClose={handleClose} title="匯入電子發票" widthClassName="max-w-[420px]">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-mid">匯入方式</label>
          <Select value={source} onValueChange={setSource}>
            {IMPORT_SOURCES.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>

        {source === 'file' && (
          <div>
            <input ref={inputRef} type="file" accept=".csv,.xml,.xlsx" className="hidden" onChange={handleFile} />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-blue-gray/50 bg-white px-4 py-8 text-neutral-mid transition-colors hover:border-brand-blue hover:text-brand-blue"
            >
              {fileName ? (
                <>
                  <FileCheck2 size={24} className="text-semantic-success" strokeWidth={1.5} />
                  <span className="text-sm text-neutral-dark">{fileName}</span>
                </>
              ) : (
                <>
                  <Upload size={24} strokeWidth={1.5} />
                  <span className="text-sm">點擊選擇發票檔案</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="danger" onClick={handleClose}>
          取消
        </Button>
        <Button
          variant="primary"
          icon={Upload}
          onClick={handleImport}
          disabled={importing || (source === 'file' && !fileName)}
        >
          {importing ? '匯入中…' : '開始匯入'}
        </Button>
      </div>
    </Modal>
  );
}
