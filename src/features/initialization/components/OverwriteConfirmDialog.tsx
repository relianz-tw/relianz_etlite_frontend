'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

/** 辨識結果與目前欄位內容不同的一筆：欄位名稱、現有值、辨識值 */
export interface OverwriteConflict {
  fieldName: string;
  current: string | number;
  next: string | number;
}

interface OverwriteConfirmDialogProps {
  open: boolean;
  conflicts: OverwriteConflict[];
  /** 用辨識結果覆蓋有衝突的欄位 */
  onOverwrite: () => void;
  /** 保留現有資料，只填入目前空白的欄位（關閉視窗也視為保留，最安全） */
  onKeep: () => void;
}

/** 最多列出幾筆範例，其餘只顯示數量 */
const MAX_LISTED = 5;

function show(value: string | number): string {
  const text = String(value);
  return text.length > 20 ? `${text.slice(0, 20)}…` : text;
}

/** 新辨識結果會蓋到已有資料的欄位時，先問使用者要不要覆蓋（見 DESIGN.md「辨識結果覆蓋確認」） */
export function OverwriteConfirmDialog({ open, conflicts, onOverwrite, onKeep }: OverwriteConfirmDialogProps) {
  const listed = conflicts.slice(0, MAX_LISTED);
  const rest = conflicts.length - listed.length;
  return (
    <Modal open={open} onClose={onKeep} title='要覆蓋現有資料嗎？' widthClassName='max-w-[520px]'>
      <p className='text-sm leading-relaxed text-neutral-dark'>
        這份檔案辨識到的資料中，有 {conflicts.length} 個欄位目前已經有內容，且和辨識結果不同。選「保留現有資料」只會填入目前空白的欄位。
      </p>
      <ul className='mt-3 flex flex-col gap-1.5 rounded-lg bg-surface-cream px-3 py-2.5 text-xs text-neutral-dark'>
        {listed.map((item, index) => (
          <li key={index} className='flex flex-wrap items-baseline gap-x-2'>
            <span className='font-medium'>{item.fieldName}</span>
            <span className='text-neutral-mid'>
              {show(item.current)} → {show(item.next)}
            </span>
          </li>
        ))}
        {rest > 0 && <li className='text-neutral-mid'>另外還有 {rest} 個欄位</li>}
      </ul>
      <div className='mt-6 flex flex-col-reverse gap-3 nav:flex-row nav:justify-end'>
        <Button variant='outline' onClick={onKeep}>
          保留現有資料
        </Button>
        <Button onClick={onOverwrite}>全部覆蓋</Button>
      </div>
    </Modal>
  );
}
