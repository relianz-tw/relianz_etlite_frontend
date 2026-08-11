'use client';

import { cn, fmtCurrency } from '@/lib/utils';
import { ALL_GROUP_KEY } from '../data';
import type { ReconGroup } from '../data';

interface ReconGroupSidebarProps {
  groups: ReconGroup[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

/**
 * 沖帳中心左側群組側邊欄：第一項固定為唯讀總覽「全部管道」，其後銷項列銷售管道、進項列廠商，皆含一個「其他」。
 * 每個項目顯示筆數與金額（使用者關心的是還有多少錢沒沖，不只是筆數），長名稱以原生 title 提供完整文字。
 * 當前餘額改於 ReconPoolPanel「使用餘額」欄位下方顯示，此處不再重複顯示。
 * 桌機為卡片化直向清單（與全站主導覽的側邊欄樣式區隔，避免雙左欄視覺混淆）；
 * 手機收合為頂部水平 chips 橫向捲動。「全部管道」與其後管道間加一條分隔線，區隔總覽與個別管道。
 * 寬度由外層 ResizableSplitPane 控制（可拖曳調整），此處桌機恆為 w-full 填滿外層容器。
 */
export default function ReconGroupSidebar({ groups, selectedKey, onSelect }: ReconGroupSidebarProps) {
  return (
    <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-2 nav:w-full nav:p-3">
      <div className="flex gap-2 overflow-x-auto nav:flex-col nav:gap-1 nav:overflow-visible">
        {groups.map((group, index) => {
          const active = group.key === selectedKey;
          // 「全部管道」後接的第一個管道項目加上分隔線，區隔唯讀總覽與個別管道（僅桌機直向清單看得出間距差異）
          const showDivider = index > 0 && groups[index - 1].key === ALL_GROUP_KEY;
          return (
            <div
              key={group.key}
              className={cn(
                'flex shrink-0 items-start gap-1 whitespace-nowrap rounded-md pl-3 pr-1 py-2 transition-colors nav:w-full nav:whitespace-normal',
                showDivider && 'nav:mt-1 nav:border-t nav:border-neutral-blue-gray/20 nav:pt-2',
                active ? 'bg-surface-cream' : 'hover:bg-surface-cream',
              )}
            >
              <button type="button" onClick={() => onSelect(group.key)} title={group.label} className="min-w-0 flex-1 text-left">
                <span className={cn('block max-w-[10rem] truncate text-sm nav:max-w-none', active ? 'font-semibold text-brand-blue' : 'text-neutral-dark')}>
                  {group.label}
                </span>
                <span className={cn('block text-xs', active ? 'text-brand-blue' : 'text-neutral-mid')}>
                  {group.count} 筆 · {fmtCurrency(group.amount)}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
