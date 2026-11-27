'use client';

import {
  FLOW_VERSION,
  getNextStep,
  initialState,
  initializationReducer,
  isStaleFlow,
  restoredStep,
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
import {
  deleteDraftFile,
  downloadDraftFile,
  DRAFT_CONFLICT_CODE,
  isOverwriteAsk,
  getDraft,
  listDraftFiles,
  saveDraft,
  uploadDraftFile,
  type DraftConflictData,
  type DraftRecord,
} from '@/api/initializationDraft';
import type { IdentifiedForm } from '@/api/peit';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { blobToFile } from '@/lib/blobToFile';
import { ApiError, getFriendlyErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import { DraftConflictDialog } from '../components/DraftConflictDialog';
import { formatDraftDateTime } from '../components/draftTime';
import { toVatPeriodKey } from '../reports/vatPeriodKey';

// storage key 加上 etlite_ 前綴，理由同 onboarding（見 features/onboarding/state/OnboardingContext.tsx）：
// 瀏覽器 storage 以 origin 為界、不分 basePath，避免與姊妹專案同名 key 互相覆寫
// 步驟編號改版不再換版號：換 key 等於連本機還沒存上雲端的修改一起丟掉，而雲端草稿本來就擋不到。
// 改由 state.flowVersion 處理（見 reducer 的 isStaleFlow）——資料全留，只有步驟位置退回重走
const SESSION_KEY = 'etlite_initialization_state_v2';
/** 這個分頁最後一次和雲端草稿同步到的版本；重新整理後用來判斷雲端是不是被別的裝置更新過 */
const DRAFT_VERSION_KEY = 'etlite_initialization_draft_version';
/** 最後一次成功存上雲端的狀態。跟 SESSION_KEY 比對即可知道這個分頁有沒有未存檔的修改 */
const DRAFT_SAVED_KEY = 'etlite_initialization_saved_state';

interface HistoryStepState {
  step: number;
  reportIndex: number;
  /** 流程最底下的守門 entry：瀏覽器返回退到這裡代表使用者要離開開帳頁（見下方 popstate 處理） */
  base?: boolean;
  /** 寫入當下的 FLOW_VERSION；對不上代表是改版前留下的 entry，步驟號不可信（見 popstate） */
  v?: number;
}

/** 自動儲存的檢查間隔：內容有變動才會真的儲存 */
const AUTOSAVE_INTERVAL_MS = 30_000;

/** 步驟 2–8 正在填資料，離開頁面前需要確認；合約頁與完成頁沒有待保存內容 */
export function isFillingStep(step: number): boolean {
  return step >= 2 && step <= 8;
}

interface InitializationContextValue {
  state: InitializationState;
  dispatch: React.Dispatch<InitializationAction>;
  clearSession: () => void;
  /** 還原完成（含必要時等雲端草稿）；未完成前頁面先不畫，避免先閃出第一步再跳到上次的進度 */
  ready: boolean;
  /** 401／403 各期別頁上傳辨識的原件（key = 期別頁 key）；同時存在後端，重新整理後從後端取回 */
  vatUploads: Record<string, File>;
  setVatUpload: (pageKey: string, file: File) => void;
  /**
   * 這一期能不能用「沒有原件」擋使用者前進。原件是重新整理後才從後端撈回來的，
   * 還沒撈完或撈失敗時回 false：寧可放行，也不要讓使用者看到「明明傳過卻說沒傳」。
   */
  isVatFileRequired: (pageKey: string) => boolean;
  /**
   * 辨識出來的期別與上傳當下所在的期別不同時，資料先不帶入，暫存在這裡（key = 該期別頁 key），
   * 等使用者自己切到那一期再套用。File 無法序列化，不進草稿，重新整理後需重新上傳。
   */
  pendingVatForms: Record<string, PendingVatForm>;
  setPendingVatForm: (pageKey: string, pending: PendingVatForm) => void;
  clearPendingVatForm: (pageKey: string) => void;
  /** 上次儲存草稿的時間（ms，伺服器時間），尚未儲存過為 null */
  savedAt: number | null;
  /** 最近一次儲存是否失敗（如網路問題） */
  saveError: boolean;
  /** 立即儲存草稿到雲端（儲存按鈕用；每 30 秒也會自動儲存有變動的內容） */
  saveDraftNow: () => Promise<void>;
  /**
   * 目前內容與最後一次存進雲端的是否不同（判斷方式與自動儲存同一套）。
   * 給 beforeunload 用，要在事件當下才讀最新值，所以是函式不是值。
   */
  hasUnsavedChanges: () => boolean;
}

/** 暫存一份「期別對不上目前頁面」的辨識結果，等使用者切到該期別頁再帶入 */
export interface PendingVatForm {
  file: File;
  form: IdentifiedForm;
  /** 欄位位置要記得屬於哪份原件；401／403 用固定值（見 FormIdentifyPanel） */
  sourceId: string;
}

const InitializationContext = createContext<InitializationContextValue | null>(null);

/** 衝突回應代表「伺服器上沒有草稿」：目前版本是 0 且從未儲存過 */
function isMissingDraft(data: unknown): boolean {
  const conflict = data as DraftConflictData | undefined;
  return conflict?.version === 0 && !conflict.savedAt;
}

export function InitializationProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(initializationReducer, initialState);
  const [mounted, setMounted] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ===== 401／403 原件：File 無法序列化，不放進 reducer；上傳到後端，重新整理後依期別取回 =====
  const [vatUploads, setVatUploads] = useState<Record<string, File>>({});
  // 期別頁 key → 後端 fileId；與「已（或正在）上傳的 File」，避免同一個檔重複上傳
  const vatFileIdsRef = useRef<Record<string, string>>({});
  const vatSyncedFileRef = useRef<Record<string, File>>({});
  const setVatUpload = useCallback((pageKey: string, file: File) => {
    setVatUploads(prev => ({ ...prev, [pageKey]: file }));
    if (vatSyncedFileRef.current[pageKey] === file) return;
    vatSyncedFileRef.current[pageKey] = file;
    const period = stateRef.current.reportPages.find(p => p.key === pageKey)?.period;
    if (!period) return;
    const previousId = vatFileIdsRef.current[pageKey];
    uploadDraftFile(file, 'VAT_PERIOD', toVatPeriodKey(period))
      .then(meta => {
        vatFileIdsRef.current[pageKey] = meta.fileId;
        // 換檔時把這一期舊的原件從後端刪掉
        if (previousId && previousId !== meta.fileId) deleteDraftFile(previousId).catch(() => {});
      })
      .catch(error => toast.error(`${getFriendlyErrorMessage(error, '原件上傳失敗')}，原件未存到雲端，重新整理後需重新上傳`));
  }, []);

  // 原件還原的結果：還沒撈完（listed=false 的初始值）或撈失敗時，不能用「沒有原件」去擋使用者
  const [vatRestore, setVatRestore] = useState<{ listed: boolean; failedKeys: string[] }>({ listed: false, failedKeys: [] });
  const isVatFileRequired = useCallback(
    (pageKey: string) => vatRestore.listed && !vatRestore.failedKeys.includes(pageKey),
    [vatRestore],
  );

  // 期別對不上而暫存的辨識結果：使用者切到該期別頁時由 FormIdentifyPanel 取出帶入
  const [pendingVatForms, setPendingVatForms] = useState<Record<string, PendingVatForm>>({});
  const setPendingVatForm = useCallback((pageKey: string, pending: PendingVatForm) => {
    setPendingVatForms(prev => ({ ...prev, [pageKey]: pending }));
  }, []);
  const clearPendingVatForm = useCallback((pageKey: string) => {
    setPendingVatForms(prev => {
      if (!(pageKey in prev)) return prev;
      const next = { ...prev };
      delete next[pageKey];
      return next;
    });
  }, []);

  const [leavePromptOpen, setLeavePromptOpen] = useState(false);
  // 取消離開時用 history.forward() 回到流程，會再觸發一次 popstate，需忽略
  const ignoreNextPopRef = useRef(false);
  // ConfirmDialog 按確認後會接著呼叫 onClose，用這個旗標區分「確認離開」與「取消」
  const leaveConfirmedRef = useRef(false);

  // ===== 草稿：整份 state 存雲端（樂觀鎖 version），換裝置續填 =====
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState(false);
  /** 版本衝突（另一個裝置更新過雲端草稿）時為伺服器目前的版本，非 null 就跳選擇視窗 */
  const [conflict, setConflict] = useState<DraftConflictData | null>(null);
  const conflictRef = useRef<DraftConflictData | null>(null);
  conflictRef.current = conflict;
  // 後端的覆蓋確認：問過之後整個分頁都帶 overwrite；使用者按取消就先不再自動問，等他自己按「儲存」
  const [overwriteAsk, setOverwriteAsk] = useState<DraftConflictData | null>(null);
  const overwriteOkRef = useRef(false);
  const overwriteAskedRef = useRef(false);
  // 目前與雲端同步到的版本（還沒存過為 0，之後每次儲存都要帶它當 baseVersion）
  const draftVersionRef = useRef(0);
  const savingRef = useRef(false);
  // 上次存進雲端的內容，自動儲存用來判斷「有沒有變動」
  const lastSavedJsonRef = useRef<string | null>(null);

  // 還沒存過（null）一律當成有未儲存內容
  const hasUnsavedChanges = useCallback(() => lastSavedJsonRef.current === null || JSON.stringify(stateRef.current) !== lastSavedJsonRef.current, []);

  const recordVersion = useCallback((version: number) => {
    draftVersionRef.current = version;
    try {
      sessionStorage.setItem(DRAFT_VERSION_KEY, String(version));
    } catch {
      // ignore
    }
  }, []);

  const saveDraftNow = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    const snapshot = stateRef.current;
    // overwrite：這間公司已有草稿時後端預設不覆寫，會回 0003 問一次；使用者按過「覆蓋」之後整個分頁都帶 true，不再重複打擾
    const save = (baseVersion: number) =>
      saveDraft({ step: snapshot.currentStep, reportIndex: snapshot.currentReportIndex, state: snapshot, baseVersion, overwrite: overwriteOkRef.current });
    try {
      let record;
      try {
        record = await save(draftVersionRef.current);
      } catch (error) {
        // 伺服器回衝突、但它目前是第 0 版又沒存過，代表草稿已被刪除（環境重置、DELETE 過），不是真的有另一裝置在改。
        // 這時本機留著的版本號已經失效，直接以 0 重送即可，不必跳對話框打擾使用者。
        if (!(error instanceof ApiError && error.errorCode === DRAFT_CONFLICT_CODE && isMissingDraft(error.data))) throw error;
        record = await save(0);
      }
      recordVersion(record.version);
      lastSavedJsonRef.current = JSON.stringify(snapshot);
      try {
        sessionStorage.setItem(DRAFT_SAVED_KEY, lastSavedJsonRef.current);
      } catch {
        // 存不進去只會讓下次還原時保守地跳衝突視窗，不影響資料
      }
      setSavedAt(Date.parse(record.savedAt));
      setSaveError(false);
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === DRAFT_CONFLICT_CODE && error.data) setConflict(error.data as DraftConflictData);
      // 後端要求確認覆蓋：這不是失敗，是一個問題。使用者拒絕過就不再自動問，但畫面要顯示沒存成功
      else if (error instanceof ApiError && isOverwriteAsk(error.errorCode, error.data) && !overwriteAskedRef.current) {
        overwriteAskedRef.current = true;
        setOverwriteAsk(error.data);
      } else setSaveError(true);
    } finally {
      savingRef.current = false;
    }
  }, [recordVersion]);

  /** 使用者同意覆蓋雲端那份草稿：之後的儲存都帶 overwrite，並立刻把剛才沒存成功的內容重送一次 */
  const handleOverwriteConfirm = () => {
    overwriteOkRef.current = true;
    setOverwriteAsk(null);
    saveDraftNow();
  };

  /** 不覆蓋：這次就是沒存成功，照實顯示；之後按「儲存」會再問一次 */
  const handleOverwriteCancel = () => {
    setOverwriteAsk(null);
    overwriteAskedRef.current = false;
    setSaveError(true);
  };

  /** 用雲端草稿取代目前畫面：還原表單並跳到存檔時的步驟，瀏覽器歷史的目前這一筆也同步成該步驟 */
  const applyServerDraft = useCallback(
    (draft: DraftRecord) => {
      const restored = draft.state as InitializationState;
      rawDispatch({ type: 'RESTORE_STATE', payload: restored });
      // 改版前的草稿會被 RESTORE_STATE 退回流程起點，歷史要同步寫那一步，否則按返回又被丟回過期的步驟
      const step = isStaleFlow(restored) ? restoredStep(restored) : draft.step;
      history.replaceState({ step, reportIndex: isStaleFlow(restored) ? 0 : draft.reportIndex, v: FLOW_VERSION } satisfies HistoryStepState, '');
      recordVersion(draft.version);
      lastSavedJsonRef.current = JSON.stringify(restored);
      setSavedAt(Date.parse(draft.savedAt));
    },
    [recordVersion]
  );

  // 首次掛載還原：同一分頁的 sessionStorage 優先（可能有尚未儲存的最新修改）；沒有（新分頁、換裝置）就用雲端草稿，
  // 兩邊都有但雲端版本不是這個分頁同步到的那一版，代表別的裝置更新過，跳視窗讓使用者選
  useEffect(() => {
    let local: InitializationState | null = null;
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) local = JSON.parse(saved) as InitializationState;
    } catch {
      // 讀取或解析失敗，視為沒有本機狀態
    }
    const knownVersion = Number(sessionStorage.getItem(DRAFT_VERSION_KEY) ?? 0) || 0;
    // 這個分頁有沒有「改了但還沒存上雲端」的內容：拿本機狀態跟最後一次成功存檔的內容比。
    // 讀不到最後存檔內容時保守當成有，寧可多問一次也不要默默蓋掉使用者的修改。
    let hasUnsavedEdits = true;
    try {
      const savedJson = sessionStorage.getItem(DRAFT_SAVED_KEY);
      hasUnsavedEdits = savedJson === null || savedJson !== sessionStorage.getItem(SESSION_KEY);
    } catch {
      // 讀不到就維持保守判斷
    }
    if (local) {
      rawDispatch({ type: 'RESTORE_STATE', payload: local });
      draftVersionRef.current = knownVersion;
      setMounted(true);
    }
    getDraft()
      .then(draft => {
        if (!draft) return;
        if (!local) applyServerDraft(draft);
        // 雲端比這個分頁記得的新：本機沒有未存檔的修改就直接採用雲端，有才讓使用者選要留哪一邊
        else if (draft.version !== knownVersion) {
          if (hasUnsavedEdits) setConflict({ version: draft.version, savedAt: draft.savedAt });
          else applyServerDraft(draft);
        }
        else setSavedAt(Date.parse(draft.savedAt));
      })
      // 讀雲端失敗（斷線等）就用本機狀態繼續，之後儲存時會再提示
      .catch(() => {})
      .finally(() => setMounted(true));
  }, [applyServerDraft]);

  // 401／403 原件：狀態還原、期別頁清單有了之後，依期別從後端取回（只做一次）
  const vatRestoredRef = useRef(false);
  useEffect(() => {
    if (!mounted || vatRestoredRef.current) return;
    const periodPages = state.reportPages.filter(p => p.period);
    if (periodPages.length === 0) return;
    vatRestoredRef.current = true;
    (async () => {
      let listed = true;
      const metas = (
        await listDraftFiles().catch(() => {
          listed = false;
          return [];
        })
      ).filter(m => m.kind === 'VAT_PERIOD');
      const failed: string[] = [];
      for (const meta of metas) {
        const page = periodPages.find(p => toVatPeriodKey(p.period!) === meta.periodKey);
        if (!page) continue;
        try {
          const file = blobToFile(await downloadDraftFile(meta.fileId), meta.fileName);
          vatFileIdsRef.current[page.key] = meta.fileId;
          vatSyncedFileRef.current[page.key] = file;
          // 取回期間使用者若已經上傳新檔，以新檔為準
          setVatUploads(prev => (prev[page.key] ? prev : { ...prev, [page.key]: file }));
        } catch {
          // 取不回來：不能當成「這期沒有原件」，否則使用者明明傳過卻被擋住又無從補救
          failed.push(page.key);
        }
      }
      setVatRestore({ listed, failedKeys: failed });
    })();
  }, [mounted, state.reportPages]);

  // 自動儲存：只在填寫步驟、內容與上次儲存不同、且沒有衝突視窗開著時才存，避免白白更新時間
  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      const current = stateRef.current;
      if (conflictRef.current || !isFillingStep(current.currentStep)) return;
      if (JSON.stringify(current) !== lastSavedJsonRef.current) saveDraftNow();
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [mounted, saveDraftNow]);

  const handleConflictLoadServer = async () => {
    try {
      const draft = await getDraft();
      if (draft) applyServerDraft(draft);
      setConflict(null);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, '載入雲端草稿失敗，請稍後再試'));
    }
  };

  const handleConflictOverwrite = async () => {
    if (!conflict) return;
    // 以伺服器目前的版本當 baseVersion 重送，本機內容覆蓋雲端
    recordVersion(conflict.version);
    setConflict(null);
    await saveDraftNow();
  };

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
    history.replaceState({ step: state.currentStep, reportIndex: state.currentReportIndex, base: true, v: FLOW_VERSION } satisfies HistoryStepState, '');
    history.pushState({ step: state.currentStep, reportIndex: state.currentReportIndex, v: FLOW_VERSION } satisfies HistoryStepState, '');
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
      // 改版前推進的 entry：那時的步驟號對應的是別的畫面，寧可留在原地也不要亂跳
      if (s && typeof s.step === 'number' && s.v === FLOW_VERSION) {
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
      nextStep = { ...getNextStep(stateRef.current), v: FLOW_VERSION };
    } else if (action.type === 'GO_TO_STEP') {
      nextStep = { step: action.payload.step, reportIndex: action.payload.reportIndex ?? 0, v: FLOW_VERSION };
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

  // 只清這個分頁的暫存；雲端草稿與原件在開帳完成（complete）時由後端自動刪除、封存，前端不處理
  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(DRAFT_VERSION_KEY);
    sessionStorage.removeItem(DRAFT_SAVED_KEY);
  }

  return (
    <InitializationContext.Provider
      value={{
        state,
        dispatch,
        clearSession,
        ready: mounted,
        vatUploads,
        setVatUpload,
        isVatFileRequired,
        pendingVatForms,
        setPendingVatForm,
        clearPendingVatForm,
        savedAt,
        saveError,
        saveDraftNow,
        hasUnsavedChanges,
      }}
    >
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
      <DraftConflictDialog
        open={conflict !== null}
        serverSavedAt={conflict?.savedAt ?? ''}
        onLoadServer={handleConflictLoadServer}
        onOverwrite={handleConflictOverwrite}
        onClose={() => setConflict(null)}
      />
      <ConfirmDialog
        open={overwriteAsk !== null}
        onClose={handleOverwriteCancel}
        onConfirm={handleOverwriteConfirm}
        title='覆蓋雲端草稿'
        message={`雲端已經有一份草稿（上次儲存 ${overwriteAsk ? formatDraftDateTime(overwriteAsk.savedAt) : ''}）。繼續儲存會以這個分頁的內容覆蓋它，雲端那份的內容不會保留。`}
        confirmLabel='覆蓋'
        cancelLabel='先不要'
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
