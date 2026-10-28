'use client';

import { compareVat } from '@/api/peit';
import { listInvoiceBooks } from '@/api/invoiceBook';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { monthToBimonthlyPhase } from '@/lib/utils';
import { deriveReconcile, needsBookCount, phasesBefore } from './derive';
import type { PeriodReconcile } from './derive';

export const RECONCILE_PATH = '/business-tax/reconcile';

/** 非對帳頁的換頁／回到分頁觸發重查時，距上次載入未滿此毫秒數就略過，避免每次導覽都打 6 支 API */
const STALE_MS = 30_000;

export interface PeriodState {
  phase: number;
  loading: boolean;
  error: string;
  /** 載入成功才有值 */
  data: PeriodReconcile | null;
}

interface VatReconcileValue {
  /** 民國年（目前固定為當年度） */
  rocYear: number;
  /**
   * 需要補齊的前期：今天所屬期別之前、且已寫入申報書的期別（載入中與讀取失敗的期別也保留）。
   * 本期起由系統直接處理，未申報的前期沒有申報值可比對，都不在此列；可能為空
   */
  periods: PeriodState[];
  /** 全部期別首次載入中 */
  initialLoading: boolean;
  /** 待處理期數 */
  pendingCount: number;
  reload: () => void;
}

const VatReconcileContext = createContext<VatReconcileValue | null>(null);

/**
 * 使用者從對帳頁出發去補交易後設為 true；離開交易表單頁（儲存後返回任一頁）時消耗此旗標並重查。
 * 用模組變數而非 state：只是跨頁面的一次性訊號，不需要觸發 render。
 */
let needsRefresh = false;
export function markReconcileStale() {
  needsRefresh = true;
}

/** 交易表單頁：還在填寫時不重查，等使用者離開才查 */
const TRANSACTION_FORM_PREFIXES = ['/ledger/new', '/einvoice'];

/** 單一期別：先 compare，必要時再查發票本數；任一步驟失敗只影響該期 */
async function loadPeriod(rocYear: number, phase: number): Promise<PeriodState> {
  try {
    const result = await compareVat({ taxYear: rocYear, cmsPhase: phase });
    const bookCount = needsBookCount(result) ? (await listInvoiceBooks({ year: rocYear, phase })).count : 0;
    return { phase, loading: false, error: '', data: deriveReconcile(result, bookCount) };
  } catch (err) {
    return { phase, loading: false, error: getFriendlyErrorMessage(err), data: null };
  }
}

export function VatReconcileProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { rocYear, phases } = useMemo(() => {
    const now = new Date();
    // 只查今天所屬期別之前的前期，本期起不需要補資料
    return { rocYear: now.getFullYear() - 1911, phases: phasesBefore(monthToBimonthlyPhase(now.getMonth() + 1)) };
  }, []);
  const [allPeriods, setPeriods] = useState<PeriodState[]>(() =>
    phases.map(phase => ({ phase, loading: true, error: '', data: null })),
  );
  const [initialLoading, setInitialLoading] = useState(true);
  // 以遞增的請求序號丟棄過期回應（快速連續觸發重查時，只採用最後一次）
  const requestId = useRef(0);
  const lastLoadedAt = useRef(0);

  const reload = useCallback(() => {
    const id = ++requestId.current;
    lastLoadedAt.current = Date.now();
    // 重查時保留舊資料避免畫面閃爍，只標記載入中
    setPeriods(prev => prev.map(p => ({ ...p, loading: true })));
    phases.forEach(async phase => {
      const next = await loadPeriod(rocYear, phase);
      if (id !== requestId.current) return;
      setPeriods(prev => prev.map(p => (p.phase === phase ? next : p)));
    });
  }, [rocYear, phases]);

  // 全部期別都回來（或沒有前期可查）後才算首次載入完成
  useEffect(() => {
    if (initialLoading && allPeriods.every(p => !p.loading)) setInitialLoading(false);
  }, [allPeriods, initialLoading]);

  // 未申報的前期沒有申報值可比對，不列入任務中心
  const periods = useMemo(() => allPeriods.filter(p => p.data?.status !== 'notFiled'), [allPeriods]);

  const reloadIfStale = useCallback(() => {
    if (Date.now() - lastLoadedAt.current >= STALE_MS) reload();
  }, [reload]);

  // 換頁：進入對帳頁一律重查；其他頁只在資料過期時重查（使用者剛補完交易回來會看到最新結果）
  useEffect(() => {
    const inTransactionForm = TRANSACTION_FORM_PREFIXES.some(p => pathname?.startsWith(p));
    if (pathname?.startsWith(RECONCILE_PATH) || (needsRefresh && !inTransactionForm)) {
      needsRefresh = false;
      reload();
    } else reloadIfStale();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 切回分頁（例如在別的視窗匯入發票後回來）
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reloadIfStale();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [reloadIfStale]);

  const value = useMemo<VatReconcileValue>(
    () => ({
      rocYear,
      periods,
      initialLoading,
      pendingCount: periods.filter(p => p.data?.status === 'pending').length,
      reload,
    }),
    [rocYear, periods, initialLoading, reload],
  );

  return <VatReconcileContext.Provider value={value}>{children}</VatReconcileContext.Provider>;
}

export function useVatReconcile(): VatReconcileValue {
  const ctx = useContext(VatReconcileContext);
  if (!ctx) throw new Error('useVatReconcile 必須在 VatReconcileProvider 內使用');
  return ctx;
}
