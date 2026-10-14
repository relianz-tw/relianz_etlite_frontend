'use client';

import Modal from '@/components/ui/Modal';

interface SettlementExampleDialogProps {
  open: boolean;
  onClose: () => void;
}

/** 步驟二「查看範例」彈窗：說明可上傳辨識的文件範圍，以及上傳為選填 */
export function SettlementExampleDialog({ open, onClose }: SettlementExampleDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title='上傳範例說明'>
      <div className='flex flex-col gap-3 text-sm text-neutral-dark'>
        <p>每一頁表單都可以選擇是否上傳文件辨識，系統支援辨識以下文件：</p>
        <ul className='list-inside list-disc space-y-1 text-neutral-mid'>
          <li>營利事業所得稅結算申報書（封面、各表與檢附表，可在同一份 PDF）</li>
          <li>營業人銷售額與稅額申報書(401)、(403)</li>
        </ul>
        <p className='text-xs text-neutral-mid'>上傳一份含多張表的 PDF，系統會一併帶入所有辨識到的表單；辨識不到的欄位可在該頁手動輸入。</p>
      </div>
    </Modal>
  );
}
