'use client';

import { useRef } from 'react';

interface SplitPanelProps {
  /** 左欄內容；未傳入 right 時，左欄以單欄置中呈現（如損益表這種不需比對兩欄的報表） */
  left: React.ReactNode;
  right?: React.ReactNode;
  /** 桌機左右欄捲動位置同步，方便逐行對照（如資產負債表左右科目一致、需交叉核對數字） */
  syncScroll?: boolean;
}

/**
 * 開帳精靈報表核對頁共用的左右雙欄容器（步驟 3 封面頁、步驟 4 報表頁）。
 * 桌機左右各半版、白底、中間 1px 分隔線，各欄獨立捲動（syncScroll 時同步）；手機單欄堆疊。
 */
export function SplitPanel({ left, right, syncScroll }: SplitPanelProps) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  // 記錄正在被使用者主動捲動的那一側，避免程式同步設定 scrollTop 又觸發對側的 onScroll 造成無限互相同步
  const activeSide = useRef<'left' | 'right' | null>(null);

  const handleScroll = (source: 'left' | 'right') => (e: React.UIEvent<HTMLDivElement>) => {
    if (!syncScroll) return;
    if (activeSide.current && activeSide.current !== source) return;
    const target = (source === 'left' ? rightRef : leftRef).current;
    if (!target) return;
    activeSide.current = source;
    target.scrollTop = e.currentTarget.scrollTop;
    requestAnimationFrame(() => {
      activeSide.current = null;
    });
  };

  if (!right) {
    return <div className='flex flex-col flex-1 min-h-0 mx-auto w-full max-w-2xl p-5 md:p-12 md:overflow-y-auto'>{left}</div>;
  }

  return (
    <div className='flex flex-col md:flex-row flex-1 min-h-0'>
      <div
        ref={leftRef}
        onScroll={handleScroll('left')}
        className='w-full md:w-1/2 md:min-h-0 md:overflow-y-auto p-5 md:p-12 md:border-r md:border-neutral-blue-gray/30'
      >
        {left}
      </div>
      <div ref={rightRef} onScroll={handleScroll('right')} className='w-full md:w-1/2 md:min-h-0 md:overflow-y-auto p-5 md:p-12'>
        {right}
      </div>
    </div>
  );
}
