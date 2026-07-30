'use client';

import { listOfficialSubjects, listSubjectUsage } from '@/api/subjects';
import type { OfficialSubjectDto } from '@/api/types';
import { Check, ChevronDown, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';

export interface SubjectOption {
  /** 官方科目 id（送出 API 時對應 officialAccountingSubjectId）；SubjectNameSelect 純字串情境無此值 */
  id?: number;
  subjectCode: string;
  name: string;
}

interface SubjectSelectProps {
  value: SubjectOption | null;
  onChange: (value: SubjectOption) => void;
  /** 民國年，決定要抓哪個年度的官方科目清單；未提供（例如尚未選開立日期）時下拉停用 */
  year?: number;
  disabled?: boolean;
  placeholder?: string;
}

/** 可搜尋的會計科目選擇器：串接官方科目清單與使用者常用科目，常用科目獨立分區並以星號標示 */
export default function SubjectSelect({ value, onChange, year, disabled, placeholder = '請選擇科目' }: SubjectSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [official, setOfficial] = useState<OfficialSubjectDto[]>([]);
  const [frequentNames, setFrequentNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedYear, setLoadedYear] = useState<number | null>(null);

  // 開啟下拉且該年度尚未載入過時才抓取，避免每次開關都重打 API
  useEffect(() => {
    if (!open || year === undefined || loadedYear === year) return;
    setLoading(true);
    setError('');
    Promise.all([listOfficialSubjects(year), listSubjectUsage()])
      .then(([officialList, usageList]) => {
        setOfficial(officialList);
        setFrequentNames(usageList.map(u => u.subjectName));
        setLoadedYear(year);
      })
      .catch(err => setError(err instanceof Error ? err.message : '操作失敗'))
      .finally(() => setLoading(false));
  }, [open, year, loadedYear]);

  // 開立日期變動導致年度改變時，清空快取讓下次開啟重新抓取該年度清單
  useEffect(() => {
    setLoadedYear(null);
  }, [year]);

  const q = query.trim();
  const matches = (s: OfficialSubjectDto) => !q || s.subjectCode.includes(q) || s.name.includes(q);

  const frequentOptions = useMemo(
    () =>
      frequentNames
        .map(name => official.find(s => s.name === name))
        .filter((s): s is OfficialSubjectDto => Boolean(s))
        .filter(matches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frequentNames, official, q],
  );
  const allOptions = useMemo(() => official.filter(matches), [official, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDisabled = disabled || year === undefined;
  const triggerLabel = value
    ? value.subjectCode
      ? `${value.subjectCode} ${value.name}`
      : value.name
    : year === undefined
      ? '請先選擇開立日期'
      : placeholder;

  // value 若無 subjectCode（例如 SubjectNameSelect 只有名稱可比對），退回以名稱比對選中項
  const isSelected = (s: OfficialSubjectDto) => (value ? (value.subjectCode ? value.subjectCode === s.subjectCode : value.name === s.name) : false);

  const handleSelect = (s: SubjectOption) => {
    onChange(s);
    setOpen(false);
    setQuery('');
  };

  return (
    <Popover
      open={open}
      onOpenChange={o => {
        if (isDisabled) return;
        setOpen(o);
        if (!o) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isDisabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border-[1.5px] border-neutral-blue-gray/50 bg-white px-3 text-sm text-neutral-dark outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 disabled:cursor-not-allowed disabled:bg-surface-cream disabled:text-neutral-mid"
        >
          <span className={`truncate ${!value ? 'text-neutral-mid' : ''}`}>{triggerLabel}</span>
          <ChevronDown size={15} className={`shrink-0 text-neutral-mid transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[max(var(--radix-popover-trigger-width),280px)] p-0">
        <div className="flex items-center gap-2 border-b border-neutral-blue-gray/30 px-3 py-2">
          <Search size={15} className="shrink-0 text-neutral-mid" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜尋科目代碼或名稱"
            className="w-full min-w-0 bg-transparent text-sm text-neutral-dark outline-none placeholder:text-neutral-mid"
          />
        </div>
        <div role="listbox" className="max-h-72 overflow-auto py-1">
          {loading && <p className="px-3 py-2 text-sm text-neutral-mid">載入中...</p>}
          {!loading && error && <p className="px-3 py-2 text-sm text-semantic-error">{error}</p>}
          {!loading && !error && (
            <>
              {frequentOptions.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold text-neutral-mid">常用科目</p>
                  {frequentOptions.map(s => (
                    <SubjectRow key={`freq-${s.subjectCode}`} subject={s} selected={isSelected(s)} frequent onSelect={handleSelect} />
                  ))}
                  <div className="my-1 border-t border-neutral-blue-gray/20" />
                  <p className="px-3 pb-1 pt-1 text-xs font-semibold text-neutral-mid">全部科目</p>
                </>
              )}
              {allOptions.length === 0 && <p className="px-3 py-2 text-sm text-neutral-mid">查無符合的科目</p>}
              {allOptions.map(s => (
                <SubjectRow key={s.subjectCode} subject={s} selected={isSelected(s)} onSelect={handleSelect} />
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface SubjectNameSelectProps {
  value: string;
  onChange: (name: string) => void;
  year?: number;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * SubjectSelect 的字串版本：適用於只需要科目名稱、不追蹤代碼的場景（帳簿篩選條件、表格列內編輯／批次操作），
 * 這些欄位目前的資料模型仍是純字串，改用物件會牽動既有欄位型別與假資料，故在此做名稱字串轉接。
 */
export function SubjectNameSelect({ value, onChange, year, disabled, placeholder }: SubjectNameSelectProps) {
  return (
    <SubjectSelect
      value={value ? { subjectCode: '', name: value } : null}
      onChange={s => onChange(s.name)}
      year={year}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}

interface SubjectRowProps {
  subject: OfficialSubjectDto;
  selected: boolean;
  frequent?: boolean;
  onSelect: (s: SubjectOption) => void;
}

function SubjectRow({ subject, selected, frequent, onSelect }: SubjectRowProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onSelect({ id: subject.id, subjectCode: subject.subjectCode, name: subject.name })}
      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
        selected ? 'bg-brand-blue/10 font-semibold text-brand-blue' : 'text-neutral-dark hover:bg-surface-cream'
      }`}
    >
      <span className="flex min-w-0 items-center gap-1.5 truncate">
        {frequent && <Star size={13} className="shrink-0 fill-brand-tan text-brand-tan" />}
        <span className="truncate">
          {subject.subjectCode} {subject.name}
        </span>
      </span>
      {selected && <Check size={14} className="shrink-0" />}
    </button>
  );
}
