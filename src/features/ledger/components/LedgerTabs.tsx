'use client';

import SegmentedControl from '@/components/ui/SegmentedControl';
import { useRouter } from 'next/navigation';

type LedgerTab = 'overview' | 'reconciliation';

const OPTIONS: { value: LedgerTab; label: string }[] = [
  { value: 'overview', label: '帳簿總覽' },
  { value: 'reconciliation', label: '沖帳中心' },
];

const TAB_PATH: Record<LedgerTab, string> = {
  overview: '/ledger',
  reconciliation: '/ledger/reconciliation',
};

/** 帳簿總覽／沖帳中心頁首快速切換，比照各類扣繳中心 WithholdingTabs 的樣式，
 *  免除使用者得回側欄才能切換分頁 */
export default function LedgerTabs({ active, className = 'w-full nav:w-64' }: { active: LedgerTab; className?: string }) {
  const router = useRouter();

  const handleChange = (value: LedgerTab) => {
    if (value === active) return;
    router.push(TAB_PATH[value]);
  };

  return (
    <div className={className}>
      <SegmentedControl options={OPTIONS} value={active} onChange={handleChange} size="md" />
    </div>
  );
}
