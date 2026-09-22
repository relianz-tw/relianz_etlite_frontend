'use client';

import type { JournalVoucherDto } from '@/api/types';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency } from '@/lib/utils';
import { Fragment, useState } from 'react';
import VoucherDetailLink from './VoucherDetailLink';

const thClass = 'px-3 py-2.5 text-left text-xs font-semibold text-neutral-mid whitespace-nowrap';
const tdClass = 'px-3 py-2 text-sm text-neutral-dark whitespace-nowrap overflow-hidden truncate';
// 摘要欄位可能多行（編輯態為 textarea），不套用 nowrap，並讓多行內容從頂部對齊
const summaryTdClass = 'px-3 py-2 text-sm text-neutral-dark align-top';

/** 民國 YYYMMDD → YYY/MM/DD */
const fmtRocDate = (d: string) => `${d.slice(0, 3)}/${d.slice(3, 5)}/${d.slice(5, 7)}`;

interface JournalOverviewListProps {
  vouchers: JournalVoucherDto[];
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
export default function JournalOverviewList({ vouchers, onSaveSummary }: JournalOverviewListProps) {
  return (
    <>
      {/* 桌機版 */}
      <div className="hidden nav:block overflow-x-auto rounded-md border border-neutral-blue-gray/30 bg-white">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[100px]" />
            <col className="w-[140px]" />
            <col className="w-[220px]" />
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
            {vouchers.map((voucher, vIdx) => (
              <Fragment key={voucher.ledgerUuid}>
                {voucher.lines.map((line, lineIdx) => {
                  const isFirst = lineIdx === 0;
                  return (
                    <tr key={line.lineUuid} className="border-b border-neutral-blue-gray/15 hover:bg-brand-blue/5">
                      <td className={tdClass}>{isFirst ? fmtRocDate(line.rocDate) : ''}</td>
                      <td className={`${tdClass} font-mono`}>{isFirst ? line.voucherNo : ''}</td>
                      <td className={tdClass} title={`${line.subjectCode ?? ''} ${line.subjectName}`}>
                        {line.subjectCode && <span className="mr-1 font-mono text-xs text-neutral-mid">{line.subjectCode}</span>}
                        {line.subjectName}
                      </td>
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
                        {isFirst && <VoucherDetailLink ledgerUuid={voucher.ledgerUuid} />}
                      </td>
                    </tr>
                  );
                })}
                {/* 傳票小計；黑色粗線區隔不同傳票，整份清單最後一張不畫線 */}
                <tr className={vIdx < vouchers.length - 1 ? 'border-b-2 border-b-neutral-dark' : ''}>
                  <td className={tdClass} />
                  <td className={tdClass} />
                  <td className={tdClass} />
                  <td className={`${tdClass} text-right text-xs font-semibold text-neutral-mid`}>小計</td>
                  <td className={`${tdClass} text-right font-mono tabular-nums font-semibold text-neutral-dark`}>
                    {fmtCurrency(voucher.debitAmountSum)}
                  </td>
                  <td className={`${tdClass} text-right font-mono tabular-nums font-semibold text-neutral-dark`}>
                    {fmtCurrency(voucher.creditAmountSum)}
                  </td>
                  <td className="px-2 py-2" />
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 手機版 */}
      <div className="flex flex-col gap-3 nav:hidden">
        {vouchers.map(voucher => (
          <div key={voucher.ledgerUuid} className="rounded-lg border border-neutral-blue-gray/30 bg-white p-3">
            {/* 卡片標題 */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-mid">
                <span className="font-semibold text-neutral-dark">{fmtRocDate(voucher.rocDate)}</span>
                <span className="font-mono">{voucher.voucherNo}</span>
              </div>
              <VoucherDetailLink
                ledgerUuid={voucher.ledgerUuid}
                className="shrink-0 rounded p-1 text-neutral-mid hover:text-brand-blue"
              />
            </div>

            {/* 分錄列表 */}
            <div className="flex flex-col divide-y divide-neutral-blue-gray/15">
              {voucher.lines.map(line => (
                <div key={line.lineUuid} className="flex items-start justify-between gap-2 py-1.5">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-neutral-dark">
                      {line.subjectCode && <span className="mr-1 font-mono text-xs text-neutral-mid">{line.subjectCode}</span>}
                      {line.subjectName}
                    </span>
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

            {/* 傳票小計 */}
            <div className="mt-1.5 flex items-center justify-between border-t border-neutral-blue-gray/15 pt-1.5 text-xs">
              <span className="font-semibold text-neutral-mid">小計</span>
              <span className="font-mono font-semibold tabular-nums text-neutral-dark">
                借 {fmtCurrency(voucher.debitAmountSum)}　貸 {fmtCurrency(voucher.creditAmountSum)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
