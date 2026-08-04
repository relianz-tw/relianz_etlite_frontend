'use client';

import Checkbox from '@/components/ui/Checkbox';
import Select from '@/components/ui/Select';
import { cn, fmtCurrency } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import type { ReconGroupOption, ReconSubGroup } from '../data';
import type { ReconSide, ReconTxnRef } from '../types';

interface ReconTxnListProps {
  side: ReconSide;
  /** 一般群組僅一個 section（label 不顯示）；「其他」群組會拆成多個依原始 groupUuid 分組的 section */
  sections: ReconSubGroup[];
  showSectionHeaders: boolean;
  /** 「全部管道」為唯讀總覽，不提供沖帳勾選 */
  selectable: boolean;
  checkedIds: Set<string>;
  disabledIds: Set<string>;
  onToggle: (uuid: string) => void;
  emptyMessage: string;
  pool: number;
  remaining: number;
  /** 每列固定的「銷售管道」欄位可選項（啟用中管道/廠商） */
  channelOptions: ReconGroupOption[];
  /** 含停用/未知管道的完整名稱反查表，供顯示目前非啟用中管道時仍能呈現名稱而非 uuid */
  channelNameByUuid: Map<string, string>;
  onChannelChange: (uuid: string, channelUuid: string) => void;
  onRowClick: (row: ReconTxnRef) => void;
}

const HEADER_CLASS = 'text-xs font-semibold text-neutral-mid';
const UNCLASSIFIED_VALUE = '';

function ChannelSelect({
  row,
  widthClassName,
  channelOptions,
  channelNameByUuid,
  onChannelChange,
}: {
  row: ReconTxnRef;
  widthClassName: string;
  channelOptions: ReconGroupOption[];
  channelNameByUuid: Map<string, string>;
  onChannelChange: (channelUuid: string) => void;
}) {
  const currentInList = channelOptions.some(o => o.uuid === row.channelUuid);
  // 目前管道已停用或不在啟用清單中時，額外補一個選項顯示其名稱，避免下拉直接露出 uuid 原始字串
  const extraOption = row.channelUuid && !currentInList ? { uuid: row.channelUuid, name: channelNameByUuid.get(row.channelUuid) ?? '未知管道' } : null;

  return (
    <Select widthClassName={widthClassName} value={row.channelUuid ?? UNCLASSIFIED_VALUE} onValueChange={onChannelChange}>
      <option value={UNCLASSIFIED_VALUE}>未分類</option>
      {extraOption && <option value={extraOption.uuid}>{extraOption.name}（非啟用中）</option>}
      {channelOptions.map(opt => (
        <option key={opt.uuid} value={opt.uuid}>
          {opt.name}
        </option>
      ))}
    </Select>
  );
}

function TxnRow({
  row,
  side,
  selectable,
  checked,
  disabled,
  overage,
  onToggle,
  channelOptions,
  channelNameByUuid,
  onChannelChange,
  onOpenDetail,
}: {
  row: ReconTxnRef;
  side: ReconSide;
  selectable: boolean;
  checked: boolean;
  disabled: boolean;
  overage: number;
  onToggle: () => void;
  channelOptions: ReconGroupOption[];
  channelNameByUuid: Map<string, string>;
  onChannelChange: (channelUuid: string) => void;
  onOpenDetail: () => void;
}) {
  const secondaryText = side === 'payable' ? row.summary || '—' : row.counterparty || '—';
  const overageMessage = disabled && overage > 0 ? `超出剩餘 ${fmtCurrency(overage)}` : null;

  return (
    <div className={cn(disabled ? 'opacity-50' : '')}>
      {/* 行動版：卡片式版面，主體可點擊看明細；勾選與管道變更為獨立控件，點擊時不觸發明細 */}
      <div className="flex flex-col gap-2 rounded-lg border border-neutral-blue-gray/30 bg-white p-4 nav:hidden">
        <button type="button" onClick={onOpenDetail} className="flex flex-col gap-1.5 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-neutral-mid">{row.date}</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm font-semibold tabular-nums text-neutral-dark">{fmtCurrency(row.amount)}</span>
              <ChevronRight size={16} className="shrink-0 text-neutral-blue-gray" />
            </div>
          </div>
          <span className="truncate text-sm text-neutral-dark">{secondaryText}</span>
          <span className="font-mono text-xs text-neutral-mid">憑證 {row.voucherNumber || '—'}</span>
        </button>
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          {selectable && <Checkbox checked={checked} disabled={disabled} onChange={onToggle} aria-label={`沖帳 ${row.orderCode}`} />}
          <div className="min-w-0 flex-1">
            <ChannelSelect
              row={row}
              widthClassName="w-full"
              channelOptions={channelOptions}
              channelNameByUuid={channelNameByUuid}
              onChannelChange={onChannelChange}
            />
          </div>
        </div>
        {overageMessage && <p className="text-xs text-semantic-error">{overageMessage}</p>}
      </div>

      {/* 桌機：欄位化列 */}
      <div className="hidden items-center gap-3 rounded-md px-3 py-2 text-sm nav:flex hover:bg-surface-cream">
        {selectable ? <Checkbox checked={checked} disabled={disabled} onChange={onToggle} aria-label={`沖帳 ${row.orderCode}`} /> : <span className="w-5 shrink-0" />}
        <button type="button" onClick={onOpenDetail} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="w-28 shrink-0 font-mono text-neutral-mid">{row.date}</span>
          <span className="min-w-0 flex-1 truncate text-neutral-dark" title={secondaryText}>
            {secondaryText}
          </span>
          <span className="w-28 shrink-0 truncate font-mono text-neutral-mid">{row.voucherNumber || '—'}</span>
          <span className="w-24 shrink-0 text-right font-mono tabular-nums text-neutral-dark">{fmtCurrency(row.amount)}</span>
        </button>
        <div onClick={e => e.stopPropagation()}>
          <ChannelSelect
            row={row}
            widthClassName="w-32"
            channelOptions={channelOptions}
            channelNameByUuid={channelNameByUuid}
            onChannelChange={onChannelChange}
          />
        </div>
        <ChevronRight size={16} className="shrink-0 text-neutral-blue-gray" />
      </div>
      {overageMessage && <p className="hidden px-3 text-xs text-semantic-error nav:block">{overageMessage}</p>}
    </div>
  );
}

