'use client';

import type { DailyDetailLineDto } from '@/api/types';
import { fmtCurrency } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { JournalDateGroup } from './journalGrouping';

const thClass = 'px-3 py-2.5 text-left text-xs font-semibold text-neutral-mid whitespace-nowrap';
const tdClass = 'px-3 py-2 text-sm text-neutral-dark whitespace-nowrap';

/** 民國 YYYMMDD → YYY/MM/DD */
const fmtRocDate = (d: string) => `${d.slice(0, 3)}/${d.slice(3, 5)}/${d.slice(5, 7)}`;

interface JournalOverviewListProps {
  groups: JournalDateGroup[];
}

/** 桌機版：一個大 table，日期 group header 用 colSpan=7 的 tr 插入；手機版：flex div 流 */
export default function JournalOverviewList({ groups }: JournalOverviewListProps) {
  return (
    <>
      {/* 桌機版 */}
      <div className="hidden nav:block overflow-x-auto rounded-md border border-neutral-blue-gray/30 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-blue-gray/40 bg-surface-off-white">
              <th className={thClass}>傳票日期</th>
              <th className={thClass}>傳票編號</th>
              <th className={thClass}>會計科目</th>
              <th className={thClass}>摘要</th>
              <th className={`${thClass} text-right`}>借方金額</th>
              <th className={`${thClass} text-right`}>貸方金額</th>
              <th className="w-10 px-2" />
            </tr>
          </thead>
          <tbody>
            {groups.map((group, gIdx) => (
              <>
                {/* 日期分組標頭列 */}
                <tr key={`header-${group.dateKey}`} className={gIdx > 0 ? 'border-t border-neutral-blue-gray/30' : ''}>
                  <td colSpan={7} className="bg-surface-off-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-[3px] shrink-0 rounded-full bg-brand-blue" />
                      <span className="text-[15px] font-semibold text-neutral-dark">{group.label}</span>
                    </div>
                  </td>
                </tr>

                {/* 該日期的傳票分錄行 */}
                {group.vouchers.map(voucher =>
                  voucher.lines.map((line: DailyDetailLineDto, lineIdx: number) => {
                    const isFirst = lineIdx === 0;
                    return (
                      <tr
                        key={line.lineUuid}
                        className="border-b border-neutral-blue-gray/15 hover:bg-brand-blue/5"
                      >
                        <td className={tdClass}>{isFirst ? fmtRocDate(line.rocDate) : ''}</td>
                        <td className={`${tdClass} font-mono`}>{isFirst ? line.voucherNo : ''}</td>
                        <td className={tdClass}>{line.subjectName}</td>
                        <td className={`${tdClass} max-w-[200px] truncate`} title={line.summary}>{line.summary}</td>
                        <td className={`${tdClass} text-right font-mono tabular-nums`}>
                          {line.debitCredit === '1' ? fmtCurrency(line.amount) : ''}
                        </td>
                        <td className={`${tdClass} text-right font-mono tabular-nums`}>
                          {line.debitCredit === '2' ? fmtCurrency(line.amount) : ''}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {isFirst && (
                            <Link
                              href={`/ledger/${voucher.ledgerUuid}`}
                              title="查看原交易"
                              className="inline-flex items-center rounded p-1 text-neutral-mid hover:text-brand-blue"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  }),
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* 手機版 */}
      <div className="flex flex-col gap-4 nav:hidden">
        {groups.map((group, gIdx) => (
          <div key={group.dateKey} className={gIdx > 0 ? 'border-t border-neutral-blue-gray/20 pt-4' : ''}>
            {/* 日期 group header */}
            <div className="mb-3 flex items-center gap-2">
              <span className="h-4 w-[3px] shrink-0 rounded-full bg-brand-blue" />
              <span className="text-[15px] font-semibold text-neutral-dark">{group.label}</span>
            </div>

            {/* 傳票卡片 */}
            <div className="flex flex-col gap-3">
              {group.vouchers.map(voucher => {
                const first = voucher.lines[0];
                return (
                  <div key={voucher.voucherNo} className="rounded-lg border border-neutral-blue-gray/30 bg-white p-3">
                    {/* 卡片標題 */}
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-mid">
                        <span className="font-semibold text-neutral-dark">{fmtRocDate(first.rocDate)}</span>
                        <span className="font-mono">{first.voucherNo}</span>
                      </div>
                      <Link
                        href={`/ledger/${voucher.ledgerUuid}`}
                        title="查看原交易"
                        className="shrink-0 rounded p-1 text-neutral-mid hover:text-brand-blue"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>

                    {/* 分錄列表 */}
                    <div className="flex flex-col divide-y divide-neutral-blue-gray/15">
                      {voucher.lines.map(line => (
                        <div key={line.lineUuid} className="flex items-start justify-between gap-2 py-1.5">
                          <div className="flex min-w-0 flex-col">
                            <span className="text-sm font-medium text-neutral-dark">{line.subjectName}</span>
                            {line.summary && (
                              <span className="text-xs text-neutral-mid truncate">{line.summary}</span>
                            )}
                          </div>
                          <span
                            className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${
                              line.debitCredit === '1' ? 'text-neutral-dark' : 'text-semantic-error'
                            }`}
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
          </div>
        ))}
      </div>
    </>
  );
}
