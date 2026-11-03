'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Eye, FileCheck2 } from 'lucide-react';
import { useEffect, useState } from 'react';

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 已上傳檔案列＋預覽彈窗：讓使用者確認自己傳了什麼（PDF 用 iframe，圖片直接顯示） */
export function UploadedFilePreview({ file }: { file: File }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');

  // 只在開啟預覽時建立 object URL，關閉或換檔時釋放
  useEffect(() => {
    if (!open) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
      setUrl('');
    };
  }, [open, file]);

  const isPdf = file.type === 'application/pdf';

  return (
    <>
      <div className='flex items-center gap-3 rounded-lg border border-neutral-blue-gray/30 bg-white px-4 py-3'>
        <FileCheck2 size={20} className='shrink-0 text-semantic-success' />
        <div className='flex min-w-0 flex-1 flex-col'>
          <span className='truncate text-sm font-medium text-neutral-dark'>{file.name}</span>
          <span className='text-xs text-neutral-mid'>{formatFileSize(file.size)}</span>
        </div>
        <Button variant='outline' size='sm' icon={Eye} className='shrink-0' onClick={() => setOpen(true)}>
          預覽
        </Button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={file.name} widthClassName='max-w-[960px]'>
        {url &&
          (isPdf ? (
            <iframe src={url} title={file.name} className='h-[70vh] w-full rounded-md' />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- 來源是本地 object URL，next/image 無法最佳化
            <img src={url} alt={file.name} className='mx-auto max-h-[70vh] object-contain' />
          ))}
      </Modal>
    </>
  );
}
