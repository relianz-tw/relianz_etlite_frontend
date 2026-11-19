'use client';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { useReference } from '../reference/ReferenceContext';
import type { SourceFile } from '../reference/referenceStorage';
import { UploadedFilePreview } from './UploadedFilePreview';

/** 營所稅使用者上傳過的檔案：每份一列（預覽、刪除），底下一直顯示這份檔案帶入了哪些文件；只有按刪除才會移除 */
export function SourceFileList() {
  const { sourceFiles, removeSourceFile } = useReference();
  const [removing, setRemoving] = useState<SourceFile | null>(null);
  if (sourceFiles.length === 0) return null;

  return (
    <>
      <div className='flex flex-col gap-3'>
        {sourceFiles.map(source => (
          <div key={source.id} className='flex flex-col gap-1.5'>
            <UploadedFilePreview file={source.file} onRemove={() => setRemoving(source)} />
            {source.appliedLabels.length > 0 && (
              <p className='flex items-start gap-1.5 text-xs text-semantic-success'>
                <CircleCheck size={14} className='mt-0.5 shrink-0' />
                <span>已帶入：{source.appliedLabels.join('、')}</span>
              </p>
            )}
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && removeSourceFile(removing.id)}
        title='刪除上傳檔案'
        message={`確定要刪除「${removing?.file.name ?? ''}」嗎？刪除後無法復原，已帶入表單的資料不會被清掉。`}
      />
    </>
  );
}
