import { TriangleAlert } from 'lucide-react';

/** 欄位格式提醒（只提醒、不擋下一頁），顯示在輸入框下方；樣式沿用上傳辨識區的警示色 */
export function FieldWarning({ message }: { message: string }) {
  return (
    <p role='status' className='flex items-start gap-1 text-xs text-semantic-warm-dark'>
      <TriangleAlert size={13} className='mt-0.5 shrink-0' />
      <span>{message}</span>
    </p>
  );
}
