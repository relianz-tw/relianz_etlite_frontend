'use client';

import { useSyncExternalStore } from 'react';

/** 與 tailwind.config.js 的 theme.screens.nav 同值；改動需兩邊同步 */
export const NAV_BREAKPOINT_PX = 1000;

const QUERY = `(min-width: ${NAV_BREAKPOINT_PX}px)`;

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

// server 快照固定回傳桌機：SSR 與 hydration 兩次都算出同一個值，避免 hydration mismatch。
// 真正的斷點值會在 hydration 後由瀏覽器 matchMedia 重新計算並觸發更新。
function getServerSnapshot() {
  return true;
}

/**
 * 是否為桌機寬度（≥ nav 1000px）。用 useSyncExternalStore 而非 useEffect + useState，
 * 避免「SSR 先算出手機版、hydration 後才翻成桌機版」造成畫面閃爍與 hydration 警告。
 */
export function useIsNavDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
