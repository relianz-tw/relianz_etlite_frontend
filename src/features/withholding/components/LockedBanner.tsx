'use client';

import { Lock, LockOpen } from 'lucide-react';
import { useLock } from './LockContext';

/** 暫停申報期間提示橫幅，並附一顆示範用切換鈕（無真實申報 API 驅動鎖定狀態時，供操作展示用） */
export default function LockedBanner({ className = '' }: { className?: string }) {
  const { isLocked, toggle } = useLock();

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 ${className}`}>
      {isLocked ? (
        <div className="flex items-center gap-2 rounded-md border border-semantic-error/30 bg-semantic-error/5 px-3 py-2 text-sm text-semantic-error">
          <Lock size={15} />
          目前為暫停申報期間，無法新增、編輯或刪除單據，如果變更需求請聯繫事務所。
        </div>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-1 text-xs text-neutral-mid underline decoration-dotted hover:text-neutral-dark"
      >
        {isLocked ? <LockOpen size={12} /> : <Lock size={12} />}
        （示範，尚未串接後端）切換扣繳鎖定狀態
      </button>
    </div>
  );
}
