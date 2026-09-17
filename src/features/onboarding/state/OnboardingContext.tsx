'use client';

import {
  getNextStep,
  initialState,
  onboardingReducer,
  type OnboardingAction,
  type OnboardingState,
  type SubStepType,
} from './onboardingReducer';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

// 注意：storage key 特意加上 etlite_ 前綴。瀏覽器 storage 以 origin 為界、不分 basePath，
// 若日後同網域下同時開啟姊妹專案（EASYTAX 完整版，路徑為 /customer）的 onboarding，
// 兩者的 sessionStorage 會互相覆寫，故不沿用原本的 'onboarding_state' 命名
const SESSION_KEY = 'etlite_onboarding_state';

interface HistoryStepState {
  step: number;
  subStep: SubStepType;
}

interface OnboardingContextValue {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  clearSession: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, rawDispatch] = useReducer(onboardingReducer, initialState);
  const [mounted, setMounted] = useState(false);
  // 用 ref 持有最新 state，供 popstate callback 讀取
  const stateRef = useRef(state);
  stateRef.current = state;

  // 首次掛載從 sessionStorage 還原，避免 SSR 與 client 狀態不一致
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        rawDispatch({
          type: 'RESTORE_STATE',
          payload: JSON.parse(saved) as OnboardingState,
        });
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

  // mounted 後設定初始 history entry（含當前步驟資訊）
  const historyInitialized = useRef(false);
  useEffect(() => {
    if (!mounted || historyInitialized.current) return;
    historyInitialized.current = true;
    history.replaceState(
      {
        step: state.currentStep,
        subStep: state.currentSubStep,
      } satisfies HistoryStepState,
      ''
    );
  }, [mounted, state.currentStep, state.currentSubStep]);

  // 監聽瀏覽器上一頁：用 GO_TO_STEP 跳回 history 記錄的步驟
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const s = event.state as HistoryStepState | null;
      if (s && typeof s.step === 'number') {
        rawDispatch({
          type: 'GO_TO_STEP',
          payload: { step: s.step, subStep: s.subStep ?? null },
        });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 包裝 dispatch：前進動作同步推入瀏覽器歷史
  const dispatch = useCallback(
    (action: OnboardingAction) => {
      rawDispatch(action);

      let nextStep: HistoryStepState | null = null;

      if (action.type === 'NEXT_STEP') {
        nextStep = getNextStep(stateRef.current);
      } else if (action.type === 'SKIP_VOUCHER') {
        nextStep = { step: 4, subStep: 'A' };
      } else if (action.type === 'GO_TO_STEP') {
        nextStep = {
          step: action.payload.step,
          subStep: action.payload.subStep ?? null,
        };
      }

      if (nextStep) {
        history.pushState(nextStep, '');
      }
    },
    [] // rawDispatch/stateRef 皆穩定，不需列入 deps
  );

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  return (
    <OnboardingContext.Provider value={{ state, dispatch, clearSession }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding 必須在 OnboardingProvider 內使用');
  }
  return ctx;
}
