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
import { clearUploadedFiles } from '../reference/referenceStorage';

// storage key 加上 etlite_ 前綴，理由同 onboarding（見 features/onboarding/state/OnboardingContext.tsx）：
// 瀏覽器 storage 以 origin 為界、不分 basePath，避免與姊妹專案同名 key 互相覆寫
// 步驟編號改版（登記文件前移）後換版號，舊 session 的 step 數字已對不上
const SESSION_KEY = 'etlite_initialization_state_v2';

interface HistoryStepState {
  step: number;
  reportIndex: number;
  /** 流程最底下的守門 entry：瀏覽器返回退到這裡代表使用者要離開開帳頁（見下方 popstate 處理） */
  base?: boolean;
}

/**
 * 草稿：表單資料存在 localStorage，關掉分頁、換天回來都能續填（sessionStorage 只活在單一分頁）。
 * TODO：後端草稿 API 上線後改存後端，才能換裝置續填；saveDraftNow 是唯一需要替換的地方。
 */
const DRAFT_KEY = 'etlite_initialization_draft_v1';
const AUTOSAVE_INTERVAL_MS = 30_000;

interface DraftRecord {
  savedAt: number;
  state: InitializationState;
}

function readDraft(): DraftRecord | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as DraftRecord) : null;
  } catch {
    return null;
  }
}

/** 步驟 2–7 正在填資料，離開頁面前需要確認；合約頁與完成頁沒有待保存內容 */
export function isFillingStep(step: number): boolean {
  return step >= 2 && step <= 7;
}

interface InitializationContextValue {
  state: InitializationState;
  dispatch: React.Dispatch<InitializationAction>;
  clearSession: () => void;
  /** 401／403 各期別頁上傳辨識的檔案（key = 期別頁 key），僅存記憶體供預覽 */
  vatUploads: Record<string, File>;
  setVatUpload: (pageKey: string, file: File) => void;
  /** 上次儲存草稿的時間（ms），尚未儲存過為 null */
  savedAt: number | null;
  /** 最近一次儲存是否失敗（如瀏覽器空間滿了） */
  saveError: boolean;
  /** 立即儲存草稿（儲存按鈕用；每 30 秒也會自動儲存有變動的內容） */
  saveDraftNow: () => void;
}

const InitializationContext = createContext<InitializationContextValue | null>(null);

export function InitializationProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(initializationReducer, initialState);
  const [mounted, setMounted] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  // File 無法序列化，不放進 reducer／sessionStorage；重新整理後會消失，待後端存檔 API 上線後改從後端取回
  const [vatUploads, setVatUploads] = useState<Record<string, File>>({});
  const setVatUpload = useCallback((pageKey: string, file: File) => {
    setVatUploads(prev => ({ ...prev, [pageKey]: file }));
  }, []);
  const [leavePromptOpen, setLeavePromptOpen] = useState(false);
  // 取消離開時用 history.forward() 回到流程，會再觸發一次 popstate，需忽略
  const ignoreNextPopRef = useRef(false);
  // ConfirmDialog 按確認後會接著呼叫 onClose，用這個旗標區分「確認離開」與「取消」
  const leaveConfirmedRef = useRef(false);

  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState(false);
  // 上次存進草稿的內容，自動儲存用來判斷「有沒有變動」
  const lastSavedJsonRef = useRef<string | null>(null);

  const saveDraftNow = useCallback(() => {
    try {
      const now = Date.now();
      const record: DraftRecord = { savedAt: now, state: stateRef.current };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(record));
      lastSavedJsonRef.current = JSON.stringify(stateRef.current);
      setSavedAt(now);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, []);

  // 首次掛載還原：同一分頁的 sessionStorage 優先（最新），沒有再用 localStorage 草稿（關掉分頁後回來）
  useEffect(() => {
    const draft = readDraft();
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        rawDispatch({ type: 'RESTORE_STATE', payload: JSON.parse(saved) as InitializationState });
      } else if (draft) {
        rawDispatch({ type: 'RESTORE_STATE', payload: draft.state });
        lastSavedJsonRef.current = JSON.stringify(draft.state);
      }
    } catch {
      // 讀取或解析失敗，保持 initialState
    }
    if (draft) setSavedAt(draft.savedAt);
    setMounted(true);
  }, []);

  // 自動儲存：只在填寫步驟、且內容與上次儲存不同時才存，避免白白更新時間
  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      const current = stateRef.current;
      if (isFillingStep(current.currentStep) && JSON.stringify(current) !== lastSavedJsonRef.current) saveDraftNow();
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [mounted, saveDraftNow]);

  // 走到完成頁代表開帳已完成，草稿與對照圖片不再需要，清掉以免下次進來又還原到舊資料
  useEffect(() => {
    if (state.currentStep < 8) return;
    localStorage.removeItem(DRAFT_KEY);
    clearUploadedFiles();
  }, [state.currentStep]);

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
    localStorage.removeItem(DRAFT_KEY);
    clearUploadedFiles();
  }

  return (
    <InitializationContext.Provider value={{ state, dispatch, clearSession, vatUploads, setVatUpload, savedAt, saveError, saveDraftNow }}>
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
