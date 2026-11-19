'use client';

import Button from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { isFillingStep, useInitialization } from '../state/InitializationContext';
import { formatDraftTime } from './draftTime';

/** 填寫步驟的草稿儲存狀態：上次儲存時間（雲端時間）＋立即儲存按鈕（每 30 秒另會自動儲存，見 InitializationContext） */
export function DraftSaveStatus() {
  const { state, savedAt, saveError, saveDraftNow } = useInitialization();
  if (!isFillingStep(state.currentStep)) return null;

  return (
    <div className='flex items-center justify-between gap-3 nav:mr-auto nav:justify-start'>
      {saveError ? (
        <span role='alert' className='text-xs text-semantic-error'>
          儲存失敗，請重試
        </span>
      ) : (
        <span className='text-xs text-neutral-mid'>{savedAt ? `上次儲存 ${formatDraftTime(savedAt)}` : ''}</span>
      )}
      <Button variant='ghost' size='sm' icon={Save} onClick={saveDraftNow} className='min-h-11 nav:min-h-0'>
        儲存
      </Button>
    </div>
  );
}
