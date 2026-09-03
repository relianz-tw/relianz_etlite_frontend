'use client';

import Select from '@/components/ui/Select';
import { X } from 'lucide-react';
import { useState } from 'react';

interface TagChipsFieldProps {
  label: string;
  /** chip 前綴符號，標籤用 '#'、專案用 '@' */
  prefix: '#' | '@';
  value: string[];
  onChange: (next: string[]) => void;
  options: string[];
  onCreateNew: (name: string) => void;
}

/** 標籤／專案 chip 選擇器：下拉選既有項目，或輸入新名稱即時建立（見原版標籤/專案系統） */
export default function TagChipsField({ label, prefix, value, onChange, options, onCreateNew }: TagChipsFieldProps) {
  const [draft, setDraft] = useState('');

  const availableOptions = options.filter(o => !value.includes(o));

  const handleAdd = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || value.includes(trimmed)) return;
    if (!options.includes(trimmed)) onCreateNew(trimmed);
    onChange([...value, trimmed]);
    setDraft('');
  };

  const handleRemove = (name: string) => onChange(value.filter(v => v !== name));

  return (
    <div>
      <div className="mb-1.5 text-xs text-neutral-mid">{label}</div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {value.map(v => (
          <span key={v} className="inline-flex items-center gap-1 rounded-sm border border-neutral-blue-gray/30 bg-surface-cream px-2 py-0.5 text-sm text-neutral-dark">
            <span className="text-neutral-mid">{prefix}</span>
            {v}
            <button type="button" onClick={() => handleRemove(v)} className="text-neutral-mid hover:text-neutral-dark">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        {availableOptions.length > 0 && (
          <div className="w-40">
            <Select widthClassName="w-full" value="" onValueChange={handleAdd}>
              <option value="" disabled>
                選擇既有{label}
              </option>
              {availableOptions.map(o => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </div>
        )}
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd(draft);
            }
          }}
          placeholder={`輸入新${label}後按 Enter`}
          className="h-10 flex-1 rounded-lg border-[1.5px] border-neutral-blue-gray/50 bg-white px-3 text-sm text-neutral-dark outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
        />
      </div>
    </div>
  );
}
