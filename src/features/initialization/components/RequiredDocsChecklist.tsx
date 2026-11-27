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
  // 必填與選填分開數：合在一起講「已備齊 11 / 15」，使用者會以為自己還缺 4 份非交不可的文件
  const requiredDocs = docs.filter(d => d.required);
  const optionalDocs = docs.filter(d => !d.required);
  const requiredReady = requiredDocs.filter(d => d.status !== 'empty').length;
  const optionalPending = optionalDocs.filter(d => d.status === 'empty').length;
  const summary =
    requiredReady === requiredDocs.length && optionalPending === 0
      ? '文件已全部備齊'
      : optionalPending > 0
        ? `必填 ${requiredReady} / ${requiredDocs.length} 份已備齊・另有 ${optionalPending} 份選填未填`
        : `必填 ${requiredReady} / ${requiredDocs.length} 份已備齊`;

  const renderDoc = (doc: (typeof docs)[number]) => {
    const { icon: Icon, iconClass, textClass } = STATUS_STYLE[doc.status];
    return (
      <li key={doc.key} className='flex items-center gap-2 text-[13px]'>
        <Icon size={14} className={cn('shrink-0', iconClass)} />
        <span className={cn('min-w-0 truncate', textClass)}>{doc.label}</span>
        {doc.status === 'identified' && doc.sourceName && <span className='min-w-0 truncate text-xs text-neutral-mid'>{doc.sourceName}</span>}
      </li>
    );
  };

  return (
    <div className='flex flex-col'>
      <button
        type='button'
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className='flex min-h-11 items-center gap-1 self-start text-[13px] font-medium text-brand-blue hover:underline nav:min-h-0'
      >
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
        {summary}
      </button>
      {open && (
        // 分「必填」「選填」兩區，小標樣式比照匯入覆蓋確認視窗的文件清單
        <div className='flex flex-col gap-2 pt-1'>
          <div className='flex flex-col gap-1.5'>
            <span className='text-xs font-medium text-neutral-mid'>必填</span>
            <ul className='flex flex-col gap-1.5'>{requiredDocs.map(renderDoc)}</ul>
          </div>
          {optionalDocs.length > 0 && (
            <div className='flex flex-col gap-1.5'>
              <span className='text-xs font-medium text-neutral-mid'>選填（沒有這份文件可以不填）</span>
              <ul className='flex flex-col gap-1.5'>{optionalDocs.map(renderDoc)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
