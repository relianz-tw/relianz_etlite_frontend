'use client';

import { ImagePlus, RotateCw, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SignImageUploadProps {
  title: string;
  /** 選檔／刪除時回傳實際 File 供 signLabour 上傳；旋轉僅為預覽用途，不會套用到實際上傳的檔案 */
  onFileChange: (file: File | null) => void;
}

/** 簽署頁的證件照片上傳卡：本機預覽（URL.createObjectURL），實際檔案由呼叫端收集後透過 POST /ael/labour/sign 上傳 */
export default function SignImageUpload({ title, onFileChange }: SignImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setRotation(0);
    onFileChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onFileChange(null);
  };

  return (
    <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
      <p className="mb-2 text-sm font-semibold text-neutral-dark">{title}</p>
      {preview ? (
        <div className="flex flex-col gap-2">
          <div className="flex h-56 items-center justify-center overflow-hidden rounded-md border border-neutral-blue-gray/30 bg-surface-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={title} style={{ transform: `rotate(${rotation}deg)` }} className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-blue-gray/50 py-1.5 text-xs text-neutral-mid hover:bg-surface-cream"
            >
              <RotateCw size={13} />
              旋轉照片
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-blue-gray/50 py-1.5 text-xs text-semantic-error hover:bg-semantic-error/5"
            >
              <Trash2 size={13} />
              刪除照片
            </button>
          </div>
        </div>
      ) : (
        <label className="flex h-56 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-neutral-blue-gray/50 hover:border-brand-blue">
          <ImagePlus size={22} className="text-neutral-mid" />
          <span className="text-xs text-neutral-mid">瀏覽照片</span>
          <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
}
