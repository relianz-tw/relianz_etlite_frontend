'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDraftDateTime } from './draftTime';

interface DraftConflictDialogProps {
  open: boolean;
  /** 雲端草稿的儲存時間（ISO 8601），說明是哪個時間點的版本 */
  serverSavedAt: string;
  /** 放棄本機內容，改載入雲端最新版 */
  onLoadServer: () => void;
  /** 保留本機內容，覆蓋雲端草稿 */
  onOverwrite: () => void;
  /** 先關掉視窗不選；之後下一次儲存若還是衝突會再跳出來 */
  onClose: () => void;
}

/** 草稿版本衝突：另一個裝置（或另一個分頁）已更新雲端草稿，讓使用者選用哪一邊（見 DESIGN.md「草稿儲存狀態」） */
export function DraftConflictDialog({ open, serverSavedAt, onLoadServer, onOverwrite, onClose }: DraftConflictDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title='資料同步' widthClassName='max-w-[480px]'>
      <p className='text-sm leading-relaxed text-neutral-dark'>
        另一部裝置在 {formatDraftDateTime(serverSavedAt)} 有更新過草稿，請選擇要使用哪一份。
      </p>
      <div className='mt-6 flex flex-col-reverse gap-3 nav:flex-row nav:justify-end'>
        <Button variant='outline' onClick={onOverwrite}>
          保留目前版本
        </Button>
        {/* 預設選項：以雲端最新版為準，不會留下兩份互相覆蓋的草稿 */}
        <Button onClick={onLoadServer}>使用最新版本</Button>
      </div>
    </Modal>
  );
}
