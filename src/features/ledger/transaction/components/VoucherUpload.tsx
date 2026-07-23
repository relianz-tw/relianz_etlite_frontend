'use client';

import Button from '@/components/ui/Button';
import { ImagePlus, Star, Upload } from 'lucide-react';
import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { TransactionMode } from '../types';

interface VoucherUploadProps {
  mode: TransactionMode;
  fileName: string | null;
  previewUrl: string | null;
  onFileChange: (fileName: string, previewUrl: string) => void;
}

export default function VoucherUpload({ mode, fileName, previewUrl, onFileChange }: VoucherUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 純本地預覽，不上傳任何地方
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onFileChange(file.name, reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex min-h-[480px] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed border-neutral-blue-gray/50 bg-white text-neutral-mid transition-colors hover:border-brand-blue hover:text-brand-blue"
      >
        {previewUrl ? (
          // object-contain：完整顯示憑證內容，不裁切任何細節（依原圖比例縮放，非填滿裁切）
          // eslint-disable-next-line @next/next/no-img-element -- 本地選檔預覽，非遠端圖片，不需 next/image 最佳化
          <img src={previewUrl} alt="憑證預覽" className="h-full w-full object-contain p-2" />
        ) : (
          <>
            <ImagePlus size={28} strokeWidth={1.5} />
            <span className="text-sm">點擊上傳憑證照片</span>
          </>
        )}
      </button>

      {mode === 'edit' && (
        <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-4">
          <h3 className="mb-1 text-sm font-semibold text-neutral-dark">附件</h3>
          <p className="mb-3 text-xs leading-relaxed text-neutral-mid">
            目前檔案為主要憑證，若需更新請按「重新上傳」按鈕替換檔案。
          </p>
          {fileName && (
            <div className="mb-3 flex items-center gap-2 rounded-md bg-surface-cream px-3 py-2 text-sm text-neutral-dark">
              <Star size={14} className="shrink-0 text-brand-tan" />
              <span className="truncate">{fileName}</span>
            </div>
          )}
          <Button variant="outline" size="sm" className="w-full" icon={Upload} onClick={() => inputRef.current?.click()}>
            重新上傳
          </Button>
        </div>
      )}
    </div>
  );
}
