'use client';

import {
  filterOfficialSubjects,
  identifySubject,
  listSubjectUsage,
  type SubjectFilterParams,
  type SubjectIdentifyScenario,
  type SubjectUsageScenario,
} from '@/api/subjects';
import type { OfficialSubjectDto, SubjectChildDto } from '@/api/types';
import { ApiError, getFriendlyErrorMessage } from '@/lib/errors';
import { useIsNavDesktop } from '@/lib/useNavBreakpoint';
import { ChevronDown, ChevronLeft, Sparkles, Zap } from 'lucide-react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ModalSurfaceContext } from './Modal';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import type { AiPhase, AiSuggestion } from './SubjectAiAssistant';
import SubjectPickerPanel, { type SubjectPickerTab } from './SubjectPickerPanel';
import type { SubjectOption, SubjectScope } from './SubjectSelect';

export type { SubjectOption, SubjectScope };

// ⚠️ 與 SubjectSelect.tsx 的 SCOPE_PARAMS 為同一份規格的複本——該檔案仍有其他呼叫端在用（帳簿、
// 折讓、沖帳中心等），暫不改動，故無法 export 共用。若日後 SCOPE_PARAMS 規格調整，兩邊需同步修改。
const SCOPE_PARAMS: Record<SubjectScope, SubjectFilterParams> = {
  purchase: { calculationType: 0, buyOrSell: 2 }, // 進項費用科目
  sales: { calculationType: 0, buyOrSell: 3 }, // 銷項收入科目
  bank: { calculationType: 0, isBank: 1 }, // 銀行專用科目（股東往來、銀行手續費等）
  general: { calculationType: 0 }, // 不分進銷，僅排除合計型欄位／棄置科目
};

// AI 科目辨識（/ael/subject/identify）的使用場景參數：0 銀行總覽、1 進項、2 銷項；
// general 目前無對應呼叫端，暫沿用銀行總覽（0）
const SCOPE_TO_AI_SCENARIO: Record<SubjectScope, SubjectIdentifyScenario> = {
  bank: 0,
  purchase: 1,
  sales: 2,
  general: 0,
};

// /ael/subject/usage 的 scenario 為後端必填參數（0進項／1銷項／2銀行提匯，與上面 AI 辨識的
// scenario 數值定義不同，不可共用），無「不分」選項；general 情境退而求其次採用進項（0）
const SCOPE_TO_USAGE_SCENARIO: Record<SubjectScope, SubjectUsageScenario> = {
  purchase: 0,
  sales: 1,
  bank: 2,
  general: 0,
};

interface SubjectPickerProps {
  value: SubjectOption | null;
  onChange: (value: SubjectOption) => void;
  disabled?: boolean;
  placeholder?: string;
  /** 科目語境，決定「建議」頁籤的篩選參數；預設 general（僅排除合計型／棄置科目，不分進銷項） */
  scope?: SubjectScope;
  /** 手機全螢幕殼的標題文字；預設「選擇會計科目」 */
  title?: string;
  /** 覆寫 SCOPE_PARAMS[scope] 的 buyOrSell（如銀行新增交易依收支方向動態決定：支出=2／存入=3）；
   * 未傳入時沿用 scope 對應的固定值 */
  buyOrSell?: 2 | 3;
  /** 覆寫科目篩選，僅帶固定資產折舊與減損科目（如進項一般發票勾選「是否為固定資產」時）；
   * 未傳入時不加此篩選條件，維持 scope 對應的既有清單 */
  isFixedAssetDepreciationImpairment?: 0 | 1;
  /** 沖帳區專用篩選（如沖帳中心額外金額科目、手動沖帳編輯）：0 沖帳 Others、1 沖應收、2 沖應付；
   * 未傳入時不加此篩選條件。「全部」頁籤與搜尋範圍一併套用，避免選到不可用於沖帳的科目 */
  settle?: 0 | 1 | 2;
  /** 外部（如憑證辨識）自動帶入 value 時傳入 true，讓元件顯示「AI 已為你選擇」提示；僅由 false→true 觸發一次，
   * 使用者之後手動改選會透過既有的 commitSelection(fromAi=false) 自動熄滅，不受此 prop 影響 */
  aiPicked?: boolean;
  /** 桌機是否改用「Modal 對話框內左滑面板」取代 Popover（需在 Modal 內使用，透過 ModalSurfaceContext 取得掛載點）；
   * 手機不受影響，仍為全螢幕選擇頁 */
  inDialog?: boolean;
}

