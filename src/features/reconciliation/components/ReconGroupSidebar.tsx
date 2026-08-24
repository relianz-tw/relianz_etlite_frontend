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
 * 選項文字帶入名稱與筆數／金額，方便管道多時直接搜尋比對。「全部管道」（桌機版）獨立為卡片並永久填色，
 * 其後個別管道群組包在淺底框容器內，兩塊背景區隔讓總覽與個別管道選取前就能一眼分辨（見 DESIGN.md
 * 「Group Chip」）。
 */
export default function ReconGroupSidebar({ side, groups, selectedKey, onSelect }: ReconGroupSidebarProps) {
  const stepLabel = side === 'receivable' ? '選擇銷售管道' : '選擇廠商';
  const allGroup = groups.find(group => group.key === ALL_GROUP_KEY);
  const channelGroups = groups.filter(group => group.key !== ALL_GROUP_KEY);

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

      {/* 桌機（≥ nav）：「全部」獨立卡片＋個別管道群組淺底框，兩塊背景區隔一眼可辨 */}
      <div className="hidden items-stretch gap-3 nav:flex">
        {allGroup && (
          <button
            type="button"
            onClick={() => onSelect(allGroup.key)}
            title={allGroup.label}
            className={cn(
              'flex shrink-0 flex-col items-start gap-0.5 rounded-md border px-4 py-2.5 text-left transition-colors',
              allGroup.key === selectedKey
                ? 'border-brand-blue bg-brand-blue'
                : 'border-neutral-blue-gray/30 bg-surface-cream hover:bg-surface-cream/70',
            )}
          >
            <span className={cn('max-w-[14rem] truncate text-sm font-semibold', allGroup.key === selectedKey ? 'text-white' : 'text-neutral-dark')}>
              {allGroup.label}
            </span>
            <span className={cn('whitespace-nowrap text-xs', allGroup.key === selectedKey ? 'text-white/80' : 'text-neutral-mid')}>
              {allGroup.count} 筆 · {fmtCurrency(allGroup.amount)}
            </span>
          </button>
        )}

        <div className="flex flex-1 flex-wrap items-stretch gap-2 rounded-md border border-neutral-blue-gray/20 bg-surface-off-white p-2">
          {channelGroups.map((group) => {
            const active = group.key === selectedKey;
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => onSelect(group.key)}
                title={group.label}
                className={cn(
                  'flex shrink-0 flex-col items-start gap-0.5 rounded-md border bg-white px-3 py-1.5 text-left transition-colors',
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
