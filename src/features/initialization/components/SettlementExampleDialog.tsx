'use client';

import Modal from '@/components/ui/Modal';

interface SettlementExampleDialogProps {
  open: boolean;
  onClose: () => void;
}

const REQUIRED_DOCS = [
  '00 封面',
  '01 損益及稅額計算表',
  '03 資產負債表',
  '08 年度各類給付扣繳、股利憑單金額與申報金額調節表',
  '09 營利事業投資人明細及分配盈餘表',
  '財產目錄（如有）',
];

/** 步驟二「查看範例」彈窗：說明完整開帳所需的結算申報書頁次組成 */
export function SettlementExampleDialog({ open, onClose }: SettlementExampleDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title='上傳範例說明'>
      <div className='flex flex-col gap-3 text-sm text-neutral-dark'>
        <p>您可以提供多個檔案，或是一份完整的結算申報書。完整的開帳會需要以下頁次：</p>
        <ul className='list-inside list-disc space-y-1 text-neutral-mid'>
          {REQUIRED_DOCS.map(doc => (
            <li key={doc}>{doc}</li>
          ))}
        </ul>
        <p className='text-xs text-neutral-mid'>如上傳多個檔案，請分別列出並保留原檔案名稱，系統會自動辨識並帶入下一步的各份報表。</p>
      </div>
    </Modal>
  );
}
