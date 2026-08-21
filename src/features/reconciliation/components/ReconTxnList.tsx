'use client';

import { fetchEntryDetail } from '@/api/ledger';
import type { EntryDetailResult, SettleLedgerAllocation } from '@/api/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import EntryVoucherModal from '@/components/ui/EntryVoucherModal';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { cn, fmtCurrency } from '@/lib/utils';
import { ChevronDown, FileSearch } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReconSubGroup } from '../data';
import type { ReconMode, ReconSide, ReconTxnRef } from '../types';

/** 供 ReconciliationView 在清單卡標題列渲染「全選本管道」連結：目前（該群組全部）可勾選的交易 uuid
 * （待收/付金額為負代表已超沖，不可選）。純函式，與 ReconTxnList 內部搜尋/篩選無關（本版已移除清單內搜尋）。 */
export function getSelectableUuids(sections: ReconSubGroup[]): string[] {
  return sections.flatMap(s => s.rows).filter(r => (r.remainingAmount ?? r.amount) >= 0).map(r => r.uuid);
}

interface ReconTxnListProps {
  side: ReconSide;
  /** 一般群組僅一個 section（label 不顯示）；「其他」群組會拆成多個依原始 groupUuid 分組的 section */
  sections: ReconSubGroup[];
  showSectionHeaders: boolean;
  /** 是否顯示最左側的狀態／選取欄；「全部管道」在匯總模式下為唯讀總覽時傳 false */
  showStatusColumn: boolean;
  /** 決定該欄的互動方式：perTxn 為可勾選的選取圓圈（複選），summary 為唯讀的拆帳狀態圓圈 */
  mode: ReconMode;
  emptyMessage: string;
  /** 含停用/未知管道的完整名稱反查表，供顯示該筆交易目前所屬管道／廠商名稱 */
  channelNameByUuid: Map<string, string>;
  /** 目前展開中的交易 uuid，一次僅展開一列；null 代表全部收合 */
  expandedUuid: string | null;
  onToggleExpand: (uuid: string) => void;
  /** 已有預覽拆帳結果時，依 ledgerUuid 對應到該筆的拆帳狀態；純顯示用途，不可編輯（summary 模式使用） */
  allocationByUuid: Map<string, SettleLedgerAllocation>;
  /** perTxn 模式下已勾選的交易 uuid（可複選） */
  selectedUuids: Set<string>;
  /** perTxn 模式下切換單筆勾選狀態 */
  onToggleSelect: (uuid: string) => void;
}

const HEADER_CLASS = 'text-xs font-semibold text-neutral-mid';

/** settlementStatus：0平衡 1超沖 2少沖 */
const SETTLEMENT_STATUS_BADGE: Record<number, { label: string; tone: 'success' | 'error' | 'info' }> = {
  0: { label: '平衡', tone: 'success' },
  1: { label: '超沖', tone: 'error' },
  2: { label: '少沖', tone: 'info' },
};

function channelLabel(row: ReconTxnRef, channelNameByUuid: Map<string, string>): string {
  if (!row.channelUuid) return '未分類';
  return channelNameByUuid.get(row.channelUuid) ?? '未知';
}

/** 桌機交易金額欄：$ 固定貼齊欄位左緣、數字貼齊欄位右緣，讓同一欄內每列的 $ 對齊在同一直排 */
function AmountCell({ amount }: { amount: number }) {
  return (
    <span className="flex w-28 shrink-0 items-center justify-between font-mono tabular-nums text-neutral-dark">
      <span className="text-neutral-mid">$</span>
      <span>{amount.toLocaleString('en-US')}</span>
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-start gap-0.5 nav:flex-row nav:items-center nav:justify-between nav:gap-4">
      <span className="shrink-0 text-neutral-mid">{label}</span>
      <span className="break-all text-left font-medium text-neutral-dark nav:truncate nav:text-right" title={value}>
        {value}
      </span>
    </div>
  );
}

/** 沖帳狀態圓圈（唯讀不可點擊，匯總模式使用）：已結清為實心勾；本次有分配但未結清（少沖／超沖）為實心橫線，
 * 讓使用者仍能一眼看出這筆本次有被分配到，只是尚未沖平；尚無預覽結果或未分配時為空心圓 */
function StatusCircle({ allocation }: { allocation?: SettleLedgerAllocation }) {
  return (
    <Checkbox
      checked={!!allocation?.closed}
      indeterminate={!!allocation && !allocation.closed}
      disabled
      shape="circle"
      onChange={() => {}}
      aria-label="沖帳狀態（僅供檢視）"
    />
  );
}

