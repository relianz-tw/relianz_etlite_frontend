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
import ConfirmDialog from '@/components/ui/ConfirmDialog';

// storage key 加上 etlite_ 前綴，理由同 onboarding（見 features/onboarding/state/OnboardingContext.tsx）：
// 瀏覽器 storage 以 origin 為界、不分 basePath，避免與姊妹專案同名 key 互相覆寫
const SESSION_KEY = 'etlite_initialization_state';

interface HistoryStepState {
  step: number;
  reportIndex: number;
  /** 流程最底下的守門 entry：瀏覽器返回退到這裡代表使用者要離開開帳頁（見下方 popstate 處理） */
  base?: boolean;
}

/** 步驟 2–5 正在填資料，離開頁面前需要確認；合約頁與完成頁沒有待保存內容 */
function isFillingStep(step: number): boolean {
  return step >= 2 && step <= 5;
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
  const [leavePromptOpen, setLeavePromptOpen] = useState(false);
  // 取消離開時用 history.forward() 回到流程，會再觸發一次 popstate，需忽略
  const ignoreNextPopRef = useRef(false);
  // ConfirmDialog 按確認後會接著呼叫 onClose，用這個旗標區分「確認離開」與「取消」
  const leaveConfirmedRef = useRef(false);

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
    // 先把目前 entry 標為 base，再推入一個同步驟的 entry 作為實際操作位置：
    // 這樣從第一個步驟按瀏覽器返回時，會先落在我們自己的 base entry，才有機會攔下並詢問
    history.replaceState({ step: state.currentStep, reportIndex: state.currentReportIndex, base: true } satisfies HistoryStepState, '');
    history.pushState({ step: state.currentStep, reportIndex: state.currentReportIndex } satisfies HistoryStepState, '');
  }, [mounted, state.currentStep, state.currentReportIndex]);

  // 監聽瀏覽器上一頁：用 GO_TO_STEP 跳回 history 記錄的步驟
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (ignoreNextPopRef.current) {
        ignoreNextPopRef.current = false;
        return;
      }
      const s = event.state as HistoryStepState | null;
      if (s?.base) {
        if (isFillingStep(stateRef.current.currentStep)) setLeavePromptOpen(true);
        else history.back(); // 沒有待保存內容，直接再退一步離開，不多按一次
        return;
      }
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

  const handleLeaveConfirm = () => {
    leaveConfirmedRef.current = true;
    history.back();
  };

  const handleLeaveClose = () => {
    setLeavePromptOpen(false);
    if (leaveConfirmedRef.current) {
      leaveConfirmedRef.current = false;
      return;
    }
    // 取消：回到 base 之上的操作位置，留在原步驟
    ignoreNextPopRef.current = true;
    history.forward();
  };

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  return (
    <InitializationContext.Provider value={{ state, dispatch, clearSession }}>
      {children}
      <ConfirmDialog
        open={leavePromptOpen}
        onClose={handleLeaveClose}
        onConfirm={handleLeaveConfirm}
        title='離開開帳設定'
        message='確定要離開開帳設定嗎？目前填寫的內容會保留在這個分頁，回來時可以繼續。'
        confirmLabel='離開'
        cancelLabel='留在這裡'
      />
    </InitializationContext.Provider>
  );
}

export function useInitialization(): InitializationContextValue {
  const ctx = useContext(InitializationContext);
  if (!ctx) {
    throw new Error('useInitialization 必須在 InitializationProvider 內使用');
  }
  return ctx;
}
