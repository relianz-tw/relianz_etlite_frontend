'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Eye, FileCheck2, Trash2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadedFilePreviewProps {
  file: File;
  /** 有傳才顯示刪除按鈕 */
  onRemove?: () => void;
  /** 接在「預覽」右側的動作（如 401／403 的「重新上傳」） */
  actions?: ReactNode;
  /** 卡片內、檔案列下方以分隔線隔開的內容（如文件備齊清單） */
  footer?: ReactNode;
}

/** 已上傳檔案列＋預覽彈窗：讓使用者確認自己傳了什麼（PDF 用 iframe，圖片直接顯示） */
export function UploadedFilePreview({ file, onRemove, actions, footer }: UploadedFilePreviewProps) {
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
      <div className='rounded-lg border border-neutral-blue-gray/30 bg-white'>
        <div className='flex items-center gap-3 px-4 py-3'>
          <FileCheck2 size={20} className='shrink-0 text-semantic-success' />
          <div className='flex min-w-0 flex-1 flex-col'>
            <span className='truncate text-sm font-medium text-neutral-dark'>{file.name}</span>
            <span className='text-xs text-neutral-mid'>{formatFileSize(file.size)}</span>
          </div>
          <Button variant='outline' size='sm' icon={Eye} className='min-h-11 shrink-0 nav:min-h-0' onClick={() => setOpen(true)}>
            預覽
          </Button>
          {onRemove && (
            <Button variant='ghost' size='sm' icon={Trash2} className='min-h-11 shrink-0 nav:min-h-0' onClick={onRemove}>
              刪除
            </Button>
          )}
          {actions}
        </div>
        {footer && <div className='border-t border-neutral-blue-gray/30 px-4 py-1'>{footer}</div>}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={file.name} widthClassName='max-w-[960px]'>
        {url &&
          (isPdf ? (
            <>
              <iframe src={url} title={file.name} className='h-[70vh] w-full rounded-md' />
              {/* iOS Safari 的 iframe 常只顯示 PDF 第一頁且不能捲動，另提供在新分頁開啟 */}
              <a href={url} target='_blank' rel='noreferrer' className='mt-2 inline-flex min-h-11 items-center text-sm font-medium text-brand-blue hover:underline nav:hidden'>
                在新分頁開啟完整檔案
              </a>
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- 來源是本地 object URL，next/image 無法最佳化
            <img src={url} alt={file.name} className='mx-auto max-h-[70vh] object-contain' />
          ))}
      </Modal>
    </>
  );
}
