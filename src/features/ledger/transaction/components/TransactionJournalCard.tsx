'use client';

import type { DailyDetailLineDto } from '@/api/types';
import { fmtCurrency } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface TransactionJournalCardProps {
  lines: DailyDetailLineDto[];
  onRetry?: () => void;
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

export default function TransactionJournalCard({ lines, onRetry }: TransactionJournalCardProps) {
  const [open, setOpen] = useState(false);

  const sorted = sortLines(lines);
  const groups = groupByVoucher(sorted);

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-4">
      {/* 標題列（可點擊展開/收合） */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold text-neutral-dark"
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
                            <td className={`${tdClass} max-w-[200px] truncate`} title={line.summary}>
                              {line.summary}
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
                                <span className="truncate text-xs text-neutral-mid" title={line.summary}>
                                  {line.summary}
                                </span>
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
