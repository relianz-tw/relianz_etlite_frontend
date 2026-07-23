'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import TextInput from '@/components/ui/TextInput';
import { fmtCurrency } from '@/lib/utils';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import type { ReportLine, ReportSummary } from '../types';

const thClass = 'whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-3 py-2 text-sm text-neutral-dark';

function ReportTable({ title, lines }: { title: string; lines: ReportLine[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-neutral-blue-gray/30">
      <table className="w-full min-w-[480px] border-collapse">
        <thead className="bg-surface-off-white">
          <tr className="border-b border-neutral-blue-gray/40">
            <th className={thClass}>{title}</th>
            <th className={`${thClass} text-right`}>張數</th>
            <th className={`${thClass} text-right`}>未稅金額</th>
            <th className={`${thClass} text-right`}>營業稅</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => {
            const isTotal = i === lines.length - 1;
            return (
              <tr key={line.label} className={`border-b border-neutral-blue-gray/20 last:border-0 ${isTotal ? 'bg-surface-off-white' : ''}`}>
                <td className={`${tdClass} ${isTotal ? 'font-semibold' : ''}`}>{line.label}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums ${isTotal ? 'font-semibold' : ''}`}>{line.count}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums ${isTotal ? 'font-semibold' : ''}`}>{fmtCurrency(line.untaxed)}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums ${isTotal ? 'font-semibold' : ''}`}>{fmtCurrency(line.tax)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CalcRow({ label, value, editable }: { label: string; value: number; editable?: boolean }) {
  // 僅供模擬編輯：儲存後只影響本 dialog 內顯示，不回寫至 summary（本專案為靜態視覺模擬，無後端）
  const [current, setCurrent] = useState(value);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const handleSave = () => {
    const parsed = Number(draft);
    if (!Number.isNaN(parsed)) setCurrent(parsed);
    setEditing(false);
  };
  const handleCancel = () => {
    setDraft(String(current));
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-neutral-mid">{label}</span>
      {editable ? (
        editing ? (
          <div className="flex items-center gap-2">
            <TextInput
              type="number"
              widthClassName="w-[120px]"
              className="h-8 text-right"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              取消
            </Button>
            <Button size="sm" variant="primary" onClick={handleSave}>
              儲存
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="min-w-[120px] rounded-md border border-neutral-blue-gray/40 bg-surface-off-white px-3 py-1.5 text-right font-mono tabular-nums text-neutral-dark">
              {fmtCurrency(current)}
            </span>
            <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(true)}>
              編輯
            </Button>
          </div>
        )
      ) : (
        <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(value)}</span>
      )}
    </div>
  );
}

export default function TaxReportDialog({ open, onClose, summary }: { open: boolean; onClose: () => void; summary: ReportSummary }) {
  return (
    <Modal open={open} onClose={onClose} title="營業稅申報結果" widthClassName="max-w-[560px]">
      <p className="-mt-3 mb-4 text-xs text-neutral-mid">{summary.period}</p>

      <div className="flex flex-col gap-4">
        <ReportTable title="銷項" lines={summary.sales} />
        <ReportTable title="進項" lines={summary.purchase} />

        <div className="rounded-md border border-neutral-blue-gray/30 p-4">
          <div className="mb-2 text-sm font-semibold text-neutral-dark">稅額計算</div>
          <div className="divide-y divide-neutral-blue-gray/20">
            <CalcRow label="銷項稅額" value={summary.calc.salesTax} />
            <CalcRow label="進項稅額" value={summary.calc.purchaseTax} />
            <CalcRow label="上期留抵" value={summary.calc.prevCredit} />
            <CalcRow label="小計" value={summary.calc.subtotal} />
            <CalcRow label="應納稅額" value={summary.calc.payable} />
            <CalcRow label="本期留抵稅額" value={summary.calc.currentCredit} editable />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="danger" onClick={onClose}>
          核對異常
        </Button>
        <Button variant="primary" onClick={onClose}>
          核對無誤
        </Button>
      </div>
    </Modal>
  );
}
