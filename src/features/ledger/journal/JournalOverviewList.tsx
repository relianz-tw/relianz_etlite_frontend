'use client';

import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Fragment, useState } from 'react';
import type { JournalDateGroup } from './journalGrouping';

const thClass = 'px-3 py-2.5 text-left text-xs font-semibold text-neutral-mid whitespace-nowrap';
const tdClass = 'px-3 py-2 text-sm text-neutral-dark whitespace-nowrap overflow-hidden truncate';
// 摘要欄位可能多行（編輯態為 textarea），不套用 nowrap，並讓多行內容從頂部對齊
const summaryTdClass = 'px-3 py-2 text-sm text-neutral-dark align-top';

/** 民國 YYYMMDD → YYY/MM/DD */
const fmtRocDate = (d: string) => `${d.slice(0, 3)}/${d.slice(3, 5)}/${d.slice(5, 7)}`;

interface JournalOverviewListProps {
  groups: JournalDateGroup[];
  /** 儲存分錄摘要（PATCH /ael/ledger/daily/summary），失敗時 throw 由呼叫端顯示錯誤 */
  onSaveSummary: (lineUuid: string, summary: string) => Promise<void>;
}

/** 摘要欄位 inline 編輯；點擊進入編輯，需按「儲存」才會送出，Esc 或「取消」放棄變更 */
function SummaryCell({ lineUuid, summary, onSaveSummary }: { lineUuid: string; summary: string; onSaveSummary: JournalOverviewListProps['onSaveSummary'] }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(summary);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = () => {
    setDraft(summary);
    setError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError('');
  };

  const commit = async () => {
    if (draft === summary) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSaveSummary(lineUuid, draft);
      setEditing(false);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEdit}
        title={summary || '點擊編輯摘要'}
        className="line-clamp-2 block w-full max-w-[360px] whitespace-normal break-words rounded px-1 py-0.5 text-left hover:bg-surface-cream"
      >
        {summary || <span className="text-neutral-mid">（無摘要）</span>}
      </button>
    );
  }

  return (
    <div className="w-full max-w-[360px]">
      <Textarea
        autoFocus
        rows={3}
        value={draft}
        disabled={saving}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') cancelEdit();
        }}
        className="text-sm"
      />
      <div className="mt-1.5 flex items-center gap-2">
        <Button size="sm" variant="primary" disabled={saving} onClick={commit}>
          {saving ? '儲存中…' : '儲存'}
        </Button>
        <Button size="sm" variant="ghost" disabled={saving} onClick={cancelEdit}>
          取消
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-semantic-error">{error}</p>}
    </div>
  );
}

/** 桌機版：一個大 table，欄寬固定（table-fixed）；手機版：flex div 流 */
export default function JournalOverviewList({ groups, onSaveSummary }: JournalOverviewListProps) {
  return (
    <>
      {/* 桌機版 */}
      <div className="hidden nav:block overflow-x-auto rounded-md border border-neutral-blue-gray/30 bg-white">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[100px]" />
            <col className="w-[140px]" />
            <col className="w-[160px]" />
            <col />
            <col className="w-[140px]" />
            <col className="w-[140px]" />
            <col className="w-10" />
          </colgroup>
          <thead>
            <tr className="border-b border-neutral-blue-gray/40 bg-surface-off-white">
              <th className={thClass}>傳票日期</th>
              <th className={thClass}>傳票編號</th>
              <th className={thClass}>會計科目</th>
              <th className={thClass}>摘要</th>
              <th className={`${thClass} text-right`}>借方金額</th>
              <th className={`${thClass} text-right`}>貸方金額</th>
              <th className="px-2" />
            </tr>
          </thead>
          <tbody>
            {groups.map((group, gIdx) => (
              <Fragment key={group.dateKey}>
                {/* 該日期的傳票分錄行 */}
                {group.vouchers.map((voucher, vIdx) =>
                  voucher.lines.map((line, lineIdx) => {
                    const isFirst = lineIdx === 0;
                    // 每張傳票開頭加粗黑分隔線，區隔不同傳票；整份清單第一張傳票不需要
                    const isNewVoucher = isFirst && !(gIdx === 0 && vIdx === 0);
                    return (
                      <tr
                        key={line.lineUuid}
                        className={`border-b border-neutral-blue-gray/15 hover:bg-brand-blue/5 ${
                          isNewVoucher ? 'border-t-2 border-t-neutral-dark' : ''
                        }`}
                      >
                        <td className={tdClass}>{isFirst ? fmtRocDate(line.rocDate) : ''}</td>
                        <td className={`${tdClass} font-mono`}>{isFirst ? line.voucherNo : ''}</td>
                        <td className={tdClass} title={line.subjectName}>{line.subjectName}</td>
                        <td className={summaryTdClass} onClick={e => e.stopPropagation()}>
                          <SummaryCell lineUuid={line.lineUuid} summary={line.summary} onSaveSummary={onSaveSummary} />
                        </td>
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
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 手機版 */}
      <div className="flex flex-col gap-4 nav:hidden">
        {groups.map((group, gIdx) => (
          <div key={group.dateKey} className={gIdx > 0 ? 'border-t border-neutral-blue-gray/20 pt-4' : ''}>
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
                            <SummaryCell lineUuid={line.lineUuid} summary={line.summary} onSaveSummary={onSaveSummary} />
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
