'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface LockContextValue {
  isLocked: boolean;
  toggle: () => void;
}

const LockContext = createContext<LockContextValue | null>(null);

/** 各類扣繳中心「暫停申報期間」鎖定狀態，原專案由後端申報流程驅動；
 *  此處尚無對應 API，改為前端可切換的示範狀態（見 LockedBanner 旁的切換鈕），預設不鎖定 */
export function LockProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const value = useMemo(() => ({ isLocked, toggle: () => setIsLocked(v => !v) }), [isLocked]);
  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
}

export function useLock(): LockContextValue {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error('useLock 必須在 LockProvider 內使用');
  return ctx;
}