/**
 * 選定群組下的交易清單：一般群組可逐筆勾選要沖帳的交易（selectable=true）；
 * 「全部管道」為唯讀總覽（selectable=false），僅供瀏覽、看明細、調整銷售管道。
 * 未勾選且金額超過目前剩餘可沖銷金額（remaining）的交易會被停用；停用原因以 inline 提示標示在該筆交易下方，
 * 而非集中於清單底部的單一錯誤訊息（避免使用者第一眼就看到誤報的錯誤）。
 * 「其他」群組會拆成多個 section（依原始 groupUuid），每個 section 附標題。
 * 每一列固定顯示「銷售管道」下拉，可隨時變更歸類；點擊列主體開啟交易明細 dialog。
 * 行動版（<1000px）改為卡片式版面，避免欄位化列在窄螢幕擠成一行難以操作。
 */
export default function ReconTxnList({
  side,
  sections,
  showSectionHeaders,
  selectable,
  checkedIds,
  disabledIds,
  onToggle,
  emptyMessage,
  pool,
  remaining,
  channelOptions,
  channelNameByUuid,
  onChannelChange,
  onRowClick,
}: ReconTxnListProps) {
  const totalRows = sections.reduce((sum, s) => sum + s.rows.length, 0);
  if (totalRows === 0) {
    return <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">{emptyMessage}</div>;
  }

  return (
    <div className="flex flex-col gap-2 nav:gap-1">
      <div className="hidden items-center gap-3 border-b border-neutral-blue-gray/20 px-3 pb-2 nav:flex">
        <span className="w-5 shrink-0" />
        <span className={cn(HEADER_CLASS, 'w-28 shrink-0')}>開立日期</span>
        <span className={cn(HEADER_CLASS, 'min-w-0 flex-1')}>{side === 'payable' ? '項目摘要' : '買受人'}</span>
        <span className={cn(HEADER_CLASS, 'w-28 shrink-0')}>憑證號碼</span>
        <span className={cn(HEADER_CLASS, 'w-24 shrink-0 text-right')}>交易金額</span>
        <span className={cn(HEADER_CLASS, 'w-32 shrink-0')}>銷售管道</span>
        <span className="w-4 shrink-0" />
      </div>

      {sections.map(section => (
        <div key={section.key} className="flex flex-col gap-2 nav:gap-1">
          {showSectionHeaders && (
            <p className="mb-1 mt-3 px-1 text-xs font-semibold text-neutral-mid first:mt-2 nav:px-3">
              {section.label}（{section.rows.length}）
            </p>
          )}
          {section.rows.map(row => {
            const checked = checkedIds.has(row.uuid);
            const disabled = selectable && !checked && disabledIds.has(row.uuid);
            return (
              <TxnRow
                key={row.uuid}
                row={row}
                side={side}
                selectable={selectable}
                checked={checked}
                disabled={disabled}
                overage={pool > 0 ? row.amount - remaining : 0}
                onToggle={() => onToggle(row.uuid)}
                channelOptions={channelOptions}
                channelNameByUuid={channelNameByUuid}
                onChannelChange={value => onChannelChange(row.uuid, value)}
                onOpenDetail={() => onRowClick(row)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
