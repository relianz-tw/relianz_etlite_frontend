'use client';

import type { OfficialSubjectDto, SubjectChildDto } from '@/api/types';
import Button from '@/components/ui/Button';
import { Check, ChevronRight, Info, Search, SearchX, Sparkles, X } from 'lucide-react';
import type { RefObject } from 'react';
import SubjectAiAssistant, { type AiPhase, type AiSuggestion } from './SubjectAiAssistant';

export type SubjectPickerTab = 'frequent' | 'basic' | 'all';

const TAB_ORDER: SubjectPickerTab[] = ['frequent', 'basic', 'all'];

const TAB_LABEL: Record<SubjectPickerTab, string> = {
  frequent: '常用',
  basic: '建議',
  all: '全部',
};

const TAB_NOTE: Record<SubjectPickerTab, string> = {
  frequent: '依貴公司使用次數排序',
  basic: '系統為此功能挑選的常用核心科目',
  all: '完整科目表',
};

interface SubjectPickerPanelProps {
  fullScreen: boolean;
  /** AI 入口列／AI 區塊是否固定釘在面板底部（不隨清單捲動）；預設沿用 fullScreen（全螢幕頁本就該釘底）。
   * Popover 模式維持 false，讓 AI 區塊與清單共用捲動容器，避免展開時被 Popover 邊界切掉（見下方清單容器註解）*/
  pinnedAi?: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  searchInputRef?: RefObject<HTMLInputElement>;
  autoFocusSearch: boolean;

  tab: SubjectPickerTab;
  onTabChange: (tab: SubjectPickerTab) => void;
  counts: Record<SubjectPickerTab, number>;
  searching: boolean;
  matchCount: number;

  options: OfficialSubjectDto[];
  selectedCode?: string;
  /** 選中子科目時的 uuid（見 OfficialSubjectDto.children）；有值時母科目列不反白，改由對應子科目列反白 */
  selectedCompanyAccountingSubjectUuid?: string;
  /** 待確認列的 key：母科目為 subjectCode、子科目為 uuid，兩者鍵空間不重疊可共用同一個狀態 */
  armedCode: string | null;
  onRowClick: (subject: OfficialSubjectDto) => void;
  onChildRowClick: (subject: OfficialSubjectDto, child: SubjectChildDto) => void;
  listRef?: RefObject<HTMLDivElement>;

  loading: boolean;
  error: string;

  aiOpen: boolean;
  onOpenAi: () => void;
  aiInput: string;
  onAiInputChange: (value: string) => void;
  aiPhase: AiPhase;
  aiSuggestions: AiSuggestion[];
  aiError: string;
  onAiSubmit: () => void;
  onAiCollapse: () => void;
  onAiPick: (subject: OfficialSubjectDto) => void;
}

