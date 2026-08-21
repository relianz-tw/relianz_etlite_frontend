'use client';

import { fetchEntryDetail, fetchSettleEventRelations } from '@/api/ledger';
import type { DailyDetailLineDto } from '@/api/types';
import { fmtCurrency } from '@/lib/utils';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface JournalCardProps {
  lines: DailyDetailLineDto[];
  onRetry?: () => void;
  /** 卡片預設是否展開；預設收合 */
  defaultOpen?: boolean;
}

/** 摘要文字中可連結的業務原單：憑證號碼（字軌＋號碼）→ 該原單交易 uuid 與方向 */
interface VoucherLink {
  ledgerUuid: string;
  side: 'sales' | 'purchase';
}

/** entry.entryType：0進項／1進折／2銷項／3銷折；2、3 為銷項，其餘為進項（比照 bank-accounts/data.ts） */
function isSalesEntry(entryType: number): boolean {
  return entryType === 2 || entryType === 3;
}

/** 依日記帳分錄涉及的沖帳事件，反查其業務原單清單，組成「憑證號碼 → 原單交易」對照表，
 *  供摘要文字（如「收款-PO45000001、PO45000005」）逐筆連結至對應的交易內容頁；
 *  查無憑證號碼（如未開發票的原單）者不列入對照表，摘要中僅呈現純文字。 */
async function loadSummaryVoucherLinks(settleEventUuids: string[]): Promise<Map<string, VoucherLink>> {
  const relations = await Promise.all(settleEventUuids.map(uuid => fetchSettleEventRelations({ settleEventUuid: uuid })));
  const originUuids = Array.from(new Set(relations.flatMap(r => r.originLedgerUuids)));
  const details = await Promise.all(originUuids.map(uuid => fetchEntryDetail({ ledgerUuid: uuid })));
  const map = new Map<string, VoucherLink>();
  details.forEach((detail, i) => {
    const { entry, invoice } = detail;
    if (!invoice) return;
    map.set(`${invoice.invoiceTrack}${invoice.invoiceNumber}`, {
      ledgerUuid: originUuids[i],
      side: isSalesEntry(entry.entryType) ? 'sales' : 'purchase',
    });
  });
  return map;
}

