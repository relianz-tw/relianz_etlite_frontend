'use client';

import {
  getNextStep,
  initialState,
  initializationReducer,
  type InitializationAction,
  type InitializationState,
} from './initializationReducer';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

// storage key 加上 etlite_ 前綴，理由同 onboarding（見 features/onboarding/state/OnboardingContext.tsx）：
// 瀏覽器 storage 以 origin 為界、不分 basePath，避免與姊妹專案同名 key 互相覆寫
const SESSION_KEY = 'etlite_initialization_state';

interface HistoryStepState {
  step: number;
  reportIndex: number;
}

interface InitializationContextValue {
  state: InitializationState;
  dispatch: React.Dispatch<InitializationAction>;
  clearSession: () => void;
}

const InitializationContext = createContext<InitializationContextValue | null>(null);

export function InitializationProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(initializationReducer, initialState);
  const [mounted, setMounted] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 首次掛載從 sessionStorage 還原
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        rawDispatch({ type: 'RESTORE_STATE', payload: JSON.parse(saved) as InitializationState });
      }
    } catch {
      // 讀取或解析失敗，保持 initialState
    }
    setMounted(true);
  }, []);

  // mounted 後才同步，避免將 initialState 覆寫已儲存的狀態
  useEffect(() => {
    if (!mounted) return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, mounted]);

  // mounted 後設定初始 history entry
  const historyInitialized = useRef(false);
  useEffect(() => {
    if (!mounted || historyInitialized.current) return;
    historyInitialized.current = true;
    history.replaceState({ step: state.currentStep, reportIndex: state.currentReportIndex } satisfies HistoryStepState, '');
  }, [mounted, state.currentStep, state.currentReportIndex]);

  // 監聽瀏覽器上一頁：用 GO_TO_STEP 跳回 history 記錄的步驟
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const s = event.state as HistoryStepState | null;
      if (s && typeof s.step === 'number') {
        rawDispatch({ type: 'GO_TO_STEP', payload: { step: s.step, reportIndex: s.reportIndex ?? 0 } });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 包裝 dispatch：前進動作同步推入瀏覽器歷史
  const dispatch = useCallback((action: InitializationAction) => {
    rawDispatch(action);

    let nextStep: HistoryStepState | null = null;

    if (action.type === 'NEXT_STEP') {
      nextStep = getNextStep(stateRef.current);
    } else if (action.type === 'GO_TO_STEP') {
      nextStep = { step: action.payload.step, reportIndex: action.payload.reportIndex ?? 0 };
    }

    if (nextStep) {
      history.pushState(nextStep, '');
    }
  }, []); // rawDispatch/stateRef 皆穩定，不需列入 deps

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  return <InitializationContext.Provider value={{ state, dispatch, clearSession }}>{children}</InitializationContext.Provider>;
}

export function useInitialization(): InitializationContextValue {
  const ctx = useContext(InitializationContext);
  if (!ctx) {
    throw new Error('useInitialization 必須在 InitializationProvider 內使用');
  }
  return ctx;
}
