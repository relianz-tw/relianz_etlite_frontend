'use client';

import type { OfficialSubjectDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { AI_EXAMPLE_PROMPTS } from './subjectAiRules';
import { AlertTriangle, ChevronUp, LoaderCircle, Sparkles } from 'lucide-react';

export type AiPhase = 'idle' | 'loading' | 'done';

/** 後端（/ael/subject/identify）限制描述字數，前端同步擋下避免送出後才被 400 打回 */
export const AI_INPUT_MAX_LENGTH = 100;

export interface AiSuggestion {
  subject: OfficialSubjectDto;
  reason: string;
}

interface SubjectAiAssistantProps {
  input: string;
  onInputChange: (value: string) => void;
  phase: AiPhase;
  suggestions: AiSuggestion[];
  /** phase 為 done 且無建議時顯示：內容與科目辨識無關、無法辨識，或呼叫失敗 */
  error: string;
  onSubmit: () => void;
  onCollapse: () => void;
  onPick: (subject: OfficialSubjectDto) => void;
}

/** 會計科目選擇器的 AI 輔助區塊：讓使用者描述交易內容，呼叫 /ael/subject/identify 取得建議科目 */
export default function SubjectAiAssistant({
  input,
  onInputChange,
  phase,
  suggestions,
  error,
  onSubmit,
  onCollapse,
  onPick,
}: SubjectAiAssistantProps) {
  return (
    <div className="border-t border-brand-tan/30 bg-surface-warm p-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="shrink-0 text-brand-tan-dark" />
        <span className="flex-1 text-sm font-semibold text-neutral-dark">告訴 AI 這筆交易在做什麼</span>
        <button
          type="button"
          onClick={onCollapse}
          className="flex items-center gap-1 text-xs text-neutral-mid hover:text-neutral-dark"
        >
          收合
          <ChevronUp size={14} />
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-neutral-mid">
        同一筆支出在不同業態會對應到不同科目，請一併說明你的行業與用途。
      </p>

      <div className="mt-3">
        <Textarea
          rows={3}
          value={input}
          onChange={(e) => onInputChange(e.target.value.slice(0, AI_INPUT_MAX_LENGTH))}
          maxLength={AI_INPUT_MAX_LENGTH}
          placeholder="例：我們是餐飲業，付 8 月店面電費，從國泰世華帳戶扣款"
        />
        <p className={`mt-1 text-right text-xs ${input.length >= AI_INPUT_MAX_LENGTH ? 'text-semantic-error' : 'text-neutral-mid'}`}>
          {input.length} / {AI_INPUT_MAX_LENGTH}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {AI_EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onInputChange(example.slice(0, AI_INPUT_MAX_LENGTH))}
            className="min-h-10 rounded-sm border border-brand-tan/50 bg-white px-2 py-1 text-xs text-neutral-dark transition-colors hover:border-brand-tan hover:bg-brand-tan/10 nav:min-h-0"
          >
            {example}
          </button>
        ))}
        <div className="flex-1" />
        <Button type="button" variant="warm" size="sm" icon={Sparkles} onClick={onSubmit} disabled={!input.trim() || phase === 'loading'}>
          送出給 AI
        </Button>
      </div>

      {phase === 'loading' && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-neutral-blue-gray/30 bg-white p-3 text-xs text-neutral-mid">
          <LoaderCircle size={14} className="shrink-0 animate-spin" />
          AI 正在對照貴公司的科目表…
        </div>
      )}

      {phase === 'done' && suggestions.length === 0 && error && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-semantic-error/30 bg-white p-3 text-xs text-semantic-error">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {phase === 'done' && suggestions.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs leading-relaxed text-neutral-mid">
            {suggestions.length > 1 ? `AI 建議 ${suggestions.length} 個科目，點選即套用：` : 'AI 建議：'}
          </p>
          {suggestions.map((s, i) => {
            const first = i === 0;
            return (
              <button
                key={s.subject.subjectCode}
                type="button"
                onClick={() => onPick(s.subject)}
                className={`w-full rounded-lg border bg-white p-2.5 text-left transition-colors hover:border-brand-blue ${
                  first ? 'border-[1.5px] border-brand-blue/40' : 'border-neutral-blue-gray/30'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs tabular-nums text-neutral-mid">{s.subject.subjectCode}</span>
                  <span className="text-sm font-semibold text-neutral-dark">{s.subject.name}</span>
                  {first && <Badge tone="info" variant="muted">首選</Badge>}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-mid">{s.reason}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