/** 選取圓圈：單筆／多筆沖帳模式用，可點擊勾選要沖帳的交易（單筆模式單選、多筆模式複選，由呼叫端 onToggleSelect 決定行為） */
function SelectCircle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return <Checkbox checked={checked} shape="circle" onChange={onToggle} aria-label="選取此筆進行沖帳" />;
}

/**
 * 展開面板懶載入的憑證明細：對帳中心清單 API 不含憑證資料，僅在使用者實際展開該列時才呼叫
 * GET /ael/ledger/entries/detail 補齊憑證號碼／統一編號／開立日期，避免整頁一次打上百支請求。
 * 已抓過的結果留在 state 內，收合再展開不重複請求。
 */
function useLazyEntryDetail(ledgerUuid: string, expanded: boolean) {
  const [detail, setDetail] = useState<EntryDetailResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!expanded || fetched) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchEntryDetail({ ledgerUuid })
      .then(result => {
        if (cancelled) return;
        setDetail(result);
        setFetched(true);
      })
      .catch(err => {
        if (!cancelled) setError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expanded, fetched, ledgerUuid]);

  return { detail, loading, error };
}

function TxnRow({
  row,
  side,
  showStatusColumn,
  mode,
  allocation,
  selected,
  onToggleSelect,
  channelNameByUuid,
  expanded,
  onToggleExpand,
}: {
  row: ReconTxnRef;
  side: ReconSide;
  showStatusColumn: boolean;
  mode: ReconMode;
  allocation?: SettleLedgerAllocation;
  selected: boolean;
  onToggleSelect: () => void;
  channelNameByUuid: Map<string, string>;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  // 已有預覽結果、該筆尚未結清（少沖／超沖仍有殘餘）時，於金額旁標示狀態徽章，讓使用者一眼看出差異落在哪一筆
  const statusBadge = allocation && !allocation.closed ? (SETTLEMENT_STATUS_BADGE[allocation.settlementStatus] ?? null) : null;
  const chevronClass = cn('shrink-0 text-neutral-blue-gray transition-transform', expanded && 'rotate-180');
  // 待沖金額為負代表此筆已超沖（remainingAmount 定義見 types.ts），不應再被挑去參與沖帳，否則會疊加出更離譜的超沖
  const remainingAmount = row.remainingAmount ?? row.amount;
  const isNegativeRemaining = remainingAmount < 0;
  // 逐筆沖帳可勾選（複選，勾 1 筆走手動沖帳 API、勾多筆走 summary API，見 ReconciliationView）；匯總沖帳僅唯讀顯示拆帳狀態
  const isSelectable = mode === 'perTxn' && !isNegativeRemaining;
  const negativeRemainingBadge = mode !== 'summary' && isNegativeRemaining ? { label: '超沖', tone: 'error' as const } : null;
  const badge = statusBadge ?? negativeRemainingBadge;
  const { detail, loading: detailLoading, error: detailError } = useLazyEntryDetail(row.uuid, expanded);
  const invoice = detail?.invoice;
  const taxId = invoice ? (side === 'receivable' ? invoice.buyerTaxIdNumber : invoice.sellerTaxIdNumber) : '';
  const [voucherOpen, setVoucherOpen] = useState(false);

  // 展開面板可能出現在螢幕外（清單靠下方時），展開瞬間捲動到可視範圍，避免使用者以為點擊沒有反應
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (expanded) panelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [expanded]);

  return (
    <div>
      {/* 行動版：精簡列，整列點擊＝勾選（僅 isSelectable 時可點），右側獨立 chevron 展開大約資訊；
          買受人／銷售管道等細節不在列上重複顯示，統一收在展開面板（見下方 InfoRow） */}
      <div className={cn('flex items-center gap-1 rounded-lg border border-neutral-blue-gray/30 bg-white pr-1 nav:hidden', isSelectable && selected && 'border-brand-blue bg-brand-blue/5')}>
        <button
          type="button"
          onClick={isSelectable ? onToggleSelect : undefined}
          disabled={!isSelectable}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2 text-left disabled:cursor-default"
        >
          {showStatusColumn &&
            (isSelectable ? <SelectCircle checked={selected} onToggle={onToggleSelect} /> : <StatusCircle allocation={allocation} />)}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-mono text-sm font-semibold text-neutral-dark" title={row.voucherNumber}>
              {row.voucherNumber || '—'}
            </span>
            <span className="block truncate text-xs text-neutral-mid">
              {row.date || '—'} · {channelLabel(row, channelNameByUuid)}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {badge && (
              <Badge tone={badge.tone} variant="muted">
                {badge.label}
              </Badge>
            )}
            <span className="whitespace-nowrap font-mono text-sm font-semibold tabular-nums text-neutral-dark">{fmtCurrency(remainingAmount)}</span>
          </span>
        </button>
        <button type="button" onClick={onToggleExpand} aria-label="展開明細" className="flex min-h-11 w-11 shrink-0 items-center justify-center">
          <ChevronDown size={16} className={chevronClass} />
        </button>
      </div>

      {/* 桌機：欄位化列 */}
      <div
        className={cn(
          'hidden items-center gap-3 rounded-md px-3 py-2 text-sm nav:flex hover:bg-surface-cream',
          isSelectable && selected && 'bg-brand-blue/5 hover:bg-brand-blue/5',
        )}
      >
        {showStatusColumn ? (
          <button
            type="button"
            onClick={isSelectable ? onToggleSelect : undefined}
            disabled={!isSelectable}
            aria-label={isSelectable ? '選取此筆進行沖帳' : undefined}
            className="flex w-10 shrink-0 items-center justify-center disabled:cursor-default"
          >
            {isSelectable ? (
              <SelectCircle checked={selected} onToggle={onToggleSelect} />
            ) : (
              <StatusCircle allocation={allocation} />
            )}
          </button>
        ) : (
          <span className="w-10 shrink-0" />
        )}
        <button type="button" onClick={onToggleExpand} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="w-28 shrink-0 font-mono text-neutral-mid">{row.date || '—'}</span>
          <div className="flex w-48 min-w-0 shrink-0 flex-col">
            <span className="truncate font-mono font-semibold text-neutral-dark" title={row.voucherNumber}>
              {row.voucherNumber || '—'}
            </span>
            <span className="truncate text-xs text-neutral-mid" title={row.counterparty}>
              {row.counterparty || '—'}
            </span>
          </div>
          <AmountCell amount={remainingAmount} />
          <span className="ml-3 min-w-0 flex-1 truncate text-neutral-mid" title={channelLabel(row, channelNameByUuid)}>
            {channelLabel(row, channelNameByUuid)}
          </span>
          {badge && (
            <Badge tone={badge.tone} variant="muted">
              {badge.label}
            </Badge>
          )}
          <ChevronDown size={16} className={chevronClass} />
        </button>
      </div>

      {/* 展開面板：交易編號／買受人／憑證號碼／憑證開立日期／金額／管道為清單既有資料即時顯示；統一編號
          懶載入自 GET /ael/ledger/entries/detail，緊接在買受人下方，桌機/行動版共用同一份 markup */}
      {expanded && (
        <div ref={panelRef} className="mt-1 flex scroll-mt-16 flex-col gap-3 rounded-md border border-neutral-blue-gray/20 bg-surface-cream p-4 text-sm">
          <div className="flex flex-col gap-1.5">
            <InfoRow label="交易編號" value={row.orderCode || '—'} />
            <InfoRow label={side === 'payable' ? '賣方' : '買受人'} value={row.counterparty || '—'} />
            {detailLoading ? (
              <p className="text-xs text-neutral-mid">統一編號載入中…</p>
            ) : detailError ? (
              <p className="text-xs text-semantic-error">{detailError}</p>
            ) : detail && !invoice ? (
              <p className="text-xs text-neutral-mid">此交易尚無對應憑證</p>
            ) : invoice ? (
              <InfoRow label="統一編號" value={taxId || '—'} />
            ) : null}
            <InfoRow label="憑證號碼" value={row.voucherNumber || '—'} />
            <InfoRow label="憑證開立日期" value={row.date || '—'} />
            <InfoRow label={side === 'payable' ? '待付金額' : '待收金額'} value={fmtCurrency(remainingAmount)} />
            <InfoRow label={side === 'payable' ? '廠商' : '銷售管道'} value={channelLabel(row, channelNameByUuid)} />
            {allocation && (
              <>
                <InfoRow label="本次沖帳額" value={fmtCurrency(allocation.settleAmount)} />
                <InfoRow label="沖後剩餘" value={fmtCurrency(allocation.afterRemaining)} />
              </>
            )}
          </div>
          <div className="flex nav:justify-end">
            <Button variant="outline" size="sm" icon={FileSearch} onClick={() => setVoucherOpen(true)} className="w-full nav:w-auto">
              查看憑證明細
            </Button>
          </div>
          <EntryVoucherModal
            open={voucherOpen}
            onClose={() => setVoucherOpen(false)}
            ledgerUuid={row.uuid}
            side={side === 'receivable' ? 'sales' : 'purchase'}
            // 展開列的懶載入若還在進行中（detailLoading），不要把尚未到位的 null 當成「已載入」傳給彈窗，
            // 否則彈窗會直接顯示空欄位、不會自行重新查詢；改傳 undefined 讓彈窗照常自己打 API
            preloadedDetail={detailLoading ? undefined : detail}
          />
        </div>
      )}
    </div>
  );
}

