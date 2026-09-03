'use client';

import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';

export type SignFilter = 'all' | 'signed' | 'unsigned';

interface LaborFilterBarProps {
  signFilter: SignFilter;
  onSignFilterChange: (value: SignFilter) => void;
  query: string;
  onQueryChange: (value: string) => void;
}

/** 勞報單簡易篩選列：簽署狀態下拉 + 姓名/專案名稱關鍵字搜尋（前端即時過濾，無需送出按鈕） */
export default function LaborFilterBar({ signFilter, onSignFilterChange, query, onQueryChange }: LaborFilterBarProps) {
  return (
    <div className="flex flex-col gap-2 nav:flex-row">
      <div className="w-full nav:w-40">
        <Select widthClassName="w-full" value={signFilter} onValueChange={v => onSignFilterChange(v as SignFilter)}>
          <option value="all">全部</option>
          <option value="signed">已簽署</option>
          <option value="unsigned">未簽署</option>
        </Select>
      </div>
      <div className="flex-1">
        <TextInput value={query} onChange={e => onQueryChange(e.target.value)} placeholder="搜尋姓名或專案名稱" />
      </div>
    </div>
  );
}
