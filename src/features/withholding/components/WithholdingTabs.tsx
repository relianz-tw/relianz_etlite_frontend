'use client';

import SegmentedControl from '@/components/ui/SegmentedControl';
import { useRouter } from 'next/navigation';

type WithholdingTab = 'salary' | 'labor';

const OPTIONS: { value: WithholdingTab; label: string }[] = [
  { value: 'salary', label: '薪資明細' },
  { value: 'labor', label: '勞報單' },
];

/** 薪資明細／勞報單頁首快速切換，比照營業稅中心銷項/進項的 SegmentedControl 樣式，
 *  免除使用者得回側欄才能切換兩個分頁 */
export default function WithholdingTabs({ active }: { active: WithholdingTab }) {
  const router = useRouter();

  const handleChange = (value: WithholdingTab) => {
    if (value === active) return;
    router.push(value === 'salary' ? '/withholding/salary' : '/withholding/labor');
  };

  return (
    <div className="w-64">
      <SegmentedControl options={OPTIONS} value={active} onChange={handleChange} size="md" />
    </div>
  );
}