/**
 * 選定群組下的交易清單：
 * - 匯總沖帳（mode='summary'）：純檢視用途，不提供勾選編輯——沖帳對象與拆帳結果一律由後端預覽 API
 *   （settle/preview）決定，前端僅將結果（allocationByUuid）疊加回本地清單顯示。「全部管道」為唯讀總覽
 *   （showStatusColumn=false），不顯示狀態圓圈。
 * - 逐筆沖帳（mode='perTxn'）：狀態欄改為可點擊的選取圓圈（複選），由使用者勾選要沖帳的交易——
 *   勾 1 筆走手動沖帳 API、勾多筆走 summary API（分流邏輯見 ReconciliationView），畫面上不需要先選模式。
 * 「其他」群組會拆成多個 section（依原始 groupUuid），每個 section 附標題。
 * 每一列固定顯示所屬「銷售管道／廠商」名稱（唯讀，後端無編輯單筆交易管道的 API）；點擊桌機列主體或行動版
 * 右側 chevron 就地展開大約資訊，展開區另顯示已預覽的本次沖帳額／沖後剩餘（或逐筆沖帳的待付／待收金額），
 * 「查看憑證明細」按鈕開啟與建立折讓單畫面共用的 EntryVoucherModal（見 @/components/ui/EntryVoucherModal），
 * 呈現同一份憑證資料與版面，不離開沖帳流程。
 * 行動版（<1000px）改為精簡列（勾選圓圈／狀態圓圈＋憑證號碼＋日期·管道＋金額），整列點擊＝勾選、
 * chevron 才展開明細，避免欄位化列在窄螢幕擠成一行難以操作；買受人等次要欄位收進展開面板。
 *
 * 本版已移除清單頂部的搜尋欄與工具列（見 getSelectableUuids）：「全選本管道」與已選筆數／金額改由呼叫端
 * （ReconciliationView）在清單卡標題列與右側金額面板呈現，此元件僅負責清單本身的顯示與勾選互動。
 */
