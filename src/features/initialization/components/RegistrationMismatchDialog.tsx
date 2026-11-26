'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

/** 兩邊各自的統一編號與公司名稱；沒有值的顯示為 — */
export interface RegistrationMismatch {
  system: { taxId: string; companyName: string };
  document: { taxId: string; companyName: string };
}

interface RegistrationMismatchDialogProps {
  /** null 代表沒有不吻合，不顯示 */
  mismatch: RegistrationMismatch | null;
  /** useDocument 為真代表改用文件上的資料，否則保留目前資料 */
  onResolve: (useDocument: boolean) => void;
}

function Side({ title, taxId, companyName }: { title: string; taxId: string; companyName: string }) {
  return (
    <div className='flex min-w-0 flex-1 flex-col gap-1'>
      <span className='text-xs font-medium text-neutral-mid'>{title}</span>
      <span className='text-sm text-neutral-dark'>統一編號　{taxId || '—'}</span>
      <span className='break-words text-sm text-neutral-dark'>公司名稱　{companyName || '—'}</span>
    </div>
  );
}

/**
 * 登記事項表辨識出的公司與系統登記（付款環節取得）的不一致時，讓使用者決定以哪一份為準。
 * 只會在公司那條路徑出現——商號的文件裡沒有登記事項表，沒得辨識。
 * 辨識結果本身一律留在摘要卡上（那是文件的內容），這裡決定的是「要不要改寫系統這邊的公司資料」。
 */
export function RegistrationMismatchDialog({ mismatch, onResolve }: RegistrationMismatchDialogProps) {
  return (
    <Modal open={mismatch !== null} onClose={() => onResolve(false)} title='資料不吻合' widthClassName='max-w-[520px]'>
      <p className='text-sm leading-relaxed text-neutral-dark'>目前上傳資料與系統登記資料不吻合，請選擇要保留哪一份。</p>
      <div className='mt-3 flex flex-col gap-3 rounded-lg bg-surface-cream px-3 py-2.5 nav:flex-row nav:gap-6'>
        <Side title='系統登記資料' taxId={mismatch?.system.taxId ?? ''} companyName={mismatch?.system.companyName ?? ''} />
        <Side title='這份文件辨識結果' taxId={mismatch?.document.taxId ?? ''} companyName={mismatch?.document.companyName ?? ''} />
      </div>
      <div className='mt-6 flex flex-col-reverse gap-3 nav:flex-row nav:justify-end'>
        <Button variant='outline' onClick={() => onResolve(false)}>
          保留目前資料
        </Button>
        <Button onClick={() => onResolve(true)}>改用文件上的資料</Button>
      </div>
    </Modal>
  );
}
