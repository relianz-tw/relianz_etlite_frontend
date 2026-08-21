'use client';

import Select from '@/components/ui/Select';
import StepNumber from '@/components/ui/StepNumber';
import { cn, fmtCurrency } from '@/lib/utils';
import { ALL_GROUP_KEY } from '../data';
import type { ReconGroup } from '../data';
import type { ReconSide } from '../types';

interface ReconGroupSidebarProps {
  side: ReconSide;
  groups: ReconGroup[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

/**
 * 沖帳中心頂部群組選擇列（操作順序第 1 步，見 DESIGN.md「Step Number Badge」）：第一項固定為唯讀總覽
 * 「全部管道」，其後銷項列銷售管道、進項列廠商，皆含一個「其他」。
 * 桌機（≥ nav 1000px）採橫向 chips，管道數量多時自動換行，不做「更多」收合——換行才不會讓任何管道被隱藏。
 * 手機（< nav）螢幕寬度有限，換行會把整個清單往下推一大塊，改為下拉選單（見 @/components/ui/Select），
 * 選項文字帶入名稱與筆數／金額，方便管道多時直接搜尋比對。「全部管道」與其後管道間（桌機版）加一條垂直
 * 分隔線，區隔總覽與個別管道。
 */
export default function ReconGroupSidebar({ side, groups, selectedKey, onSelect }: ReconGroupSidebarProps) {
  const stepLabel = side === 'receivable' ? '選擇銷售管道' : '選擇廠商';

  return (
    <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-3">
      <div className="mb-2 flex items-center gap-2">
        <StepNumber value={1} />
        <span className="text-sm font-semibold text-neutral-dark">{stepLabel}</span>
      </div>

      {/* 手機（< nav）：下拉選單 */}
      <div className="nav:hidden">
        <Select value={selectedKey ?? undefined} onValueChange={onSelect}>
          {groups.map(group => (
            <option key={group.key} value={group.key}>
              {group.label} · {group.count} 筆 · {fmtCurrency(group.amount)}
            </option>
          ))}
        </Select>
      </div>

      {/* 桌機（≥ nav）：橫向 chips，數量多時自動換行 */}
      <div className="hidden flex-wrap items-stretch gap-2 nav:flex">
        {groups.map((group, index) => {
          const active = group.key === selectedKey;
          // 「全部管道」後接的第一個管道項目加上左側分隔線，區隔唯讀總覽與個別管道
          const showDivider = index > 0 && groups[index - 1].key === ALL_GROUP_KEY;
          return (
            <div key={group.key} className={cn('flex shrink-0 items-stretch', showDivider && 'ml-1 border-l border-neutral-blue-gray/20 pl-3')}>
              <button
                type="button"
                onClick={() => onSelect(group.key)}
                title={group.label}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-md border px-3 py-1.5 text-left transition-colors',
                  active ? 'border-brand-blue bg-surface-cream' : 'border-neutral-blue-gray/30 hover:bg-surface-cream',
                )}
              >
                <span className={cn('max-w-[14rem] truncate text-sm', active ? 'font-semibold text-brand-blue' : 'text-neutral-dark')} title={group.label}>
                  {group.label}
                </span>
                <span className={cn('whitespace-nowrap text-xs', active ? 'text-brand-blue' : 'text-neutral-mid')}>
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
