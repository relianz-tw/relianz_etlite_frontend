'use client';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useReference, type SourceFile } from '../reference/ReferenceContext';
import { useInitialization } from '../state/InitializationContext';
import { UploadedFilePreview } from './UploadedFilePreview';

/** 營所稅使用者上傳過的檔案：每份一列（預覽、刪除），底下一直顯示這份檔案帶入了哪些文件；只有按刪除才會移除 */
export function SourceFileList() {
  const { sourceFiles, removeSourceFile } = useReference();
  const { state, dispatch } = useInitialization();
  const [removing, setRemoving] = useState<SourceFile | null>(null);
  if (sourceFiles.length === 0) return null;

  const handleRemove = async (source: SourceFile) => {
    try {
      await removeSourceFile(source.id);
      // 原件沒了，它的「已帶入」說明與欄位位置一併清掉（欄位值不動）
      dispatch({ type: 'FORGET_SOURCE', payload: { sourceId: source.id } });
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, '刪除失敗，請稍後再試'));
    }
  };

  return (
    <>
      <div className='flex flex-col gap-3'>
        {sourceFiles.map(source => {
          const labels = state.sourceLabels[source.id] ?? [];
          return (
            <div key={source.id} className='flex flex-col gap-1.5'>
              <UploadedFilePreview file={source.file} onRemove={() => setRemoving(source)} />
              {labels.length > 0 && (
                <p className='flex items-start gap-1.5 text-xs text-semantic-success'>
                  <CircleCheck size={14} className='mt-0.5 shrink-0' />
                  <span>已帶入：{labels.join('、')}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && handleRemove(removing)}
        title='刪除上傳檔案'
        message={`確定要刪除「${removing?.file.name ?? ''}」嗎？刪除後無法復原，已帶入表單的資料不會被清掉。`}
      />
    </>
  );
}
