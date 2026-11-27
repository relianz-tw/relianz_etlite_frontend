'use client';

import { ChevronDown, CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { useReference } from '../reference/ReferenceContext';
import { useInitialization } from '../state/InitializationContext';
import { buildRequiredDocs } from '../reports';

/**
 * 這間公司這條開帳路徑需要的文件清單（封面＋步驟 4 逐頁），可展開查看每一份的狀態：
 * 最左是使用者會走到的頁面順序，最右只分「有資料／沒資料」——
 * 辨識帶入或自己手填都算有資料，系統自動帶的（組織種類、登記事項表的董監事）不算（見 buildRequiredDocs）。
 * 清單與狀態由 buildRequiredDocs 推導（與匯入覆蓋確認視窗同一份來源）。
 */
export function RequiredDocsChecklist() {
  const { state, vatUploads } = useInitialization();
  const { sourceFiles } = useReference();
  const [open, setOpen] = useState(false);

  const docs = buildRequiredDocs(state, { vatUploads, sourceFiles });
  // 一份都還沒有資料時整塊不顯示：這時清單只會重述「什麼都還沒有」，佔版面又幫不上忙
  if (docs.every(doc => doc.status === 'empty')) return null;

  // 必填與選填分開數：合在一起講「已備齊 11 / 15」，使用者會以為自己還缺 4 份非交不可的文件
  const requiredDocs = docs.filter(d => d.required);
  const requiredReady = requiredDocs.filter(d => d.status !== 'empty').length;
  const optionalPending = docs.filter(d => !d.required && d.status === 'empty').length;
  const summary =
    requiredReady === requiredDocs.length && optionalPending === 0
      ? '文件已全部備齊'
      : optionalPending > 0
        ? `必填 ${requiredReady} / ${requiredDocs.length} 份已備齊・另有 ${optionalPending} 份選填未填`
        : `必填 ${requiredReady} / ${requiredDocs.length} 份已備齊`;

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
        // 不分必填／選填兩區，依使用者實際走到的頁面順序一路編號；選填改在名稱後面標徽章
        <ul className='flex flex-col gap-1.5 pt-1'>
          {docs.map((doc, index) => {
            const filled = doc.status !== 'empty';
            return (
              <li key={doc.key} className='flex items-center gap-2 text-[13px]'>
                <span className='w-5 shrink-0 text-right tabular-nums text-neutral-mid'>{index + 1}</span>
                <span className={cn('min-w-0 flex-1 truncate', filled ? 'text-neutral-dark' : 'text-neutral-mid')}>{doc.label}</span>
                {!doc.required && <Badge tone='neutral'>選填</Badge>}
                {/* 狀態文字與匯入覆蓋確認視窗同一套講法 */}
                {filled ? (
                  <span className='flex shrink-0 items-center gap-1 text-xs text-semantic-success'>
                    <CircleCheck size={14} />
                    有資料
                  </span>
                ) : (
                  <span className='shrink-0 text-xs text-neutral-mid'>沒資料</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
