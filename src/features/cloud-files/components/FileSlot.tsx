'use client';

import Button from '@/components/ui/Button';
import { Download, Eye, FileText, Upload } from 'lucide-react';
import { useRef } from 'react';
import type { CloudFile } from '../mockCloudFiles';

const IMG_BASE_URL = process.env.NEXT_PUBLIC_IMG_URL ?? '';

function fileHref(url: string): string {
  return url.startsWith('http') ? url : `${IMG_BASE_URL}/${url}`;
}

interface FileSlotProps {
  title: string;
  file?: CloudFile;
  onUpload: (file: File) => void;
}

/** 單一文件類型的檔案格：已上傳顯示檔案列，未上傳顯示虛線上傳格（見 DESIGN.md File Slot） */
export default function FileSlot({ title, file, onUpload }: FileSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) onUpload(picked);
    // 清空 value，讓同一個檔案可以再次選取
    e.target.value = '';
  };

  const input = <input ref={inputRef} type="file" accept="application/pdf,image/*" className="sr-only" onChange={handleChange} />;

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium text-neutral-mid">{title}</h4>
      {file ? (
        <div className="flex flex-col gap-2 rounded-md bg-white px-3 py-2 hover:bg-surface-cream nav:flex-row nav:items-center nav:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <FileText size={20} className="shrink-0 text-brand-blue" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-dark">{file.fileName}</p>
              <p className="text-xs text-neutral-mid">上傳於 {file.uploadTime}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {file.url ? (
              <>
                <a href={fileHref(file.url)} target="_blank" rel="noopener noreferrer" className="inline-flex">
                  <Button variant="outline" size="sm" icon={Eye} tabIndex={-1}>
                    預覽
                  </Button>
                </a>
                <a href={fileHref(file.url)} download target="_blank" rel="noopener noreferrer" className="inline-flex">
                  <Button variant="outline" size="sm" icon={Download} tabIndex={-1}>
                    下載
                  </Button>
                </a>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" icon={Eye} disabled title="假資料無實體檔案">
                  預覽
                </Button>
                <Button variant="outline" size="sm" icon={Download} disabled title="假資料無實體檔案">
                  下載
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" icon={Upload} onClick={() => inputRef.current?.click()}>
              重新上傳
            </Button>
            {input}
          </div>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-neutral-blue-gray/40 bg-white py-4 text-sm text-neutral-mid transition-colors focus-within:ring-2 focus-within:ring-brand-blue/20 hover:border-brand-blue hover:text-brand-blue">
          <Upload size={16} />
          尚未上傳，點擊上傳檔案
          {input}
        </label>
      )}
    </div>
  );
}