/** 摘要卡片：一般文字直接顯示；含已知憑證號碼時可展開，逐筆連結至該原單交易內容頁 */
function SummaryCell({ summary, links }: { summary: string; links: Map<string, VoucherLink> }) {
  const [expanded, setExpanded] = useState(false);
  const matches = Array.from(links.entries()).filter(([voucherNumber]) => summary.includes(voucherNumber));

  if (matches.length === 0) {
    return (
      <span className="block truncate" title={summary}>
        {summary}
      </span>
    );
  }

  return (
    <div>
      <button type="button" onClick={() => setExpanded(e => !e)} className="flex w-full min-w-0 items-center gap-1 text-left">
        <span className="truncate" title={summary}>
          {summary}
        </span>
        {expanded ? (
          <ChevronUp size={12} className="shrink-0 text-neutral-mid" />
        ) : (
          <ChevronDown size={12} className="shrink-0 text-neutral-mid" />
        )}
      </button>
      {expanded && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {matches.map(([voucherNumber, link]) => (
            <Link
              key={link.ledgerUuid}
              href={`/ledger/${link.ledgerUuid}?side=${link.side}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 rounded-full border border-brand-blue/30 bg-brand-blue/5 px-2 py-0.5 font-mono text-[11px] font-semibold text-brand-blue hover:bg-brand-blue/10"
            >
              {voucherNumber}
              <ExternalLink size={10} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** 民國 YYYMMDD → YYY/MM/DD，例 '1150807' → '115/08/07' */
const fmtRocDate = (rocDate: string) => `${rocDate.slice(0, 3)}/${rocDate.slice(3, 5)}/${rocDate.slice(5, 7)}`;


const thClass = 'whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-3 py-2.5 text-sm text-neutral-dark';

/** 依傳票日期 → 傳票號 → 同傳票排序，升冪排列 */
function sortLines(lines: DailyDetailLineDto[]): DailyDetailLineDto[] {
  return lines.slice().sort((a, b) => {
    if (a.rocDate !== b.rocDate) return a.rocDate.localeCompare(b.rocDate);
    if (a.voucherNo !== b.voucherNo) return a.voucherNo.localeCompare(b.voucherNo);
    return a.sortOrder - b.sortOrder;
  });
}

/** 依 rocDate + voucherNo 分組；保留排序後順序 */
function groupByVoucher(sorted: DailyDetailLineDto[]): Array<{ key: string; lines: DailyDetailLineDto[] }> {
  const map = new Map<string, DailyDetailLineDto[]>();
  for (const line of sorted) {
    const key = `${line.rocDate}::${line.voucherNo}`;
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(line);
    } else {
      map.set(key, [line]);
    }
  }
  return Array.from(map.entries()).map(([key, lines]) => ({ key, lines }));
}

/** 日記帳分錄卡片（可展開/收合），依傳票分組呈現；帳簿交易明細頁與銀行交易明細頁共用 */
export default function JournalCard({ lines, defaultOpen = false }: JournalCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [voucherLinks, setVoucherLinks] = useState<Map<string, VoucherLink>>(new Map());

  const sorted = sortLines(lines);
  const groups = groupByVoucher(sorted);

  const settleEventUuids = Array.from(
    new Set(lines.map(line => line.settleEventUuid).filter((uuid): uuid is string => Boolean(uuid))),
  ).sort();
  const settleEventUuidsKey = settleEventUuids.join(',');

  useEffect(() => {
    if (settleEventUuids.length === 0) {
      setVoucherLinks(new Map());
      return;
    }
    let cancelled = false;
    loadSummaryVoucherLinks(settleEventUuids).then(map => {
      if (!cancelled) setVoucherLinks(map);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settleEventUuidsKey]);

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-sm font-semibold text-neutral-dark"
      >
        日記帳（{lines.length}）
        {open ? <ChevronUp size={16} className="text-neutral-mid" /> : <ChevronDown size={16} className="text-neutral-mid" />}
      </button>

      {open && (
        <div className="mt-3 border-t border-neutral-blue-gray/20 pt-3">
          {lines.length === 0 ? (
            <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">尚無日記帳分錄</div>
          ) : (
            <>
              {/* 桌面版：表格 */}
              <div className="hidden nav:block overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-neutral-blue-gray/40 bg-surface-off-white">
                      <th className={thClass}>傳票日期</th>
                      <th className={thClass}>傳票編號</th>
                      <th className={thClass}>會計科目</th>
                      <th className={thClass}>摘要</th>
                      <th className={`${thClass} text-right`}>借方金額</th>
                      <th className={`${thClass} text-right`}>貸方金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map(({ key, lines: groupLines }) =>
                      groupLines.map((line, idx) => {
                        const isFirst = idx === 0;
                        const isEven = groups.findIndex(g => g.key === key) % 2 === 0;
                        return (
                          <tr
                            key={line.lineUuid}
                            className={`border-b border-neutral-blue-gray/20 hover:bg-brand-blue/5 ${isEven ? '' : 'bg-surface-warm/30'}`}
                          >
                            <td className={tdClass}>{isFirst ? fmtRocDate(line.rocDate) : ''}</td>
                            <td className={`${tdClass} font-mono`}>{isFirst ? line.voucherNo : ''}</td>
                            <td className={tdClass}>{line.subjectName}</td>
                            <td className={`${tdClass} max-w-[200px]`}>
                              <SummaryCell summary={line.summary} links={voucherLinks} />
                            </td>
                            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>
                              {line.debitCredit === '1' ? fmtCurrency(line.amount) : '$0'}
                            </td>
                            <td className={`${tdClass} text-right font-mono font-semibold tabular-nums`}>
                              {line.debitCredit === '2' ? fmtCurrency(line.amount) : '$0'}
                            </td>
                          </tr>
                        );
                      }),
                    )}
                  </tbody>
                </table>
              </div>

              {/* 手機版：以傳票為單位的卡片列表 */}
              <div className="flex flex-col gap-3 nav:hidden">
                {groups.map(({ key, lines: groupLines }) => {
                  const first = groupLines[0];
                  return (
                    <div key={key} className="rounded-lg border border-neutral-blue-gray/30 bg-white p-3">
                      {/* 卡片標題：日期 · 類別 badge · 傳票號 */}
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-neutral-mid">
                        <span className="font-semibold text-neutral-dark">{fmtRocDate(first.rocDate)}</span>
                        <span className="font-mono">{first.voucherNo}</span>
                      </div>

                      {/* 分錄列表 */}
                      <div className="flex flex-col divide-y divide-neutral-blue-gray/15">
                        {groupLines.map(line => (
                          <div key={line.lineUuid} className="flex items-start justify-between gap-2 py-1.5">
                            <div className="flex min-w-0 flex-col">
                              <span className="text-sm font-medium text-neutral-dark">{line.subjectName}</span>
                              {line.summary && (
                                <div className="text-xs text-neutral-mid">
                                  <SummaryCell summary={line.summary} links={voucherLinks} />
                                </div>
                              )}
                            </div>
                            <span
                              className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${line.debitCredit === '1' ? 'text-neutral-dark' : 'text-semantic-error'}`}
                            >
                              {line.debitCredit === '1' ? '借 ' : '貸 '}
                              {fmtCurrency(line.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
