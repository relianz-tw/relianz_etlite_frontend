'use client';

import type { UploadedSettlementFile } from '../state/initializationReducer';
import { FileCheck2, Loader2, TriangleAlert, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface SettlementDropzoneProps {
  files: UploadedSettlementFile[];
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
  onRemove: (id: string) => void;
}

function validateFile(file: File): string | null {
  if (file.type !== 'application/pdf') return `「${file.name}」不是 PDF 檔案`;
  if (file.size > MAX_SIZE_BYTES) return `「${file.name}」超過 ${MAX_SIZE_MB}MB 上限`;
  return null;
}

/** 步驟二結算申報書多檔上傳區：可一次拖放多份 PDF，逐筆列出原檔名與辨識狀態 */
export function SettlementDropzone({ files, disabled, onFilesSelected, onRemove }: SettlementDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const acceptFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const valid: File[] = [];
    for (const file of Array.from(fileList)) {
      const err = validateFile(file);
      if (err) toast.error(err);
      else valid.push(file);
    }
    if (valid.length > 0) onFilesSelected(valid);
  };

  return (
    <div className='flex flex-col gap-3'>
      <button
        type='button'
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          acceptFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
          disabled
            ? 'cursor-not-allowed border-neutral-blue-gray/30 text-neutral-mid'
            : dragging
              ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
              : 'border-neutral-blue-gray/50 text-neutral-dark hover:border-brand-blue hover:text-brand-blue'
        }`}
      >
        <Upload size={22} strokeWidth={1.5} />
        <span className='text-sm font-medium'>請將 114 結算申報書檔案拉到這裡</span>
        <span className='text-xs text-neutral-dark/50'>或是上傳檔案（{MAX_SIZE_MB}MB 以內 - 限 PDF，可多選）</span>
      </button>
      <input
        ref={inputRef}
        type='file'
        accept='.pdf'
        multiple
        className='hidden'
        disabled={disabled}
        onChange={e => {
          acceptFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {files.length > 0 && (
        <ul className='flex flex-col gap-2'>
          {files.map(f => (
            <li key={f.id} className='flex items-center gap-2 rounded-md border border-neutral-blue-gray/30 bg-white px-3 py-2 text-sm'>
              {f.status === 'error' ? (
                <TriangleAlert size={16} className='shrink-0 text-semantic-error' />
              ) : f.status === 'done' ? (
                <FileCheck2 size={16} className='shrink-0 text-semantic-success' />
              ) : (
                <Loader2 size={16} className='shrink-0 animate-spin text-brand-blue' />
              )}
              <span className='min-w-0 flex-1 truncate text-neutral-dark'>{f.fileName}</span>
              {f.status === 'error' && f.errorMessage && <span className='shrink-0 text-xs text-semantic-error'>{f.errorMessage}</span>}
              <button
                type='button'
                onClick={() => onRemove(f.id)}
                aria-label='移除檔案'
                className='shrink-0 rounded-full p-1 text-neutral-mid hover:bg-surface-cream hover:text-neutral-dark'
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
