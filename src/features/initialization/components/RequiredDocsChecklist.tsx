'use client';

import { Circle, CircleCheck, ChevronDown, PencilLine } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useReference } from '../reference/ReferenceContext';
import { useInitialization } from '../state/InitializationContext';
import { buildRequiredDocs, type RequiredDocStatus } from '../reports';

const STATUS_STYLE: Record<RequiredDocStatus, { icon: typeof Circle; iconClass: string; textClass: string }> = {
  identified: { icon: CircleCheck, iconClass: 'text-semantic-success', textClass: 'text-neutral-dark' },
  manual: { icon: PencilLine, iconClass: 'text-brand-blue', textClass: 'text-neutral-dark' },
  empty: { icon: Circle, iconClass: 'text-neutral-blue-gray', textClass: 'text-neutral-mid' },
};

/**
 * 這間公司這條開帳路徑需要的文件清單（封面＋步驟 4 逐頁），可展開查看每一份的狀態：
 * 辨識帶入打勾、自己手動填的用筆的記號、還沒有資料的留灰色。
 * 清單與狀態由 buildRequiredDocs 推導（與匯入覆蓋確認視窗同一份來源）。
 */
export function RequiredDocsChecklist() {
  const { state, vatUploads } = useInitialization();
  const { sourceFiles } = useReference();
  const [open, setOpen] = useState(false);

  const docs = buildRequiredDocs(state, { vatUploads, sourceFiles });
  const readyCount = docs.filter(d => d.status !== 'empty').length;

  return (
    <div className='flex flex-col'>
      <button
        type='button'
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className='flex min-h-11 items-center gap-1 self-start text-[13px] font-medium text-brand-blue hover:underline nav:min-h-0'
      >
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
        已備齊 {readyCount} / {docs.length} 份文件
      </button>
      {open && (
        <ul className='flex flex-col gap-1.5 pt-1'>
          {docs.map(doc => {
            const { icon: Icon, iconClass, textClass } = STATUS_STYLE[doc.status];
            return (
              <li key={doc.key} className='flex items-center gap-2 text-[13px]'>
                <Icon size={14} className={cn('shrink-0', iconClass)} />
                <span className={cn('min-w-0 truncate', textClass)}>{doc.label}</span>
                {doc.status === 'identified' && doc.sourceName && <span className='min-w-0 truncate text-xs text-neutral-mid'>{doc.sourceName}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
