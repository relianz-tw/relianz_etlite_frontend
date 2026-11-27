'use client';

import { useReference } from '../reference/ReferenceContext';
import { useInitialization } from '../state/InitializationContext';
import { FormIdentifyPanel } from './FormIdentifyPanel';
import { RequiredDocsChecklist } from './RequiredDocsChecklist';
import { SourceFileList } from './SourceFileList';
import { UploadedFilePreview } from './UploadedFilePreview';

interface SourceUploadSectionProps {
  /** 該頁的 key；401／403 用它把檔案掛在這一期上 */
  pageKey: string;
  /** 該頁必填時，上傳框文案不再寫「選填」 */
  required: boolean;
  /** 是否為 401／403 期別頁：檔案每期一份，不與營所稅共用 */
  vatPeriod: boolean;
}

/**
 * 申報書上傳區：上傳與已上傳檔案是同一塊。
 * 還沒有檔案時整行是虛線上傳框；已經有檔案時主角是檔案列，只留一顆「新增檔案」按鈕，
 * 最下面接這條路徑的文件備齊清單。
 */
export function SourceUploadSection({ pageKey, required, vatPeriod }: SourceUploadSectionProps) {
  const { vatUploads } = useInitialization();
  const { sourceFiles } = useReference();
  // 營所稅的上傳檔案整份共用（一份 PDF 含多張表），401／403 則看該期自己上傳的那一份
  const vatFile = vatPeriod ? vatUploads[pageKey] : undefined;
  const hasFile = vatPeriod ? !!vatFile : sourceFiles.length > 0;

  const identifyPanel = <FormIdentifyPanel required={required} vatPeriod={vatPeriod} pageKey={pageKey} variant={hasFile ? 'button' : 'dropzone'} />;

  // 已經有檔案時，「新增檔案／重新上傳」接在檔案列的「預覽」右側，文件備齊清單收在同一張卡片裡，不再各自佔一行
  if (vatPeriod && vatFile) {
    return <UploadedFilePreview file={vatFile} actions={identifyPanel} footer={<RequiredDocsChecklist />} />;
  }
  // 營所稅可以傳多份檔案，按鈕與清單掛在最後一張卡片上
  if (!vatPeriod && hasFile) {
    return <SourceFileList actions={identifyPanel} footer={<RequiredDocsChecklist />} />;
  }

  return (
    <div className='flex flex-col gap-3'>
      {identifyPanel}
      <RequiredDocsChecklist />
    </div>
  );
}
