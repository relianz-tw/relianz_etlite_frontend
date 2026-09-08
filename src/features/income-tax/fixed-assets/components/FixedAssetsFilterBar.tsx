'use client';

import TextInput from '@/components/ui/TextInput';

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  onSearch: () => void;
}

export default function FixedAssetsFilterBar({ query, onQueryChange, onSearch }: Props) {
  return (
    <div className="max-w-sm">
      <TextInput
        placeholder="搜尋名稱或科目"
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSearch()}
      />
    </div>
  );
}
