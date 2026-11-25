'use client';

import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { CircleCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { RequiredDoc } from '../reports';
import { formatDraftDateTime } from './draftTime';

interface ImportOverwriteDialogProps {
  open: boolean;
  /** 這條開帳路徑需要的所有文件（含這次沒辨識到的），分必填／選填兩區呈現 */
  docs: RequiredDoc[];
  /** 這次檔案裡辨識到、可以帶入的文件 key；只有這些可以勾選，預設全勾 */
  importingKeys: string[];
  /** 取消匯入：資料完全不動 */
  onCancel: () => void;
  /** 只匯入這些 key 對應的文件（整份覆蓋） */
  onConfirm: (keys: string[]) => void;
}

function DocRow({ doc, checked, selectable, onToggle }: { doc: RequiredDoc; checked: boolean; selectable: boolean; onToggle: () => void }) {
  return (
    <li className='flex items-center gap-2.5 py-1'>
      <Checkbox shape='circle' checked={checked} disabled={!selectable} onChange={onToggle} aria-label={`匯入${doc.label}`} />
      <span className={cn('min-w-0 flex-1 truncate text-sm', selectable ? 'text-neutral-dark' : 'text-neutral-mid')}>{doc.label}</span>
      {doc.status !== 'empty' && (
        <span className='flex shrink-0 items-center gap-1 text-xs text-semantic-success'>
          <CircleCheck size={14} />
          {/* 手動填的沒有匯入時間，只標「已有資料」 */}
          {doc.importedAt ? formatDraftDateTime(doc.importedAt) : '已有資料'}
        </span>
      )}
    </li>
  );
}

/**
 * 上傳辨識的結果會蓋到已有資料時，先讓使用者逐份決定要匯入哪些文件（見 DESIGN.md「匯入覆蓋確認」）。
 * 清單是整條開帳路徑需要的文件，這次沒辨識到的也列出來但不能勾，讓使用者一眼看出還缺哪幾份。
 */
export function ImportOverwriteDialog({ open, docs, importingKeys, onCancel, onConfirm }: ImportOverwriteDialogProps) {
  const [selected, setSelected] = useState<string[]>(importingKeys);

  // 每次開窗都回到「這次辨識到的全勾」（開窗期間 importingKeys 的參照不會變，不會洗掉使用者的勾選）
  useEffect(() => {
    if (open) setSelected(importingKeys);
  }, [open, importingKeys]);

  const importingSet = new Set(importingKeys);
  const importingNames = docs.filter(d => importingSet.has(d.key)).map(d => d.label);
  const sections = [
    { title: '必填', items: docs.filter(d => d.required) },
    { title: '選填', items: docs.filter(d => !d.required) },
  ].filter(section => section.items.length > 0);

  const toggle = (key: string) => setSelected(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

  return (
    <Modal open={open} onClose={onCancel} title='覆蓋原先資料' widthClassName='max-w-[560px]'>
      <p className='text-sm leading-relaxed text-neutral-dark'>
        此次匯入資料內容有包含：{importingNames.join('、')}，如有重新匯入會被系統覆蓋。
      </p>
      <div className='mt-4 flex max-h-[320px] flex-col gap-3 overflow-y-auto rounded-lg bg-surface-cream px-3 py-2.5'>
        {sections.map(section => (
          <div key={section.title} className='flex flex-col gap-0.5'>
            <span className='text-xs font-medium text-neutral-mid'>{section.title}</span>
            <ul className='flex flex-col'>
              {section.items.map(doc => (
                <DocRow
                  key={doc.key}
                  doc={doc}
                  checked={selected.includes(doc.key)}
                  selectable={importingSet.has(doc.key)}
                  onToggle={() => toggle(doc.key)}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className='mt-6 flex flex-col-reverse gap-3 nav:flex-row nav:justify-end'>
        <Button variant='ghost' onClick={onCancel}>
          取消
        </Button>
        <Button variant='outline' disabled={selected.length === 0} onClick={() => onConfirm(selected)}>
          只匯入勾選項目
        </Button>
        <Button onClick={() => onConfirm(importingKeys)}>全部匯入</Button>
      </div>
    </Modal>
  );
}
