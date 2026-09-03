'use client';

import Modal from '@/components/ui/Modal';
import { useRouter } from 'next/navigation';
import { ADD_CATEGORY_OPTIONS } from '../data';
import type { CategoryCode } from '../types';

interface AddCategoryDialogProps {
  open: boolean;
  onClose: () => void;
}

/** 新增扣繳資料前先選擇類別；執行業務/稿費合併為一顆按鈕，進表單後由「所得類別」欄位切換 */
export default function AddCategoryDialog({ open, onClose }: AddCategoryDialogProps) {
  const router = useRouter();

  if (!open) return null;

  const handlePick = (code: CategoryCode) => {
    onClose();
    router.push(`/withholding/other/new?ic=${code}`);
  };

  return (
    <Modal open onClose={onClose} title="選擇扣繳類別" widthClassName="max-w-[480px]">
      <p className="mb-4 text-sm text-neutral-mid">請選擇要新增的扣繳資料類別</p>
      <div className="grid grid-cols-1 gap-2 nav:grid-cols-2">
        {ADD_CATEGORY_OPTIONS.map(option => (
          <button
            key={option.code}
            type="button"
            onClick={() => handlePick(option.code)}
            className="rounded-md border border-neutral-blue-gray/40 bg-white px-4 py-3 text-left text-sm font-semibold text-neutral-dark transition-colors hover:border-brand-blue hover:bg-brand-blue/5"
          >
            {option.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