/**
 * 分頁式會計科目選擇器：常用／基礎／全部三個頁籤 + 搜尋跨範圍 + 描述交易輔助選科目（純介面模擬，
 * 見 subjectAiRules.ts）。桌機為下拉面板，手機（< nav 斷點）為全螢幕選擇頁。
 *
 * 與既有 SubjectSelect 並存，兩者互不影響；目前僅銀行新增交易改用此元件。
 */
export default function SubjectPicker({
  value,
  onChange,
  disabled,
  placeholder = '請選擇科目',
  scope = 'general',
  title = '選擇會計科目',
  aiPicked = false,
  inDialog = false,
  buyOrSell,
  isFixedAssetDepreciationImpairment,
  settle,
}: SubjectPickerProps) {
  const isDesktop = useIsNavDesktop();
  const modalSurface = useContext(ModalSurfaceContext);
  const useDialogPanel = inDialog && isDesktop && !!modalSurface;

  const [open, setOpen] = useState(false);
  // Dialog 內左滑面板的滑入動畫：掛載後下一輪 frame 才轉為 true，觸發 translate-x 過渡
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<SubjectPickerTab>('frequent');
  const [query, setQuery] = useState('');

  const [basic, setBasic] = useState<OfficialSubjectDto[]>([]);
  const [all, setAll] = useState<OfficialSubjectDto[]>([]);
  const [frequentNames, setFrequentNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiPhase, setAiPhase] = useState<AiPhase>('idle');
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [aiError, setAiError] = useState('');
  const [pickedByAi, setPickedByAi] = useState(false);

  const [armedCode, setArmedCode] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // 送出後元件可能卸載或再次送出，用遞增序號比對忽略過時的回應
  const aiRequestIdRef = useRef(0);

  // scope 或 buyOrSell／isFixedAssetDepreciationImpairment／settle 覆寫值改變時重新抓取，避免快取旗標
  // 跨語境誤用（如銀行新增交易切換支出／存入、進項一般發票切換是否為固定資產、沖帳中心切換應收／應付）
  useEffect(() => {
    setLoaded(false);
  }, [scope, buyOrSell, isFixedAssetDepreciationImpairment, settle]);

  // 外部（憑證辨識）帶入 aiPicked=true 時點亮提示；使用者之後手動選擇會透過 commitSelection(fromAi=false) 自動熄滅
  useEffect(() => {
    if (aiPicked) setPickedByAi(true);
  }, [aiPicked]);

  const basicParams: SubjectFilterParams = {
    ...SCOPE_PARAMS[scope],
    ...(buyOrSell ? { buyOrSell } : {}),
    ...(isFixedAssetDepreciationImpairment !== undefined ? { isFixedAssetDepreciationImpairment } : {}),
    ...(settle !== undefined ? { settle } : {}),
  };

  // 開啟面板且尚未載入過時才並行抓三支：搜尋會跨到「全部」，不能等切到該頁籤才抓
  useEffect(() => {
    if (!open || loaded) return;
    setLoading(true);
    setError('');
    Promise.all([
      filterOfficialSubjects(basicParams),
      filterOfficialSubjects({ calculationType: 0, ...(settle !== undefined ? { settle } : {}) }),
      listSubjectUsage(SCOPE_TO_USAGE_SCENARIO[scope]),
    ])
      .then(([basicList, allList, usageList]) => {
        setBasic(basicList);
        setAll(allList);
        setFrequentNames(usageList.map((u) => u.subjectName));
        setLoaded(true);
      })
      .catch((err) => setError(getFriendlyErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [open, loaded, scope, buyOrSell, isFixedAssetDepreciationImpairment, settle]);

  // 切分頁／改搜尋時清單捲回頂端
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [tab, query]);

  // 手機全螢幕殼開啟時：Escape 只關選擇器本身，不冒泡到 Modal.tsx 的 document keydown 監聽
  // （否則會連同外層「新增交易」對話框一起關掉）。桌機用 Radix Popover 也會踩到同一個坑：
  // Radix 自己的 Escape 處理不保證先於 Modal.tsx 的 document bubble 監聽執行，所以桌機／手機
  // 都要在 capture 階段攔截 —— capture 一定比任何 bubble 監聽早跑，才能可靠擋下冒泡。
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      closePanel();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 手機全螢幕殼鎖住背景捲動，關閉後還原（比照 Modal.tsx 的做法）
  useEffect(() => {
    if (!open || isDesktop) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isDesktop]);

  // Dialog 面板開合時同步 Modal 卡片的覆蓋層狀態：卡片長高、且遮罩點擊不再直接關閉整個對話框
  // （改由面板自身的返回鈕／Escape 處理），關閉時歸位讓對話框恢復原本高度與遮罩行為
  useEffect(() => {
    if (!useDialogPanel) return;
    modalSurface?.setOverlayOpen(open);
    return () => modalSurface?.setOverlayOpen(false);
  }, [useDialogPanel, open, modalSurface]);

  // Dialog 面板滑入動畫：掛載當下先維持在畫面右側外（translate-x-full），下一個 frame 才轉為
  // entered 觸發 transition-transform 滑入；關閉不做退場動畫，直接卸載（比照現有 Modal／BottomSheet）
  useEffect(() => {
    if (!useDialogPanel || !open) {
      setEntered(false);
      return;
    }
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [useDialogPanel, open]);

  const q = query.trim();
  const searching = q.length > 0;

  const frequentOptions = useMemo(
    () =>
      frequentNames
        .map((name) => basic.find((s) => s.name === name))
        .filter((s): s is OfficialSubjectDto => Boolean(s)),
    [frequentNames, basic],
  );

  const matchedAll = useMemo(() => {
    if (!searching) return [];
    return all.filter((s) => s.subjectCode.includes(q) || s.name.includes(q));
  }, [all, q, searching]);

  const visibleOptions = useMemo(() => {
    if (searching) return matchedAll;
    if (tab === 'frequent') return frequentOptions;
    if (tab === 'basic') return basic;
    return all;
  }, [searching, matchedAll, tab, frequentOptions, basic, all]);

  const counts = useMemo(
    () => ({ frequent: frequentOptions.length, basic: basic.length, all: all.length }),
    [frequentOptions, basic, all],
  );

  // value 若無 subjectCode（折讓帶入原單、編輯反查失敗時的退回值），退回以名稱在完整科目表
  // 反查代碼，讓清單仍能正確反白（比照 SubjectSelect 的名稱 fallback）
  const selectedCode = useMemo(() => {
    if (!value) return undefined;
    if (value.subjectCode) return value.subjectCode;
    return all.find((s) => s.name === value.name)?.subjectCode;
  }, [value, all]);

  // value 帶 companyAccountingSubjectUuid 代表選中的是子科目，供子科目列反白判斷（見 selectedCode 邏輯）
  const selectedCompanyAccountingSubjectUuid = value?.companyAccountingSubjectUuid;

  function resetPanelState() {
    setQuery('');
    setArmedCode(null);
    setAiOpen(false);
    setAiInput('');
    setAiPhase('idle');
    setAiSuggestions([]);
    setAiError('');
  }

  function closePanel() {
    setOpen(false);
    resetPanelState();
  }

  function handleOpenChange(next: boolean) {
    if (disabled) return;
    if (next) {
      setOpen(true);
      return;
    }
    closePanel();
  }

  function handleTabChange(t: SubjectPickerTab) {
    setTab(t);
    setArmedCode(null);
  }

  function handleQueryChange(v: string) {
    setQuery(v);
    setArmedCode(null);
  }

  function commitSelection(subject: OfficialSubjectDto, fromAi: boolean) {
    onChange({
      id: subject.id,
      subjectCode: subject.subjectCode,
      name: subject.name,
      isFixedAssetDepreciationImpairment: subject.isFixedAssetDepreciationImpairment,
    });
    setPickedByAi(fromAi);
    closePanel();
  }

  // 選定子科目：officialAccountingSubjectId 仍送父科目 id（subject.id），另帶 companyAccountingSubjectUuid；
  // SubjectChildDto 本身無固定資產旗標，沿用父科目的 isFixedAssetDepreciationImpairment
  function commitChildSelection(subject: OfficialSubjectDto, child: SubjectChildDto, fromAi: boolean) {
    onChange({
      id: subject.id,
      subjectCode: child.subjectCode,
      name: child.name,
      companyAccountingSubjectUuid: child.uuid,
      isFixedAssetDepreciationImpairment: subject.isFixedAssetDepreciationImpairment,
    });
    setPickedByAi(fromAi);
    closePanel();
  }

  function handleRowClick(subject: OfficialSubjectDto) {
    // 手機採兩段式確認：第一次點只標記待確認，再點一次（或點「確認」）才真正選定
    if (!isDesktop && armedCode !== subject.subjectCode) {
      setArmedCode(subject.subjectCode);
      return;
    }
    commitSelection(subject, false);
  }

  function handleChildRowClick(subject: OfficialSubjectDto, child: SubjectChildDto) {
    if (!isDesktop && armedCode !== child.uuid) {
      setArmedCode(child.uuid);
      return;
    }
    commitChildSelection(subject, child, false);
  }

  function handleAiSubmit() {
    const text = aiInput.trim();
    if (!text) return;
    const requestId = ++aiRequestIdRef.current;
    setAiPhase('loading');
    setAiError('');
    identifySubject(text, SCOPE_TO_AI_SCENARIO[scope])
      .then((candidates) => {
        if (aiRequestIdRef.current !== requestId) return; // 已再次送出或關閉，忽略過時回應
        const suggestions = candidates
          .map((c) => {
            const subject = all.find((s) => s.subjectCode === c.subjectCode);
            return subject ? { subject, reason: c.reason, type: c.type } : null;
          })
          .filter((s): s is AiSuggestion => s !== null)
          .slice(0, 3);
        setAiSuggestions(suggestions);
        setAiPhase('done');
      })
      .catch((err) => {
        if (aiRequestIdRef.current !== requestId) return;
        setAiSuggestions([]);
        // 400 代表內容與科目辨識無關或無法辨識，屬正常業務情境，直接沿用後端訊息而非通用錯誤字典
        setAiError(err instanceof ApiError && err.status === 400 ? err.message : getFriendlyErrorMessage(err));
        setAiPhase('done');
      });
  }

  function handleAiPick(subject: OfficialSubjectDto) {
    commitSelection(subject, true);
  }

  function handleReopenAi() {
    setOpen(true);
    setAiOpen(true);
    setAiPhase('idle');
    setAiSuggestions([]);
    setAiError('');
  }

  const triggerLabel = value ? (value.subjectCode ? `${value.subjectCode} ${value.name}` : value.name) : placeholder;
  // 觸發器綠框＋閃電與下方「AI 已為你選擇」註記使用同一個判斷條件，手動改選後 pickedByAi 會由
  // commitSelection(fromAi=false) 清為 false，兩處同步移除
  const showAiFilled = pickedByAi && !!value;

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      aria-haspopup={isDesktop && !useDialogPanel ? 'listbox' : 'dialog'}
      aria-expanded={open}
      onClick={!isDesktop || useDialogPanel ? () => handleOpenChange(!open) : undefined}
      className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border-[1.5px] bg-white px-3 text-sm text-neutral-dark outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 disabled:cursor-not-allowed disabled:bg-surface-cream disabled:text-neutral-mid ${
        showAiFilled ? 'border-semantic-success bg-semantic-success/5' : 'border-neutral-blue-gray/50'
      }`}
    >
      {showAiFilled && <Zap aria-hidden="true" size={14} className="shrink-0 fill-semantic-success text-semantic-success" />}
      <span className={`min-w-0 flex-1 truncate text-left ${!value ? 'text-neutral-mid' : ''}`}>{triggerLabel}</span>
      <ChevronDown size={15} className={`shrink-0 text-neutral-mid transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );

  const panelProps = {
    query,
    onQueryChange: handleQueryChange,
    tab,
    onTabChange: handleTabChange,
    counts,
    searching,
    matchCount: matchedAll.length,
    options: visibleOptions,
    selectedCode,
    selectedCompanyAccountingSubjectUuid,
    armedCode,
    onRowClick: handleRowClick,
    onChildRowClick: handleChildRowClick,
    listRef,
    loading,
    error,
    aiOpen,
    onOpenAi: () => setAiOpen(true),
    aiInput,
    onAiInputChange: setAiInput,
    aiPhase,
    aiSuggestions,
    aiError,
    onAiSubmit: handleAiSubmit,
    onAiCollapse: () => {
      setAiOpen(false);
      setAiPhase('idle');
      setAiSuggestions([]);
      setAiError('');
    },
    onAiPick: handleAiPick,
  };

  const dialogCardEl = useDialogPanel ? modalSurface?.cardRef.current ?? null : null;

  return (
    <div className="relative">
      {useDialogPanel ? (
        <>
          {trigger}
          {open &&
            dialogCardEl &&
            createPortal(
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="subject-picker-title"
                className={`absolute inset-0 z-10 flex flex-col rounded-lg bg-white transition-transform duration-200 ${
                  entered ? 'translate-x-0' : 'translate-x-full'
                }`}
              >
                <div className="flex h-14 shrink-0 items-center gap-2 border-b border-neutral-blue-gray/30 px-4">
                  <button
                    type="button"
                    onClick={closePanel}
                    aria-label="返回"
                    className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center text-neutral-mid hover:text-neutral-dark"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span id="subject-picker-title" className="font-notoSerif text-base font-semibold text-neutral-dark">
                    {title}
                  </span>
                </div>
                <SubjectPickerPanel {...panelProps} fullScreen={false} pinnedAi searchInputRef={searchInputRef} autoFocusSearch />
              </div>,
              dialogCardEl,
            )}
        </>
      ) : isDesktop ? (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent align="start" className="w-[max(var(--radix-popover-trigger-width),320px)] p-0">
            <SubjectPickerPanel {...panelProps} fullScreen={false} searchInputRef={searchInputRef} autoFocusSearch />
          </PopoverContent>
        </Popover>
      ) : (
        <>
          {trigger}
          {open &&
            createPortal(
              <div role="dialog" aria-modal="true" aria-labelledby="subject-picker-title" className="fixed inset-0 z-[90] flex flex-col bg-white">
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-blue-gray/30 px-4">
                  <span id="subject-picker-title" className="font-notoSerif text-base font-semibold text-neutral-dark">
                    {title}
                  </span>
                  <button type="button" onClick={closePanel} className="min-h-11 px-2 text-sm text-neutral-mid hover:text-neutral-dark">
                    取消
                  </button>
                </div>
                <SubjectPickerPanel {...panelProps} fullScreen searchInputRef={searchInputRef} autoFocusSearch={false} />
              </div>,
              document.body,
            )}
        </>
      )}

      {pickedByAi && value && (
        <div className="mt-1.5 flex items-center gap-1.5 rounded-sm bg-surface-warm px-2 py-1 text-xs text-semantic-warm-dark">
          <Sparkles size={12} className="shrink-0" />
          <span>AI 已為你選擇</span>
          <button type="button" onClick={handleReopenAi} className="ml-auto text-brand-blue underline-offset-2 hover:underline">
            重新詢問
          </button>
        </div>
      )}
    </div>
  );
}