export default function ReconTxnList({
  side,
  sections,
  showSectionHeaders,
  showStatusColumn,
  mode,
  emptyMessage,
  channelNameByUuid,
  expandedUuid,
  onToggleExpand,
  allocationByUuid,
  selectedUuids,
  onToggleSelect,
}: ReconTxnListProps) {
  const totalRows = sections.reduce((sum, s) => sum + s.rows.length, 0);

  if (totalRows === 0) {
    return <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">{emptyMessage}</div>;
  }

  return (
    <div className="flex flex-col gap-2 nav:gap-1">
      <div className="hidden items-center gap-3 border-b border-neutral-blue-gray/20 px-3 pb-2 nav:flex">
        <span className={cn(HEADER_CLASS, 'w-10 shrink-0 text-center')}>{showStatusColumn && mode === 'perTxn' ? '選取' : ''}</span>
        <span className={cn(HEADER_CLASS, 'w-28 shrink-0')}>開立日期</span>
        <span className={cn(HEADER_CLASS, 'w-48 shrink-0')}>{side === 'payable' ? '憑證號碼／賣方' : '憑證號碼／買受人'}</span>
        <span className={cn(HEADER_CLASS, 'w-28 shrink-0 text-right')}>{side === 'payable' ? '待付金額' : '待收金額'}</span>
        <span className={cn(HEADER_CLASS, 'ml-3 min-w-0 flex-1')}>{side === 'payable' ? '廠商' : '銷售管道'}</span>
        <span className="w-4 shrink-0" />
      </div>

      {sections.map(section => (
        <div key={section.key} className="flex flex-col gap-2 nav:gap-1">
          {showSectionHeaders && section.rows.length > 0 && (
            <p className="mb-1 mt-3 px-1 text-xs font-semibold text-neutral-mid first:mt-2 nav:px-3">
              {section.label}（{section.rows.length}）
            </p>
          )}
          {section.rows.map(row => (
            <TxnRow
              key={row.uuid}
              row={row}
              side={side}
              showStatusColumn={showStatusColumn}
              mode={mode}
              allocation={allocationByUuid.get(row.uuid)}
              selected={selectedUuids.has(row.uuid)}
              onToggleSelect={() => onToggleSelect(row.uuid)}
              channelNameByUuid={channelNameByUuid}
              expanded={expandedUuid === row.uuid}
              onToggleExpand={() => onToggleExpand(row.uuid)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
