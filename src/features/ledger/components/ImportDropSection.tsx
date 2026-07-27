'use client';

import Button from '@/components/ui/Button';
import { FileCheck2, Search } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, ReactNode } from 'react';

interface ImportDropSectionProps {
  title: string;
  hint?: ReactNode;
  accept?: string;
  onCancel: () => void;
}

export default function ImportDropSection({ title, hint, accept = '.xlsx', onCancel }: ImportDropSectionProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (file: File | undefined) => {
    if (!file) return;
    // 僅接受符合 accept 副檔名的檔案（純前端檢查，不接後端）
    const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!accept.split(',').map(a => a.trim().toLowerCase()).includes(ext)) return;
    setFileName(file.name);
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => acceptFile(e.target.files?.[0]);

  const handleDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragActive(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleImport = () => {
    // 純前端模擬匯入流程，不接後端
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setFileName(null);
    }, 600);
  };

  return (
    <div>
      <h3 className="font-notoSerif text-base font-semibold text-neutral-dark">{title}</h3>
      {hint && <p className="mt-1.5 text-sm leading-relaxed text-neutral-mid">{hint}</p>}

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-3 flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-white px-4 py-8 transition-colors ${
          dragActive ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-neutral-blue-gray/50 text-neutral-dark hover:border-brand-blue hover:text-brand-blue'
        }`}
      >
        {fileName ? (
          <>
            <FileCheck2 size={24} className="text-semantic-success" strokeWidth={1.5} />
            <span className="text-sm text-neutral-dark">{fileName}</span>
          </>
        ) : (
          <>
            <Search size={24} strokeWidth={1.5} />
            <span className="text-sm font-semibold">瀏覽檔案</span>
          </>
        )}
      </button>

      <div className="mt-4 flex gap-4">
        <Button variant="ghost" onClick={onCancel}>
          取消
        </Button>
        <Button variant="primary" className="flex-1" onClick={handleImport} disabled={importing || !fileName}>
          {importing ? '匯入中…' : '確認匯入'}
        </Button>
      </div>
    </div>
  );
}
