'use client';

import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import { cn, fmtCurrency } from '@/lib/utils';
import { ChevronDown, FileSearch } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReconSubGroup } from '../data';
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
  /** 含停用/未知管道的完整名稱反查表，供顯示該筆交易目前所屬管道／廠商名稱 */
  channelNameByUuid: Map<string, string>;
  /** 目前展開中的交易 uuid，一次僅展開一列；null 代表全部收合 */
  expandedUuid: string | null;
  onToggleExpand: (uuid: string) => void;
}

const HEADER_CLASS = 'text-xs font-semibold text-neutral-mid';

function channelLabel(row: ReconTxnRef, channelNameByUuid: Map<string, string>): string {
  if (!row.channelUuid) return '未分類';
  return channelNameByUuid.get(row.channelUuid) ?? '未知';
}

/** 交易明細頁網址：帶 side 供頁面判斷欄位標籤／稅籍方向，帶 name 沿用清單既有買受人/賣方名稱（發票明細 API 對銷項不含買受人名稱） */
function buildDetailHref(row: ReconTxnRef, side: ReconSide): string {
  const params = new URLSearchParams({ side, name: row.counterparty ?? '' });
  return `/ledger/reconciliation/${row.uuid}?${params.toString()}`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="shrink-0 text-neutral-mid">{label}</span>
      <span className="truncate text-right font-medium text-neutral-dark" title={value}>
        {value}
      </span>
    </div>
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
  channelNameByUuid,
  expanded,
  onToggleExpand,
  onViewDetail,
}: {
  row: ReconTxnRef;
  side: ReconSide;
  selectable: boolean;
  checked: boolean;
  disabled: boolean;
  overage: number;
  onToggle: () => void;
  channelNameByUuid: Map<string, string>;
  expanded: boolean;
  onToggleExpand: () => void;
  onViewDetail: () => void;
}) {
  const secondaryText = side === 'payable' ? row.summary || '—' : row.counterparty || '—';
  const overageMessage = disabled && overage > 0 ? `超出剩餘 ${fmtCurrency(overage)}` : null;
  const chevronClass = cn('shrink-0 text-neutral-blue-gray transition-transform', expanded && 'rotate-180');

  return (
    <div className={cn(disabled ? 'opacity-50' : '')}>
      {/* 行動版：卡片式版面，主體可點擊展開大約資訊；勾選為獨立控件，點擊時不觸發展開 */}
      <div className="flex flex-col gap-2 rounded-lg border border-neutral-blue-gray/30 bg-white p-4 nav:hidden">
        <button type="button" onClick={onToggleExpand} className="flex flex-col gap-1.5 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-neutral-mid">{row.date}</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm font-semibold tabular-nums text-neutral-dark">{fmtCurrency(row.amount)}</span>
              <ChevronDown size={16} className={chevronClass} />
            </div>
          </div>
          <span className="truncate text-sm text-neutral-dark">{secondaryText}</span>
          <span className="font-mono text-xs text-neutral-mid">憑證 {row.voucherNumber || '—'}</span>
          <span className="truncate text-xs text-neutral-mid">{channelLabel(row, channelNameByUuid)}</span>
        </button>
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          {selectable && <Checkbox checked={checked} disabled={disabled} onChange={onToggle} aria-label={`沖帳 ${row.orderCode}`} />}
        </div>
        {overageMessage && <p className="text-xs text-semantic-error">{overageMessage}</p>}
      </div>

      {/* 桌機：欄位化列 */}
      <div className="hidden items-center gap-3 rounded-md px-3 py-2 text-sm nav:flex hover:bg-surface-cream">
        {selectable ? <Checkbox checked={checked} disabled={disabled} onChange={onToggle} aria-label={`沖帳 ${row.orderCode}`} /> : <span className="w-5 shrink-0" />}
        <button type="button" onClick={onToggleExpand} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="w-28 shrink-0 font-mono text-neutral-mid">{row.date}</span>
          <span className="min-w-0 flex-1 truncate text-neutral-dark" title={secondaryText}>
            {secondaryText}
          </span>
          <span className="w-28 shrink-0 truncate font-mono text-neutral-mid">{row.voucherNumber || '—'}</span>
          <span className="w-24 shrink-0 text-right font-mono tabular-nums text-neutral-dark">{fmtCurrency(row.amount)}</span>
          <span className="w-32 shrink-0 truncate text-neutral-mid" title={channelLabel(row, channelNameByUuid)}>
            {channelLabel(row, channelNameByUuid)}
          </span>
        </button>
        <ChevronDown size={16} className={chevronClass} />
      </div>
      {overageMessage && <p className="hidden px-3 text-xs text-semantic-error nav:block">{overageMessage}</p>}

      {/* 展開面板：顯示大約資訊 + 查看詳細按鈕，桌機/行動版共用同一份 markup，靠 Tailwind 響應式 class 調整按鈕寬度 */}
      {expanded && (
        <div className="mt-1 flex flex-col gap-3 rounded-md border border-neutral-blue-gray/20 bg-surface-cream p-4 text-sm">
          <div className="flex flex-col gap-1.5">
            <InfoRow label="開立日期" value={row.date} />
            <InfoRow label={side === 'payable' ? '項目摘要' : '買受人'} value={secondaryText} />
            <InfoRow label="憑證號碼" value={row.voucherNumber || '—'} />
            <InfoRow label="交易金額" value={fmtCurrency(row.amount)} />
            <InfoRow label="銷售管道" value={channelLabel(row, channelNameByUuid)} />
          </div>
          <div className="flex nav:justify-end">
            <Button variant="outline" size="sm" icon={FileSearch} onClick={onViewDetail} className="w-full nav:w-auto">
              查看詳細
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 選定群組下的交易清單：一般群組可逐筆勾選要沖帳的交易（selectable=true）；
 * 「全部管道」為唯讀總覽（selectable=false），僅供瀏覽、看明細。
 * 未勾選且金額超過目前剩餘可沖銷金額（remaining）的交易會被停用；停用原因以 inline 提示標示在該筆交易下方，
 * 而非集中於清單底部的單一錯誤訊息（避免使用者第一眼就看到誤報的錯誤）。
 * 「其他」群組會拆成多個 section（依原始 groupUuid），每個 section 附標題。
 * 每一列固定顯示所屬「銷售管道」名稱（唯讀，後端無編輯單筆交易管道的 API）；點擊列主體就地展開大約資訊，
 * 展開區的「查看詳細」按鈕導向獨立的交易明細頁（串接憑證 API，含照片），而非帳簿的交易編輯頁。
 * 行動版（<1000px）改為卡片式版面，展開行為與桌機一致，避免欄位化列在窄螢幕擠成一行難以操作。
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
  channelNameByUuid,
  expandedUuid,
  onToggleExpand,
}: ReconTxnListProps) {
  const router = useRouter();
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
                channelNameByUuid={channelNameByUuid}
                expanded={expandedUuid === row.uuid}
                onToggleExpand={() => onToggleExpand(row.uuid)}
                onViewDetail={() => router.push(buildDetailHref(row, side))}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