/** 分頁式科目選擇器的面板內容：搜尋列／分頁列／說明列／清單／空狀態／AI 入口，桌機與手機共用 */
export default function SubjectPickerPanel({
  fullScreen,
  pinnedAi = fullScreen,
  query,
  onQueryChange,
  searchInputRef,
  autoFocusSearch,
  tab,
  onTabChange,
  counts,
  searching,
  matchCount,
  options,
  selectedCode,
  selectedCompanyAccountingSubjectUuid,
  armedCode,
  onRowClick,
  onChildRowClick,
  listRef,
  loading,
  error,
  aiOpen,
  onOpenAi,
  aiInput,
  onAiInputChange,
  aiPhase,
  aiSuggestions,
  aiError,
  onAiSubmit,
  onAiCollapse,
  onAiPick,
}: SubjectPickerPanelProps) {
  const isEmpty = !loading && !error && options.length === 0;

  const aiEntryButton = (
    <button
      type="button"
      onClick={onOpenAi}
      className={`flex w-full items-center gap-2 border-t border-brand-tan/30 bg-surface-warm px-3 py-3 text-left text-sm text-semantic-warm-dark transition-colors hover:bg-brand-tan/20 ${
        fullScreen ? 'min-h-16 pb-[calc(16px+env(safe-area-inset-bottom))]' : ''
      }`}
    >
      <Sparkles size={16} className="shrink-0 text-brand-tan-dark" />
      <span className="flex-1">不確定用哪個科目？描述這筆交易，讓 AI 幫你選</span>
      <ChevronRight size={16} className="ml-auto shrink-0" />
    </button>
  );

  const aiAssistant = (
    <SubjectAiAssistant
      input={aiInput}
      onInputChange={onAiInputChange}
      phase={aiPhase}
      suggestions={aiSuggestions}
      error={aiError}
      onSubmit={onAiSubmit}
      onCollapse={onAiCollapse}
      onPick={onAiPick}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-neutral-blue-gray/30 px-3 py-2">
        <Search size={15} className="shrink-0 text-neutral-mid" />
        <input
          ref={searchInputRef}
          autoFocus={autoFocusSearch}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="搜尋科目代碼或名稱"
          className="w-full min-w-0 bg-transparent text-base text-neutral-dark outline-none placeholder:text-neutral-mid nav:text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            className="relative shrink-0 text-neutral-mid before:absolute before:-inset-2.5 hover:text-neutral-dark"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {!searching && (
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-neutral-blue-gray/40 px-1">
          {TAB_ORDER.map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onTabChange(t)}
                className={`-mb-px whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                  active ? 'border-brand-blue text-brand-blue' : 'border-transparent text-neutral-mid hover:text-neutral-dark'
                }`}
              >
                {TAB_LABEL[t]}
                <span className="ml-1 text-xs font-normal text-neutral-mid">{counts[t]}</span>
              </button>
            );
          })}
        </div>
      )}

      {!searching && (
        <div className="shrink-0 bg-surface-cream px-3 py-1.5 text-xs text-neutral-mid">{TAB_NOTE[tab]}</div>
      )}

      {searching && !isEmpty && (
        <div className="flex shrink-0 items-start gap-2 border-b border-brand-blue/20 bg-brand-blue/5 px-3 py-1.5 text-xs text-brand-blue" aria-live="polite">
          <Info size={12} className="mt-0.5 shrink-0" />
          <span>
            搜尋範圍為完整科目表，找到 {matchCount} 筆符合「{query.trim()}」。清除搜尋可回到分類瀏覽。
          </span>
        </div>
      )}

      {/* AI 入口列固定高度、不隨清單捲動，一律渲染在此捲動容器外（見下方），避免用 sticky 撐在捲動
          容器內導致定位失效。Popover 模式（pinnedAi=false）：AI 區塊「展開」後內容變高，仍與清單共用
          此捲動容器，若各自獨立捲動，AI 區塊會被 Popover 的 overflow-hidden 直接切邊。桌機平常仍維持
          max-h-80（320px）的清單高度上限，但 AI 展開時解除此上限，改讓兩者一起在可用高度內捲動。
          全螢幕頁／Dialog 內面板模式（pinnedAi=true）：AI 區塊展開後改釘在面板底部（見下方），不受此處
          max-h-80 限制，清單以 flex-1 獨立捲動 */}
      <div
        ref={listRef}
        className={`min-h-0 flex-1 overscroll-contain overflow-y-auto ${!pinnedAi && !aiOpen ? 'max-h-80' : ''}`}
      >
        {/* Popover 模式 AI 展開時（!pinnedAi && aiOpen）不渲染清單本身，避免使用者得先滑過整份
            清單才能看到輸入框；pinnedAi 模式清單獨立捲動，不受 AI 展開狀態影響，維持顯示 */}
        {(pinnedAi || !aiOpen) && (
        <div className={fullScreen ? '' : 'py-1'}>
          {loading && <p className="px-3 py-2 text-sm text-neutral-mid">載入中...</p>}
          {!loading && error && <p className="px-3 py-2 text-sm text-semantic-error">{error}</p>}

          {!loading && !error && (
            <>
              {options.map((s) => {
                const selected = selectedCode === s.subjectCode && !selectedCompanyAccountingSubjectUuid;
                const armed = armedCode === s.subjectCode;
                return (
                  <div key={s.subjectCode}>
                    <button
                      type="button"
                      onClick={() => onRowClick(s)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                        fullScreen ? 'min-h-12 text-base nav:min-h-0 nav:text-sm' : ''
                      } ${selected ? 'bg-brand-blue/10 font-semibold text-brand-blue' : 'text-neutral-dark hover:bg-surface-cream'}`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="w-24 shrink-0 whitespace-nowrap font-mono text-xs tabular-nums text-neutral-mid">{s.subjectCode}</span>
                        <span className="truncate">{s.name}</span>
                      </span>
                      {armed && (
                        <span className="shrink-0 rounded-sm bg-brand-blue px-2 py-1 text-xs font-semibold text-white">確認</span>
                      )}
                      {!armed && selected && <Check size={14} className="shrink-0" />}
                    </button>
                    {/* 子科目：縮排＋較淡的副標題樣式，永遠展開顯示於母科目下方，各自可獨立點選（見 DESIGN.md Subject Picker） */}
                    {s.children?.map((child) => {
                      const childSelected = selectedCompanyAccountingSubjectUuid === child.uuid;
                      const childArmed = armedCode === child.uuid;
                      return (
                        <button
                          key={child.uuid}
                          type="button"
                          onClick={() => onChildRowClick(s, child)}
                          className={`flex w-full items-center justify-between gap-2 py-1.5 pl-11 pr-3 text-left text-xs transition-colors ${
                            fullScreen ? 'min-h-10 nav:min-h-0' : ''
                          } ${childSelected ? 'bg-brand-blue/10 font-semibold text-brand-blue' : 'text-neutral-mid hover:bg-surface-cream'}`}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="w-20 shrink-0 whitespace-nowrap font-mono tabular-nums text-neutral-mid/80">{child.subjectCode}</span>
                            <span className="truncate">{child.name}</span>
                          </span>
                          {childArmed && (
                            <span className="shrink-0 rounded-sm bg-brand-blue px-2 py-1 text-xs font-semibold text-white">確認</span>
                          )}
                          {!childArmed && childSelected && <Check size={13} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {isEmpty && (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <SearchX size={20} className="text-neutral-blue-gray" />
                  <p className="text-sm font-semibold text-neutral-dark">
                    {searching ? `找不到「${query.trim()}」` : '此分類沒有可選科目'}
                  </p>
                  <p className="text-xs leading-relaxed text-neutral-mid">
                    {searching ? '完整科目表中沒有相符的科目，換個關鍵字，或讓 AI 依交易內容判斷。' : '切換到其他分類，或讓 AI 依交易內容判斷。'}
                  </p>
                  <div className="mt-2">
                    <Button type="button" variant="primary" size="sm" icon={Sparkles} onClick={onOpenAi}>
                      讓 AI 判斷
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        )}

        {!pinnedAi && aiOpen && aiAssistant}
      </div>

      {!aiOpen && aiEntryButton}
      {pinnedAi && aiOpen && <div className="max-h-[60%] shrink-0 overflow-y-auto overscroll-contain">{aiAssistant}</div>}
    </div>
  );
}
