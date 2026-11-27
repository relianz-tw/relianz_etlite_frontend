'use client';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useReference, type SourceFile } from '../reference/ReferenceContext';
import { useInitialization } from '../state/InitializationContext';
import { UploadedFilePreview } from './UploadedFilePreview';

interface SourceFileListProps {
  /** 接在最後一列按鈕右側的內容（新增檔案）；多檔時只出現一次，放最下面那一排 */
  actions?: ReactNode;
  /** 接在最後一張卡片內、分隔線下方的內容（文件備齊清單） */
  footer?: ReactNode;
}

/** 營所稅使用者上傳過的檔案：每份一列（預覽、刪除）；只有按刪除才會移除。帶入了哪幾份文件看 RequiredDocsChecklist */
export function SourceFileList({ actions, footer }: SourceFileListProps) {
  const { sourceFiles, removeSourceFile } = useReference();
  const { dispatch } = useInitialization();
  const [removing, setRemoving] = useState<SourceFile | null>(null);
  if (sourceFiles.length === 0) return null;

  const handleRemove = async (source: SourceFile) => {
    try {
      await removeSourceFile(source.id);
      // 原件沒了，它的來源記錄與欄位位置一併清掉（欄位值不動）
      dispatch({ type: 'FORGET_SOURCE', payload: { sourceId: source.id } });
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, '刪除失敗，請稍後再試'));
    }
  };

  return (
    <>
      <div className='flex flex-col gap-3'>
        {sourceFiles.map((source, index) => {
          const last = index === sourceFiles.length - 1;
          return (
            <UploadedFilePreview
              key={source.id}
              file={source.file}
              onRemove={() => setRemoving(source)}
              actions={last ? actions : undefined}
              footer={last ? footer : undefined}
            />
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
