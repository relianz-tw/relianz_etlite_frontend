'use client';

import { filterOfficialSubjects, identifySubject, listSubjectUsage, type SubjectFilterParams } from '@/api/subjects';
import type { OfficialSubjectDto } from '@/api/types';
import { ApiError, getFriendlyErrorMessage } from '@/lib/errors';
import { useIsNavDesktop } from '@/lib/useNavBreakpoint';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

interface SubjectPickerProps {
  value: SubjectOption | null;
  onChange: (value: SubjectOption) => void;
  disabled?: boolean;
  placeholder?: string;
  /** 科目語境，決定「基礎」頁籤的篩選參數；預設 general（僅排除合計型／棄置科目，不分進銷項） */
  scope?: SubjectScope;
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
}: SubjectPickerProps) {
  const isDesktop = useIsNavDesktop();

  const [open, setOpen] = useState(false);
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

  // scope 改變時重新抓取，避免快取旗標跨 scope 誤用
  useEffect(() => {
    setLoaded(false);
  }, [scope]);

  // 開啟面板且尚未載入過時才並行抓三支：搜尋會跨到「全部」，不能等切到該頁籤才抓
  useEffect(() => {
    if (!open || loaded) return;
    setLoading(true);
    setError('');
    Promise.all([filterOfficialSubjects(SCOPE_PARAMS[scope]), filterOfficialSubjects({}), listSubjectUsage()])
      .then(([basicList, allList, usageList]) => {
        setBasic(basicList);
        setAll(allList);
        setFrequentNames(usageList.map((u) => u.subjectName));
        setLoaded(true);
      })
      .catch((err) => setError(getFriendlyErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [open, loaded, scope]);

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
    onChange({ id: subject.id, subjectCode: subject.subjectCode, name: subject.name });
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

  function handleAiSubmit() {
    const text = aiInput.trim();
    if (!text) return;
    const requestId = ++aiRequestIdRef.current;
    setAiPhase('loading');
    setAiError('');
    identifySubject(text)
      .then((candidates) => {
        if (aiRequestIdRef.current !== requestId) return; // 已再次送出或關閉，忽略過時回應
        const suggestions = candidates
          .map((c) => {
            const subject = all.find((s) => s.subjectCode === c.subjectCode);
            return subject ? { subject, reason: c.reason } : null;
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

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      aria-haspopup={isDesktop ? 'listbox' : 'dialog'}
      aria-expanded={open}
      onClick={!isDesktop ? () => handleOpenChange(!open) : undefined}
      className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border-[1.5px] border-neutral-blue-gray/50 bg-white px-3 text-sm text-neutral-dark outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 disabled:cursor-not-allowed disabled:bg-surface-cream disabled:text-neutral-mid"
    >
      <span className={`truncate ${!value ? 'text-neutral-mid' : ''}`}>{triggerLabel}</span>
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
    selectedCode: value?.subjectCode,
    armedCode,
    onRowClick: handleRowClick,
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

  return (
    <div className="relative">
      {isDesktop ? (
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
                    選擇會計科目
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
